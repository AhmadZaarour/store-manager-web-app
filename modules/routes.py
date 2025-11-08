import json
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from .tables import db, Product, Sale

main = Blueprint(
    'main',
    __name__,
    static_folder='../dashboard',
    template_folder='../dashboard'
)


def product_to_dict(product):
    return {
        "id": product.id,
        "barcode": product.barcode,
        "name": product.name,
        "sku": product.sku,
        "brand": product.brand,
        "category": product.category,
        "size": product.size,
        "color": product.color,
        "stock": product.stock,
        "price": product.price,
        "image_url": product.image_url,
    }


def sale_to_dict(sale):
    try:
        items = json.loads(sale.items)
    except (TypeError, json.JSONDecodeError):
        items = []

    return {
        "id": sale.id,
        "barcode": sale.barcode,
        "items": items,
        "quantity_sold": sale.quantity_sold,
        "total": sale.price,
        "payment_method": sale.payment_method,
        "date": sale.date.isoformat(),
    }


# ---------- Homepage ----------
@main.route('/')
def dashboard():
    return send_from_directory(main.static_folder, 'dashboard.html')


# ---------- Products ----------
@main.route('/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    result = [product_to_dict(product) for product in products]
    return jsonify(result)


@main.route('/products', methods=['POST'])
def add_product():
    data = request.get_json() or {}

    required_fields = ['name', 'barcode', 'price']
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        return jsonify({
            "error": "Missing required fields",
            "details": missing,
        }), 400

    product = Product(
        name=data['name'],
        barcode=data['barcode'],
        sku=data.get('sku'),
        brand=data.get('brand'),
        category=data.get('category'),
        size=data.get('size'),
        color=data.get('color'),
        stock=data.get('stock') or data.get('quantity', 0),
        price=data['price'],
        image_url=data.get('image_url'),
    )

    db.session.add(product)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        return jsonify({
            "error": "Product could not be created",
            "details": str(exc.orig),
        }), 400

    return jsonify(product_to_dict(product)), 201


@main.route('/products/<string:barcode>', methods=['GET'])
def get_product_by_barcode(barcode):
    product = Product.query.filter_by(barcode=barcode).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(product_to_dict(product))


@main.route('/products/<string:barcode>', methods=['PUT', 'PATCH'])
def update_product(barcode):
    product = Product.query.filter_by(barcode=barcode).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json() or {}
    if not data:
        return jsonify({"error": "No data provided"}), 400

    updatable_fields = {
        "name",
        "barcode",
        "sku",
        "brand",
        "category",
        "size",
        "color",
        "stock",
        "price",
        "image_url",
    }

    updates = {key: value for key, value in data.items() if key in updatable_fields}

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    if "barcode" in updates and updates["barcode"] != product.barcode:
        existing = Product.query.filter_by(barcode=updates["barcode"]).first()
        if existing:
            return jsonify({"error": "Barcode already in use"}), 400

    if "sku" in updates and updates["sku"] != product.sku:
        existing = Product.query.filter_by(sku=updates["sku"]).first()
        if existing:
            return jsonify({"error": "SKU already in use"}), 400

    if "stock" in updates:
        try:
            updates["stock"] = int(updates["stock"])
        except (TypeError, ValueError):
            return jsonify({"error": "Stock must be an integer"}), 400
        if updates["stock"] < 0:
            return jsonify({"error": "Stock cannot be negative"}), 400

    if "price" in updates:
        try:
            updates["price"] = float(updates["price"])
        except (TypeError, ValueError):
            return jsonify({"error": "Price must be a number"}), 400

    for key, value in updates.items():
        setattr(product, key, value)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        return jsonify({
            "error": "Product could not be updated",
            "details": str(exc.orig),
        }), 400

    return jsonify(product_to_dict(product))


@main.route('/products/<string:barcode>', methods=['DELETE'])
def delete_product(barcode):
    product = Product.query.filter_by(barcode=barcode).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    db.session.delete(product)
    db.session.commit()

    return jsonify({"status": "deleted", "barcode": barcode})


@main.route('/products/<string:barcode>/stock', methods=['POST'])
def adjust_stock(barcode):
    product = Product.query.filter_by(barcode=barcode).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json() or {}

    if "adjustment" in data:
        try:
            adjustment = int(data["adjustment"])
        except (TypeError, ValueError):
            return jsonify({"error": "Adjustment must be an integer"}), 400
        new_stock = product.stock + adjustment
    elif "stock" in data:
        try:
            new_stock = int(data["stock"])
        except (TypeError, ValueError):
            return jsonify({"error": "Stock must be an integer"}), 400
    else:
        return jsonify({"error": "Provide an adjustment or stock value"}), 400

    if new_stock < 0:
        return jsonify({"error": "Stock cannot be negative"}), 400

    product.stock = new_stock
    db.session.commit()

    return jsonify({
        "product": product_to_dict(product),
        "stock": product.stock,
    })


@main.route('/inventory/summary', methods=['GET'])
def inventory_summary():
    total_products = Product.query.count()
    in_stock = Product.query.filter(Product.stock > 10).count()
    low_stock = Product.query.filter(Product.stock > 0, Product.stock <= 10).count()
    out_of_stock = Product.query.filter(Product.stock <= 0).count()
    total_value = (
        db.session.query(func.coalesce(func.sum(Product.stock * Product.price), 0.0)).scalar()
    )

    return jsonify({
        "total_products": total_products,
        "in_stock": in_stock,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "inventory_value": round(float(total_value or 0.0), 2),
    })


# ---------- Sales ----------
@main.route('/sales', methods=['POST'])
def record_sale():
    data = request.get_json() or {}

    items = data.get('items', [])
    if not items:
        return jsonify({"error": "No items provided"}), 400

    try:
        sale_date = datetime.fromisoformat(data['date']) if data.get('date') else datetime.utcnow()
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    processed_items = []
    quantity_sold = 0

    for raw_item in items:
        barcode = raw_item.get('barcode')
        quantity = int(raw_item.get('quantity', 1))

        if not barcode:
            return jsonify({"error": "Item barcode is required"}), 400

        product = Product.query.filter_by(barcode=barcode).first()
        if not product:
            return jsonify({"error": f"Product with barcode {barcode} not found"}), 404

        if product.stock < quantity:
            return jsonify({
                "error": f"Insufficient stock for {product.name}",
                "available": product.stock,
            }), 400

        product.stock -= quantity
        quantity_sold += quantity

        processed_items.append({
            "barcode": product.barcode,
            "name": product.name,
            "quantity": quantity,
            "unit_price": product.price,
        })

    sale = Sale(
        barcode=processed_items[0]['barcode'] if len(processed_items) == 1 else 'MULTI',
        items=json.dumps(processed_items),
        quantity_sold=quantity_sold,
        price=float(data.get('cart_total', 0)),
        payment_method=data.get('payment_method', 'Unknown'),
        date=sale_date,
    )

    db.session.add(sale)
    db.session.commit()

    return jsonify(sale_to_dict(sale)), 201


@main.route('/sales', methods=['GET'])
def get_sales():
    sales = Sale.query.all()
    result = [sale_to_dict(sale) for sale in sales]
    return jsonify(result)
