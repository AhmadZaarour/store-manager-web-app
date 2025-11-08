from . import db

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barcode = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    sku = db.Column(db.String(50), unique=True)
    brand = db.Column(db.String(100))
    category = db.Column(db.String(100))
    size = db.Column(db.String(10))
    color = db.Column(db.String(50))
    stock = db.Column(db.Integer, default=0)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(200))


class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barcode = db.Column(db.String(50), nullable=False)
    items = db.Column(db.Text, nullable=False)
    quantity_sold = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default="Unknown", nullable=False)
    date = db.Column(db.DateTime, nullable=False)
