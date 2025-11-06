// Sample product data
const products = {
    "123456789012": {
        id: 1,
        name: "Classic Cotton T-Shirt",
        brand: "FashionBase",
        category: "Tops",
        size: "M",
        color: "White",
        price: 24.99,
        stock: 45,
        image: "https://via.placeholder.com/60x60/6c5ce7/ffffff?text=T"
    },
    "234567890123": {
        id: 2,
        name: "Slim Fit Jeans",
        brand: "DenimCo",
        category: "Bottoms",
        size: "32",
        color: "Dark Blue",
        price: 59.99,
        stock: 12,
        image: "https://via.placeholder.com/60x60/6c5ce7/ffffff?text=J"
    },
    "345678901234": {
        id: 3,
        name: "Winter Jacket",
        brand: "OutdoorGear",
        category: "Outerwear",
        size: "L",
        color: "Black",
        price: 129.99,
        stock: 8,
        image: "https://via.placeholder.com/60x60/6c5ce7/ffffff?text=W"
    },
    "456789012345": {
        id: 4,
        name: "Sports Hoodie",
        brand: "ActiveWear",
        category: "Tops",
        size: "XL",
        color: "Gray",
        price: 49.99,
        stock: 28,
        image: "https://via.placeholder.com/60x60/6c5ce7/ffffff?text=H"
    }
};

// Sample sales data
const recentSales = [
    {
        id: "S-1001",
        date: "2023-11-15 14:30",
        customer: "John Smith",
        items: 3,
        total: 134.97,
        payment: "Credit Card",
        status: "completed"
    },
    {
        id: "S-1002",
        date: "2023-11-15 13:15",
        customer: "Emma Johnson",
        items: 2,
        total: 89.98,
        payment: "Cash",
        status: "completed"
    },
    {
        id: "S-1003",
        date: "2023-11-15 12:05",
        customer: "Michael Brown",
        items: 1,
        total: 59.99,
        payment: "Debit Card",
        status: "completed"
    },
    {
        id: "S-1004",
        date: "2023-11-15 11:20",
        customer: "Sarah Davis",
        items: 4,
        total: 204.96,
        payment: "Credit Card",
        status: "pending"
    },
    {
        id: "S-1005",
        date: "2023-11-14 16:45",
        customer: "Robert Wilson",
        items: 2,
        total: 74.98,
        payment: "Cash",
        status: "cancelled"
    }
];

// DOM Elements
const cameraFeed = document.getElementById('camera-feed');
const startScannerBtn = document.getElementById('start-scanner');
const stopScannerBtn = document.getElementById('stop-scanner');
const manualEntryBtn = document.getElementById('manual-entry');
const cartItems = document.getElementById('cart-items');
const emptyCartMessage = document.getElementById('empty-cart-message');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTax = document.getElementById('cart-tax');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const clearCartBtn = document.getElementById('clear-cart');
const salesTableBody = document.getElementById('sales-table-body');
const newSaleBtn = document.getElementById('new-sale-btn');

// Cart state
let cart = [];
let scannerActive = false;
let stream = null;

