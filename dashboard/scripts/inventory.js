const API_BASE = '';

const inventoryTableBody = document.getElementById('inventory-table-body');
const addProductBtn = document.getElementById('add-product-btn');
const addProductModal = document.getElementById('add-product-modal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelAddBtn = document.getElementById('cancel-add');
const saveProductBtn = document.getElementById('save-product');
const addProductForm = document.getElementById('add-product-form');
const refreshInventoryBtn = document.getElementById('refresh-inventory');

const totalProductsEl = document.getElementById('inventory-total-products');
const inStockEl = document.getElementById('inventory-in-stock');
const lowStockEl = document.getElementById('inventory-low-stock');
const outOfStockEl = document.getElementById('inventory-out-of-stock');

let inventory = [];

function formatCurrency(value) {
    const number = Number(value);
    if (Number.isNaN(number)) {
        return '$0.00';
    }

    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(number);
}

function getStockStatus(stock) {
    const quantity = Number(stock) || 0;

    if (quantity === 0) {
        return { key: 'out', label: 'Out of Stock' };
    }

    if (quantity <= 10) {
        return { key: 'low', label: 'Low Stock' };
    }

    return { key: 'in-stock', label: 'In Stock' };
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Request failed');
    }

    return response.json();
}

function updateStats(products) {
    const total = products.length;
    const inStock = products.filter(product => Number(product.stock) > 10).length;
    const lowStock = products.filter(product => Number(product.stock) > 0 && Number(product.stock) <= 10).length;
    const outOfStock = products.filter(product => Number(product.stock) === 0).length;

    if (totalProductsEl) {
        totalProductsEl.textContent = total.toString();
    }
    if (inStockEl) {
        inStockEl.textContent = inStock.toString();
    }
    if (lowStockEl) {
        lowStockEl.textContent = lowStock.toString();
    }
    if (outOfStockEl) {
        outOfStockEl.textContent = outOfStock.toString();
    }
}

function renderInventory(products) {
    if (!inventoryTableBody) {
        return;
    }

    inventoryTableBody.innerHTML = '';

    if (products.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 9;
        cell.textContent = 'No products found. Add a product to populate the inventory.';
        row.appendChild(cell);
        inventoryTableBody.appendChild(row);
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        const status = getStockStatus(product.stock);

        row.innerHTML = `
            <td>
                <div class="product-cell">
                    <div class="product-image">
                        ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}">` : '<i class="fas fa-image"></i>'}
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.name ?? '-'}</div>
                        <div class="product-sku">SKU: ${product.sku ?? 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td>${product.category ?? '-'}</td>
            <td>${product.brand ?? '-'}</td>
            <td>${product.size ?? '-'}</td>
            <td>${product.color ?? '-'}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock ?? 0}</td>
            <td><span class="status status-${status.key}">${status.label}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-barcode="${product.barcode}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-barcode="${product.barcode}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn barcode-btn" data-barcode="${product.barcode}">
                        <i class="fas fa-barcode"></i>
                    </button>
                </div>
            </td>
        `;

        inventoryTableBody.appendChild(row);
    });
}

async function loadInventory() {
    try {
        const products = await fetchJson(`${API_BASE}/products`);
        inventory = products;
        renderInventory(products);
        updateStats(products);
    } catch (error) {
        console.error('Unable to load inventory:', error);
        inventory = [];
        renderInventory([]);
        updateStats([]);
        alert('Unable to load inventory. Please try again later.');
    }
}

function openAddProductModal() {
    if (addProductModal) {
        addProductModal.style.display = 'flex';
    }
}

function closeAddProductModal() {
    if (addProductModal) {
        addProductModal.style.display = 'none';
    }

    addProductForm?.reset();
}

async function createProduct() {
    if (!addProductForm) {
        return;
    }

    if (!addProductForm.reportValidity()) {
        return;
    }

    const formData = new FormData(addProductForm);
    const payload = {
        name: formData.get('name'),
        brand: formData.get('brand') || null,
        category: formData.get('category') || null,
        barcode: formData.get('barcode'),
        size: formData.get('size') || null,
        color: formData.get('color') || null,
        price: Number(formData.get('price')),
        stock: Number(formData.get('stock')),
    };

    try {
        await fetchJson(`${API_BASE}/products`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        closeAddProductModal();
        await loadInventory();
    } catch (error) {
        console.error('Unable to create product:', error);
        alert('Could not create product. Please ensure the barcode is unique and try again.');
    }
}

function attachActionHandlers() {
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddProductModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAddProductModal);
    }

    if (cancelAddBtn) {
        cancelAddBtn.addEventListener('click', event => {
            event.preventDefault();
            closeAddProductModal();
        });
    }

    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', event => {
            event.preventDefault();
            createProduct();
        });
    }

    if (refreshInventoryBtn) {
        refreshInventoryBtn.addEventListener('click', () => {
            loadInventory();
        });
    }

    document.addEventListener('click', event => {
        if (event.target === addProductModal) {
            closeAddProductModal();
        }
    });

    if (inventoryTableBody) {
        inventoryTableBody.addEventListener('click', event => {
            const target = event.target.closest('button');
            if (!target) {
                return;
            }

            if (target.classList.contains('edit-btn')) {
                alert('Editing products is not available yet.');
            } else if (target.classList.contains('delete-btn')) {
                alert('Deleting products is not available yet.');
            } else if (target.classList.contains('barcode-btn')) {
                const barcode = target.getAttribute('data-barcode');
                navigator.clipboard?.writeText(barcode ?? '');
                alert(barcode ? `Barcode ${barcode} copied to clipboard.` : 'Barcode unavailable.');
            }
        });
    }
}

attachActionHandlers();
loadInventory();
