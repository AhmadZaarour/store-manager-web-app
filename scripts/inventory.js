// Sample product data
const products = [
    {
        id: 1,
        name: "Classic Cotton T-Shirt",
        sku: "TS-COT-001",
        barcode: "123456789012",
        brand: "FashionBase",
        category: "Tops",
        size: "M",
        color: "White",
        price: "$24.99",
        stock: 45,
        status: "in-stock",
        image: "https://via.placeholder.com/50x50/6c5ce7/ffffff?text=T"
    },
    {
        id: 2,
        name: "Slim Fit Jeans",
        sku: "JE-SLM-032",
        barcode: "234567890123",
        brand: "DenimCo",
        category: "Bottoms",
        size: "32",
        color: "Dark Blue",
        price: "$59.99",
        stock: 12,
        status: "low",
        image: "https://via.placeholder.com/50x50/6c5ce7/ffffff?text=J"
    },
    {
        id: 3,
        name: "Winter Jacket",
        sku: "JK-WIN-001",
        barcode: "345678901234",
        brand: "OutdoorGear",
        category: "Outerwear",
        size: "L",
        color: "Black",
        price: "$129.99",
        stock: 0,
        status: "out",
        image: "https://via.placeholder.com/50x50/6c5ce7/ffffff?text=W"
    },
    {
        id: 4,
        name: "Sports Hoodie",
        sku: "HD-SPT-001",
        barcode: "456789012345",
        brand: "ActiveWear",
        category: "Tops",
        size: "XL",
        color: "Gray",
        price: "$49.99",
        stock: 28,
        status: "in-stock",
        image: "https://via.placeholder.com/50x50/6c5ce7/ffffff?text=H"
    },
    {
        id: 5,
        name: "Summer Dress",
        sku: "DR-SUM-001",
        barcode: "567890123456",
        brand: "Elegance",
        category: "Dresses",
        size: "S",
        color: "Floral",
        price: "$79.99",
        stock: 7,
        status: "low",
        image: "https://via.placeholder.com/50x50/6c5ce7/ffffff?text=D"
    },
    {
        id: 6,
        name: "Casual Blazer",
        sku: "BZ-CAS-001",
        barcode: "678901234567",
        brand: "FashionBase",
        category: "Outerwear",
        size: "M",
        color: "Navy",
        price: "$89.99",
        stock: 15,
        status: "in-stock",
        image: "https://via.placeholder.com/50x50/6c5ce7/ffffff?text=B"
    }
];

// DOM Elements
const inventoryTableBody = document.getElementById('inventory-table-body');
const addProductBtn = document.getElementById('add-product-btn');
const addProductModal = document.getElementById('add-product-modal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelAddBtn = document.getElementById('cancel-add');
const saveProductBtn = document.getElementById('save-product');

// Initialize the inventory table
function initializeInventoryTable() {
    inventoryTableBody.innerHTML = '';
    
    products.forEach(product => {
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
            <td>
                <div class="product-cell">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-sku">SKU: ${product.sku}</div>
                    </div>
                </div>
            </td>
            <td>${product.category}</td>
            <td>${product.brand}</td>
            <td>${product.size}</td>
            <td>${product.color}</td>
            <td>${product.price}</td>
            <td>${product.stock}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn barcode-btn" data-id="${product.id}">
                        <i class="fas fa-barcode"></i>
                    </button>
                </div>
            </td>
        `;
        
        inventoryTableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-id');
            editProduct(productId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-id');
            deleteProduct(productId);
        });
    });

    document.querySelectorAll('.barcode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-id');
            viewBarcode(productId);
        });
    });
}

// Modal functions
function openAddProductModal() {
    addProductModal.style.display = 'flex';
}

function closeAddProductModal() {
    addProductModal.style.display = 'none';
    document.getElementById('add-product-form').reset();
}

// Product management functions
function editProduct(id) {
    alert(`Edit product with ID: ${id}`);
    // In a real application, this would open an edit modal with pre-filled data
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        alert(`Product with ID: ${id} deleted`);
        // In a real application, this would remove the product from the database
    }
}

function viewBarcode(id) {
    const product = products.find(p => p.id == id);
    if (product) {
        alert(`Barcode for ${product.name}: ${product.barcode}`);
        // In a real application, this might open a modal with the barcode image
    }
}

// Event Listeners
addProductBtn.addEventListener('click', openAddProductModal);
closeModalBtn.addEventListener('click', closeAddProductModal);
cancelAddBtn.addEventListener('click', closeAddProductModal);
saveProductBtn.addEventListener('click', () => {
    alert('Product saved successfully!');
    closeAddProductModal();
    // In a real application, this would save the product to the database
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === addProductModal) {
        closeAddProductModal();
    }
});

// Initialize the page
initializeInventoryTable();