// Initialize the sales table
function initializeSalesTable() {
    salesTableBody.innerHTML = '';
    
    recentSales.forEach(sale => {
        const row = document.createElement('tr');
        
        // Determine status class and text
        let statusClass = '';
        let statusText = '';
        
        if (sale.status === 'completed') {
            statusClass = 'status-completed';
            statusText = 'Completed';
        } else if (sale.status === 'pending') {
            statusClass = 'status-pending';
            statusText = 'Pending';
        } else {
            statusClass = 'status-cancelled';
            statusText = 'Cancelled';
        }
        
        row.innerHTML = `
            <td>${sale.id}</td>
            <td>${sale.date}</td>
            <td>${sale.customer}</td>
            <td>${sale.items}</td>
            <td>$${sale.total.toFixed(2)}</td>
            <td>${sale.payment}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
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

    // Add event listeners to action buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const saleId = btn.getAttribute('data-id');
            viewSale(saleId);
        });
    });

    document.querySelectorAll('.receipt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const saleId = btn.getAttribute('data-id');
            printReceipt(saleId);
        });
    });

    document.querySelectorAll('.return-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const saleId = btn.getAttribute('data-id');
            processReturn(saleId);
        });
    });
}

// Update cart display
function updateCartDisplay() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.appendChild(emptyCartMessage);
        checkoutBtn.disabled = true;
    } else {
        emptyCartMessage.remove();
        checkoutBtn.disabled = false;
        
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-info">${item.brand} | ${item.size} | ${item.color}</div>
                    <div class="item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn decrease-btn" data-id="${item.id}">-</button>
                    <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                    <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
                </div>
                <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                <button class="remove-item" data-id="${item.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            cartItems.appendChild(cartItem);
        });
        
        // Add event listeners to cart item buttons
        document.querySelectorAll('.decrease-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-id');
                decreaseQuantity(productId);
            });
        });
        
        document.querySelectorAll('.increase-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-id');
                increaseQuantity(productId);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-id');
                removeFromCart(productId);
            });
        });
    }
    
    updateCartSummary();
}

// Update cart summary
function updateCartSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.085; // 8.5% tax
    const total = subtotal + tax;
    
    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartTax.textContent = `$${tax.toFixed(2)}`;
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Add product to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartDisplay();
}

// Increase item quantity
function increaseQuantity(productId) {
    const item = cart.find(item => item.id == productId);
    if (item) {
        item.quantity += 1;
        updateCartDisplay();
    }
}

// Decrease item quantity
function decreaseQuantity(productId) {
    const item = cart.find(item => item.id == productId);
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            removeFromCart(productId);
            return;
        }
        updateCartDisplay();
    }
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    updateCartDisplay();
}

// Clear cart
function clearCart() {
    if (cart.length > 0 && confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        updateCartDisplay();
    }
}

// Process checkout
function processCheckout() {
    if (cart.length === 0) return;
    
    alert('Processing payment... Sale completed successfully!');
    // In a real application, this would process the payment and complete the sale
    
    // Reset cart after successful checkout
    cart = [];
    updateCartDisplay();
}

// Start the barcode scanner
async function startScanner() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        cameraFeed.srcObject = stream;
        scannerActive = true;
        
        startScannerBtn.disabled = true;
        stopScannerBtn.disabled = false;
        
        // Simulate barcode detection for demo purposes
        simulateBarcodeDetection();
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions and try again.');
    }
}

// Stop the barcode scanner
function stopScanner() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    cameraFeed.srcObject = null;
    scannerActive = false;
    
    startScannerBtn.disabled = false;
    stopScannerBtn.disabled = true;
}

// Simulate barcode detection for demo
function simulateBarcodeDetection() {
    if (!scannerActive) return;
    
    // Randomly select a barcode from our products
    const barcodes = Object.keys(products);
    const randomBarcode = barcodes[Math.floor(Math.random() * barcodes.length)];
    
    // Simulate scanning after a random delay (1-3 seconds)
    setTimeout(() => {
        if (scannerActive) {
            processBarcode(randomBarcode);
            
            // Continue scanning
            simulateBarcodeDetection();
        }
    }, 1000 + Math.random() * 2000);
}

// Process the scanned barcode
function processBarcode(code) {
    if (products[code]) {
        addToCart(products[code]);
    } else {
        alert('Product not found in inventory!');
    }
}

// Manual barcode entry
function manualEntry() {
    const code = prompt('Enter barcode manually:');
    if (code) {
        processBarcode(code);
    }
}

// Sales actions
function viewSale(id) {
    alert(`Viewing details for sale: ${id}`);
}

function printReceipt(id) {
    alert(`Printing receipt for sale: ${id}`);
}

function processReturn(id) {
    if (confirm(`Process return for sale ${id}?`)) {
        alert(`Return processed for sale: ${id}`);
    }
}

// Event Listeners
startScannerBtn.addEventListener('click', startScanner);
stopScannerBtn.addEventListener('click', stopScanner);
manualEntryBtn.addEventListener('click', manualEntry);
checkoutBtn.addEventListener('click', processCheckout);
clearCartBtn.addEventListener('click', clearCart);
newSaleBtn.addEventListener('click', clearCart);

// Initialize the page
initializeSalesTable();
updateCartDisplay();

// Demo: Add a product to cart for demonstration
setTimeout(() => {
    addToCart(products["123456789012"]);
}, 1000);