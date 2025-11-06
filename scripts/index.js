// Sample product data
const products = {
    "123456789012": {
        name: "Classic Cotton T-Shirt",
        brand: "FashionBase",
        category: "Tops",
        size: "M",
        color: "White",
        price: "$24.99",
        stock: 45,
        status: "in-stock",
        image: "https://via.placeholder.com/300x300/6c5ce7/ffffff?text=T-Shirt"
    },
    "234567890123": {
        name: "Slim Fit Jeans",
        brand: "DenimCo",
        category: "Bottoms",
        size: "32",
        color: "Dark Blue",
        price: "$59.99",
        stock: 12,
        status: "low",
        image: "https://via.placeholder.com/300x300/6c5ce7/ffffff?text=Jeans"
    },
    "345678901234": {
        name: "Winter Jacket",
        brand: "OutdoorGear",
        category: "Outerwear",
        size: "L",
        color: "Black",
        price: "$129.99",
        stock: 0,
        status: "out",
        image: "https://via.placeholder.com/300x300/6c5ce7/ffffff?text=Jacket"
    },
    "456789012345": {
        name: "Sports Hoodie",
        brand: "ActiveWear",
        category: "Tops",
        size: "XL",
        color: "Gray",
        price: "$49.99",
        stock: 28,
        status: "in-stock",
        image: "https://via.placeholder.com/300x300/6c5ce7/ffffff?text=Hoodie"
    },
    "567890123456": {
        name: "Summer Dress",
        brand: "Elegance",
        category: "Dresses",
        size: "S",
        color: "Floral",
        price: "$79.99",
        stock: 7,
        status: "low",
        image: "https://via.placeholder.com/300x300/6c5ce7/ffffff?text=Dress"
    }
};

// DOM Elements
const cameraFeed = document.getElementById('camera-feed');
cameraFeed.setAttribute('playsinline', '');
cameraFeed.setAttribute('autoplay', '');
cameraFeed.setAttribute('muted', '');
cameraFeed.muted = true;
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

// Scanner state
let scannerActive = false;
let quaggaInitialized = false;
let lockedBarcode = null;

const handleBarcodeDetected = data => {
    if (!data || !data.codeResult || !data.codeResult.code) {
        return;
    }

    const code = data.codeResult.code.trim();

    if (!code || code === lockedBarcode) {
        return;
    }

    lockedBarcode = code;
    processBarcode(code);
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

// Initialize the inventory table
function initializeInventoryTable() {
    inventoryTableBody.innerHTML = '';
    
    Object.entries(products).forEach(([barcode, product]) => {
        const row = document.createElement('tr');
        
        // Determine status class and text
        let statusClass = '';
        let statusText = '';
        
        if (product.status === 'in-stock') {
            statusClass = 'status-in-stock';
            statusText = 'In Stock';
        } else if (product.status === 'low') {
            statusClass = 'status-low';
            statusText = 'Low Stock';
        } else {
            statusClass = 'status-out';
            statusText = 'Out of Stock';
        }
        
        row.innerHTML = `
            <td>${barcode}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.size}</td>
            <td>${product.color}</td>
            <td>${product.price}</td>
            <td>${product.stock}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
        `;
        
        inventoryTableBody.appendChild(row);
    });
}

// Start the barcode scanner
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
                        height: { ideal: 720 }
                    }
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
                        '2of5_reader'
                    ]
                },
                locate: true
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

        startScannerBtn.disabled = true;
        stopScannerBtn.disabled = false;
    } catch (error) {
        console.error('Error starting scanner:', error);
        alert('Unable to access camera. Please check permissions and try again.');
        teardownQuagga();
        scannerActive = false;
        startScannerBtn.disabled = false;
        stopScannerBtn.disabled = true;
    }
}

// Stop the barcode scanner
function stopScanner() {
    teardownQuagga();

    if (cameraFeed && cameraFeed.srcObject) {
        cameraFeed.srcObject.getTracks().forEach(track => track.stop());
        cameraFeed.srcObject = null;
    }

    lockedBarcode = null;
    scannerActive = false;

    startScannerBtn.disabled = false;
    stopScannerBtn.disabled = true;
}

// Process the scanned barcode
function processBarcode(code) {
    // Display the barcode value
    barcodeValue.textContent = code;
    
    // Generate different format representations
    const formats = [
        { name: 'UPC-A', value: code },
        { name: 'EAN-13', value: code },
        { name: 'Code 128', value: `{${code}}` },
        { name: 'Code 39', value: `*${code}*` }
    ];
    
    // Display format tags
    barcodeFormats.innerHTML = '';
    formats.forEach(format => {
        const tag = document.createElement('span');
        tag.className = 'format-tag';
        tag.textContent = `${format.name}: ${format.value}`;
        barcodeFormats.appendChild(tag);
    });
    
    // Look up product information
    if (products[code]) {
        const product = products[code];
        
        // Update product details
        productName.textContent = product.name;
        productBrand.textContent = product.brand;
        productCategory.textContent = product.category;
        productSize.textContent = product.size;
        productColor.textContent = product.color;
        productPrice.textContent = product.price;
        productStock.textContent = product.stock;
        
        // Update status with appropriate class
        productStatus.textContent = 
            product.status === 'in-stock' ? 'In Stock' : 
            product.status === 'low' ? 'Low Stock' : 'Out of Stock';
        
        productStatus.className = `status status-${product.status}`;
        
        // Update product image
        productImage.src = product.image;
        productImage.style.display = 'block';
        productPlaceholder.style.display = 'none';
    } else {
        // Product not found
        productName.textContent = 'Product Not Found';
        productBrand.textContent = '-';
        productCategory.textContent = '-';
        productSize.textContent = '-';
        productColor.textContent = '-';
        productPrice.textContent = '-';
        productStock.textContent = '-';
        productStatus.textContent = 'Unknown';
        productStatus.className = 'status';
        
        // Hide product image
        productImage.style.display = 'none';
        productPlaceholder.style.display = 'block';
    }
}

// Manual barcode entry
function manualEntry() {
    const code = prompt('Enter barcode manually:');
    if (code) {
        processBarcode(code);
    }
}

// Event Listeners
startScannerBtn.addEventListener('click', startScanner);
stopScannerBtn.addEventListener('click', stopScanner);
manualEntryBtn.addEventListener('click', manualEntry);

// Initialize the page
initializeInventoryTable();

// Demo: Auto-scan a product after 2 seconds for demo purposes
setTimeout(() => {
    processBarcode('123456789012');
}, 2000);