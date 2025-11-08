const API_BASE = '';

const cameraFeed = document.getElementById('camera-feed');
cameraFeed?.setAttribute('playsinline', '');
cameraFeed?.setAttribute('autoplay', '');
cameraFeed?.setAttribute('muted', '');
if (cameraFeed) {
    cameraFeed.muted = true;
}

const startScannerBtn = document.getElementById('start-scanner');
const stopScannerBtn = document.getElementById('stop-scanner');
const manualEntryBtn = document.getElementById('manual-entry');
const barcodeValue = document.getElementById('barcode-value');
const barcodeFormats = document.getElementById('barcode-formats');
const productImage = document.getElementById('product-image');
const productPlaceholder = document.getElementById('product-placeholder');
const productName = document.getElementById('product-name');
const productBrand = document.getElementById('product-brand');
const productCategory = document.getElementById('product-category');
const productSize = document.getElementById('product-size');
const productColor = document.getElementById('product-color');
const productPrice = document.getElementById('product-price');
const productStock = document.getElementById('product-stock');
const productStatus = document.getElementById('product-status');
const inventoryTableBody = document.getElementById('inventory-table-body');

let scannerActive = false;
let quaggaInitialized = false;
let lockedBarcode = null;
let lookupInFlight = false;
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

function renderInventoryTable(products) {
    if (!inventoryTableBody) {
        return;
    }

    inventoryTableBody.innerHTML = '';

    if (!products || products.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 8;
        cell.textContent = 'No products available. Add a product to get started.';
        row.appendChild(cell);
        inventoryTableBody.appendChild(row);
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        const status = getStockStatus(product.stock);

        row.innerHTML = `
            <td>${product.barcode ?? '-'}</td>
            <td>${product.name ?? '-'}</td>
            <td>${product.category ?? '-'}</td>
            <td>${product.size ?? '-'}</td>
            <td>${product.color ?? '-'}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock ?? 0}</td>
            <td><span class="status status-${status.key}">${status.label}</span></td>
        `;

        inventoryTableBody.appendChild(row);
    });
}

function resetProductDetails() {
    barcodeFormats.innerHTML = '';
    productName.textContent = '-';
    productBrand.textContent = '-';
    productCategory.textContent = '-';
    productSize.textContent = '-';
    productColor.textContent = '-';
    productPrice.textContent = '-';
    productStock.textContent = '-';
    productStatus.textContent = '-';
    productStatus.className = 'status';
    productImage.style.display = 'none';
    productPlaceholder.style.display = 'block';
}

function populateProductDetails(product) {
    if (!product) {
        resetProductDetails();
        return;
    }

    productName.textContent = product.name ?? 'Unknown Product';
    productBrand.textContent = product.brand ?? '-';
    productCategory.textContent = product.category ?? '-';
    productSize.textContent = product.size ?? '-';
    productColor.textContent = product.color ?? '-';
    productPrice.textContent = formatCurrency(product.price);
    productStock.textContent = product.stock ?? 0;

    const status = getStockStatus(product.stock);
    productStatus.textContent = status.label;
    productStatus.className = `status status-${status.key}`;

    if (product.image_url) {
        productImage.src = product.image_url;
        productImage.style.display = 'block';
        productPlaceholder.style.display = 'none';
    } else {
        productImage.removeAttribute('src');
        productImage.style.display = 'none';
        productPlaceholder.style.display = 'block';
    }
}

function displayBarcodeFormats(code) {
    if (!barcodeFormats) {
        return;
    }

    barcodeFormats.innerHTML = '';

    const formats = [
        { name: 'UPC-A', value: code },
        { name: 'EAN-13', value: code },
        { name: 'Code 128', value: `{${code}}` },
        { name: 'Code 39', value: `*${code}*` },
    ];

    formats.forEach(format => {
        const tag = document.createElement('span');
        tag.className = 'format-tag';
        tag.textContent = `${format.name}: ${format.value}`;
        barcodeFormats.appendChild(tag);
    });
}

async function processBarcode(code) {
    if (!code) {
        return;
    }

    if (barcodeValue) {
        barcodeValue.textContent = code;
    }

    displayBarcodeFormats(code);

    try {
        const product = await fetchJson(`${API_BASE}/products/${encodeURIComponent(code)}`);
        populateProductDetails(product);
    } catch (error) {
        console.error('Product lookup failed:', error);
        productName.textContent = 'Product Not Found';
        productBrand.textContent = '-';
        productCategory.textContent = '-';
        productSize.textContent = '-';
        productColor.textContent = '-';
        productPrice.textContent = '-';
        productStock.textContent = '-';
        productStatus.textContent = 'Unknown';
        productStatus.className = 'status';
        productImage.style.display = 'none';
        productPlaceholder.style.display = 'block';
    }
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

    processBarcode(code)
        .catch(error => console.error(error))
        .finally(() => {
            lookupInFlight = false;
            setTimeout(() => {
                lockedBarcode = null;
            }, 1500);
        });
};

function teardownQuagga() {
    if (!quaggaInitialized) {
        return;
    }

    Quagga.offDetected(handleBarcodeDetected);
    Quagga.stop();
    Quagga.CameraAccess.release();
    quaggaInitialized = false;
}

async function startScanner() {
    if (scannerActive) {
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
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
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
        console.error('Error starting scanner:', error);
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

    if (cameraFeed && cameraFeed.srcObject) {
        cameraFeed.srcObject.getTracks().forEach(track => track.stop());
        cameraFeed.srcObject = null;
    }

    lockedBarcode = null;
    scannerActive = false;

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
        processBarcode(code.trim());
    }
}

async function loadInventory() {
    try {
        const products = await fetchJson(`${API_BASE}/products`);
        inventory = products;
        renderInventoryTable(products);
    } catch (error) {
        console.error('Unable to load inventory:', error);
        renderInventoryTable([]);
    }
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

loadInventory();
resetProductDetails();
