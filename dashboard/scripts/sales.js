const API_BASE = '';
const TAX_RATE = 0.085;

const cameraFeed = document.getElementById('camera-feed');
if (cameraFeed) {
    cameraFeed.setAttribute('playsinline', '');
    cameraFeed.setAttribute('autoplay', '');
    cameraFeed.setAttribute('muted', '');
    cameraFeed.muted = true;
}

const startScannerBtn = document.getElementById('start-scanner');
const stopScannerBtn = document.getElementById('stop-scanner');
const manualEntryBtn = document.getElementById('manual-entry');
const cartItemsContainer = document.getElementById('cart-items');
const emptyCartMessage = document.getElementById('empty-cart-message');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartTaxEl = document.getElementById('cart-tax');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const clearCartBtn = document.getElementById('clear-cart');
const salesTableBody = document.getElementById('sales-table-body');
const newSaleBtn = document.getElementById('new-sale-btn');
const refreshSalesBtn = document.getElementById('refresh-sales');

const salesTotalRevenueEl = document.getElementById('sales-total-revenue');
const salesTransactionCountEl = document.getElementById('sales-transaction-count');
const salesItemsSoldEl = document.getElementById('sales-items-sold');
const salesAverageOrderEl = document.getElementById('sales-average-order');

let cart = [];
let scannerActive = false;
let quaggaInitialized = false;
let lockedBarcode = null;
let lookupInFlight = false;

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

function resetCart() {
    cart = [];
    updateCartDisplay();
}

function updateCartDisplay() {
    if (!cartItemsContainer) {
        return;
    }

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        if (emptyCartMessage) {
            cartItemsContainer.appendChild(emptyCartMessage);
        }
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
        }
        return;
    }

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="item-image">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : '<i class="fas fa-image"></i>'}
            </div>
            <div class="item-details">
                <div class="item-title">${item.name}</div>
                <div class="item-meta">${item.brand ?? ''} ${item.size ? `• ${item.size}` : ''} ${item.color ? `• ${item.color}` : ''}</div>
                <div class="item-quantity">
                    <button class="quantity-btn" data-action="decrease" data-barcode="${item.barcode}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-barcode="${item.barcode}">+</button>
                </div>
            </div>
            <div class="item-price">${formatCurrency(item.price * item.quantity)}</div>
            <button class="remove-item" data-barcode="${item.barcode}"><i class="fas fa-times"></i></button>
        `;

        cartItemsContainer.appendChild(cartItem);
    });

    if (checkoutBtn) {
        checkoutBtn.disabled = false;
    }

    updateCartTotals();
}

function updateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    if (cartSubtotalEl) {
        cartSubtotalEl.textContent = formatCurrency(subtotal);
    }
    if (cartTaxEl) {
        cartTaxEl.textContent = formatCurrency(tax);
    }
    if (cartTotalEl) {
        cartTotalEl.textContent = formatCurrency(total);
    }
}

function addProductToCart(product) {
    const existing = cart.find(item => item.barcode === product.barcode);

    if (existing) {
        if (existing.quantity + 1 > product.stock) {
            alert('Not enough stock to add another item.');
            return;
        }
        existing.quantity += 1;
    } else {
        if (product.stock <= 0) {
            alert('This product is out of stock.');
            return;
        }

        cart.push({
            barcode: product.barcode,
            name: product.name,
            brand: product.brand,
            size: product.size,
            color: product.color,
            price: Number(product.price),
            stock: Number(product.stock),
            image_url: product.image_url,
            quantity: 1,
        });
    }

    updateCartDisplay();
}

function removeProductFromCart(barcode) {
    cart = cart.filter(item => item.barcode !== barcode);
    updateCartDisplay();
}

function adjustQuantity(barcode, direction) {
    const item = cart.find(cartItem => cartItem.barcode === barcode);
    if (!item) {
        return;
    }

    if (direction === 'increase') {
        if (item.quantity + 1 > item.stock) {
            alert('Not enough stock available.');
            return;
        }
        item.quantity += 1;
    } else if (direction === 'decrease') {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            removeProductFromCart(barcode);
            return;
        }
    }

    updateCartDisplay();
}

async function lookupProduct(barcode) {
    try {
        const product = await fetchJson(`${API_BASE}/products/${encodeURIComponent(barcode)}`);
        addProductToCart(product);
    } catch (error) {
        console.error('Product lookup failed:', error);
        alert('Unable to find product for barcode ' + barcode);
    }
}

async function submitSale() {
    if (cart.length === 0) {
        return;
    }

    const items = cart.map(item => ({
        barcode: item.barcode,
        quantity: item.quantity,
    }));

    const payload = {
        items,
        cart_total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        payment_method: 'POS',
        date: new Date().toISOString(),
    };

    try {
        await fetchJson(`${API_BASE}/sales`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        alert('Sale recorded successfully.');
        resetCart();
        await loadSales();
    } catch (error) {
        console.error('Unable to record sale:', error);
        alert('Unable to record the sale. Please try again.');
    }
}

function attachCartListeners() {
    if (!cartItemsContainer) {
        return;
    }

    cartItemsContainer.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) {
            return;
        }

        if (button.classList.contains('remove-item')) {
            const barcode = button.getAttribute('data-barcode');
            removeProductFromCart(barcode);
        }

        if (button.classList.contains('quantity-btn')) {
            const action = button.getAttribute('data-action');
            const barcode = button.getAttribute('data-barcode');
            adjustQuantity(barcode, action);
        }
    });
}

function teardownQuagga() {
    if (!quaggaInitialized) {
        return;
    }

    Quagga.offDetected(handleBarcodeDetected);
    Quagga.stop();
    Quagga.CameraAccess.release();
    quaggaInitialized = false;
}

const handleBarcodeDetected = data => {
    if (!data || !data.codeResult || !data.codeResult.code) {
        return;
    }

    const code = data.codeResult.code.trim();

    if (!code || code === lockedBarcode || lookupInFlight) {
        return;
    }

    lockedBarcode = code;
    lookupInFlight = true;

    lookupProduct(code)
        .catch(error => console.error(error))
        .finally(() => {
            lookupInFlight = false;
            setTimeout(() => {
                lockedBarcode = null;
            }, 1500);
        });
};

async function startScanner() {
    if (!cameraFeed || scannerActive) {
        return;
    }

    try {
        await new Promise((resolve, reject) => {
            const config = {
                inputStream: {
                    type: 'LiveStream',
                    target: cameraFeed,
                    constraints: {
                        facingMode: 'environment',
                    },
                },
                decoder: {
                    readers: [
                        'code_128_reader',
                        'ean_reader',
                        'ean_8_reader',
                        'upc_reader',
                        'upc_e_reader',
                        'code_39_reader',
                        'code_39_vin_reader',
                        'codabar_reader',
                        'i2of5_reader',
                        '2of5_reader',
                    ],
                },
                locate: true,
            };

            Quagga.init(config, err => {
                if (err) {
                    reject(err);
                    return;
                }

                Quagga.onDetected(handleBarcodeDetected);
                Quagga.start();
                quaggaInitialized = true;
                resolve();
            });
        });

        scannerActive = true;
        lockedBarcode = null;

        if (startScannerBtn) {
            startScannerBtn.disabled = true;
        }

        if (stopScannerBtn) {
            stopScannerBtn.disabled = false;
        }
    } catch (error) {
        console.error('Unable to start camera:', error);
        alert('Unable to access camera. Please check permissions and try again.');
        teardownQuagga();
        scannerActive = false;
        if (startScannerBtn) {
            startScannerBtn.disabled = false;
        }
        if (stopScannerBtn) {
            stopScannerBtn.disabled = true;
        }
    }
}

function stopScanner() {
    teardownQuagga();
    scannerActive = false;

    if (cameraFeed && cameraFeed.srcObject) {
        cameraFeed.srcObject.getTracks().forEach(track => track.stop());
        cameraFeed.srcObject = null;
    }

    if (startScannerBtn) {
        startScannerBtn.disabled = false;
    }

    if (stopScannerBtn) {
        stopScannerBtn.disabled = true;
    }
}

function manualEntry() {
    const code = prompt('Enter barcode manually:');
    if (code) {
        lookupProduct(code.trim());
    }
}

async function loadSales() {
    try {
        const sales = await fetchJson(`${API_BASE}/sales`);
        renderSalesTable(sales);
        updateSalesStats(sales);
    } catch (error) {
        console.error('Unable to load sales:', error);
        if (salesTableBody) {
            salesTableBody.innerHTML = '<tr><td colspan="6">Unable to load sales data.</td></tr>';
        }
    }
}

function renderSalesTable(sales) {
    if (!salesTableBody) {
        return;
    }

    salesTableBody.innerHTML = '';

    if (!sales || sales.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'No sales recorded yet.';
        row.appendChild(cell);
        salesTableBody.appendChild(row);
        return;
    }

    sales.forEach(sale => {
        const row = document.createElement('tr');
        const items = Array.isArray(sale.items) ? sale.items : [];
        const itemSummary = items.map(item => `${item.name} (${item.quantity})`).join(', ');

        row.innerHTML = `
            <td>${sale.id}</td>
            <td>${new Date(sale.date).toLocaleString()}</td>
            <td>${itemSummary || 'N/A'}</td>
            <td>${formatCurrency(sale.total)}</td>
            <td><span class="status status-completed">Completed</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" data-id="${sale.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn receipt-btn" data-id="${sale.id}">
                        <i class="fas fa-receipt"></i>
                    </button>
                    <button class="action-btn return-btn" data-id="${sale.id}">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
            </td>
        `;

        salesTableBody.appendChild(row);
    });
}

function updateSalesStats(sales) {
    if (!sales) {
        return;
    }

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const transactionCount = sales.length;
    const itemsSold = sales.reduce((sum, sale) => sum + Number(sale.quantity_sold || 0), 0);
    const averageOrderValue = transactionCount === 0 ? 0 : totalRevenue / transactionCount;

    if (salesTotalRevenueEl) {
        salesTotalRevenueEl.textContent = formatCurrency(totalRevenue);
    }
    if (salesTransactionCountEl) {
        salesTransactionCountEl.textContent = transactionCount.toString();
    }
    if (salesItemsSoldEl) {
        salesItemsSoldEl.textContent = itemsSold.toString();
    }
    if (salesAverageOrderEl) {
        salesAverageOrderEl.textContent = formatCurrency(averageOrderValue);
    }
}

function attachEventListeners() {
    if (newSaleBtn) {
        newSaleBtn.addEventListener('click', () => {
            resetCart();
        });
    }

    if (startScannerBtn) {
        startScannerBtn.addEventListener('click', startScanner);
    }

    if (stopScannerBtn) {
        stopScannerBtn.addEventListener('click', stopScanner);
    }

    if (manualEntryBtn) {
        manualEntryBtn.addEventListener('click', manualEntry);
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', resetCart);
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', submitSale);
    }

    if (refreshSalesBtn) {
        refreshSalesBtn.addEventListener('click', loadSales);
    }

    attachCartListeners();

    if (salesTableBody) {
        salesTableBody.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button) {
                return;
            }

            const saleId = button.getAttribute('data-id');
            if (button.classList.contains('view-btn')) {
                alert(`View details for sale ${saleId}`);
            } else if (button.classList.contains('receipt-btn')) {
                alert(`Generate receipt for sale ${saleId}`);
            } else if (button.classList.contains('return-btn')) {
                alert(`Initiate return for sale ${saleId}`);
            }
        });
    }
}

attachEventListeners();
updateCartDisplay();
loadSales();
