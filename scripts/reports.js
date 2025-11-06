// Sample data for reports
const reportData = {
    salesPerformance: {
        labels: ['Oct 1', 'Oct 8', 'Oct 15', 'Oct 22', 'Oct 29', 'Nov 5', 'Nov 12'],
        data: [4200, 5800, 5100, 7200, 6800, 7900, 8300]
    },
    categories: {
        labels: ['Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Accessories'],
        data: [35, 25, 20, 15, 5],
        colors: ['#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e', '#e84393']
    },
    topProducts: [
        {
            name: 'Classic Cotton T-Shirt',
            category: 'Tops',
            unitsSold: 142,
            revenue: 3545.80,
            trend: 'up',
            performance: 95
        },
        {
            name: 'Slim Fit Jeans',
            category: 'Bottoms',
            unitsSold: 98,
            revenue: 5879.02,
            trend: 'up',
            performance: 88
        },
        {
            name: 'Winter Jacket',
            category: 'Outerwear',
            unitsSold: 64,
            revenue: 8319.36,
            trend: 'up',
            performance: 82
        },
        {
            name: 'Sports Hoodie',
            category: 'Tops',
            unitsSold: 57,
            revenue: 2849.43,
            trend: 'neutral',
            performance: 75
        },
        {
            name: 'Summer Dress',
            category: 'Dresses',
            unitsSold: 42,
            revenue: 3359.58,
            trend: 'down',
            performance: 65
        }
    ],
    inventoryAnalysis: [
        {
            name: 'Classic Cotton T-Shirt',
            currentStock: 45,
            sold30Days: 142,
            turnoverRate: 3.2,
            status: 'Optimal',
            action: 'None'
        },
        {
            name: 'Slim Fit Jeans',
            currentStock: 12,
            sold30Days: 98,
            turnoverRate: 8.2,
            status: 'Low Stock',
            action: 'Reorder'
        },
        {
            name: 'Winter Jacket',
            currentStock: 8,
            sold30Days: 64,
            turnoverRate: 8.0,
            status: 'Low Stock',
            action: 'Reorder'
        },
        {
            name: 'Sports Hoodie',
            currentStock: 28,
            sold30Days: 57,
            turnoverRate: 2.0,
            status: 'Optimal',
            action: 'None'
        },
        {
            name: 'Casual Blazer',
            currentStock: 52,
            sold30Days: 23,
            turnoverRate: 0.4,
            status: 'Overstock',
            action: 'Promote'
        }
    ]
};

// DOM Elements
const fromDate = document.getElementById('from-date');
const toDate = document.getElementById('to-date');
const applyDateRange = document.getElementById('apply-date-range');
const quickDateButtons = document.querySelectorAll('.quick-date');
const generateReportBtn = document.getElementById('generate-report');
const topProductsBody = document.getElementById('top-products-body');
const inventoryAnalysisBody = document.getElementById('inventory-analysis-body');

// Initialize charts
function initializeCharts() {
    // Sales Performance Chart
    const salesCtx = document.getElementById('sales-chart').getContext('2d');
    const salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: reportData.salesPerformance.labels,
            datasets: [{
                label: 'Sales ($)',
                data: reportData.salesPerformance.data,
                borderColor: '#6c5ce7',
                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0a0a8'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0a0a8'
                    }
                }
            }
        }
    });

    // Category Sales Chart
    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    const categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: reportData.categories.labels,
            datasets: [{
                data: reportData.categories.data,
                backgroundColor: reportData.categories.colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e4e4e6',
                        padding: 20
                    }
                }
            }
        }
    });
}

// Initialize top products table
function initializeTopProductsTable() {
    topProductsBody.innerHTML = '';
    
    reportData.topProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Determine trend icon and class
        let trendIcon = '';
        let trendClass = '';
        
        if (product.trend === 'up') {
            trendIcon = 'fa-arrow-up';
            trendClass = 'trend-up';
        } else if (product.trend === 'down') {
            trendIcon = 'fa-arrow-down';
            trendClass = 'trend-down';
        } else {
            trendIcon = 'fa-minus';
            trendClass = 'trend-neutral';
        }
        
        // Determine progress bar class
        let progressClass = '';
        if (product.performance >= 90) {
            progressClass = 'progress-success';
        } else if (product.performance >= 70) {
            progressClass = 'progress-primary';
        } else if (product.performance >= 50) {
            progressClass = 'progress-warning';
        } else {
            progressClass = 'progress-danger';
        }
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.unitsSold}</td>
            <td>$${product.revenue.toFixed(2)}</td>
            <td>
                <div class="trend-indicator ${trendClass}">
                    <i class="fas ${trendIcon}"></i>
                    <span>${product.trend}</span>
                </div>
            </td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${product.performance}%"></div>
                </div>
                <small>${product.performance}%</small>
            </td>
        `;
        
        topProductsBody.appendChild(row);
    });
}

// Initialize inventory analysis table
function initializeInventoryAnalysisTable() {
    inventoryAnalysisBody.innerHTML = '';
    
    reportData.inventoryAnalysis.forEach(item => {
        const row = document.createElement('tr');
        
        // Determine status class
        let statusClass = '';
        if (item.status === 'Optimal') {
            statusClass = 'status-optimal';
        } else if (item.status === 'Low Stock') {
            statusClass = 'status-warning';
        } else {
            statusClass = 'status-danger';
        }
        
        // Determine action class
        let actionClass = '';
        if (item.action === 'None') {
            actionClass = 'text-muted';
        } else if (item.action === 'Reorder') {
            actionClass = 'text-warning';
        } else {
            actionClass = 'text-danger';
        }
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.currentStock}</td>
            <td>${item.sold30Days}</td>
            <td>${item.turnoverRate}</td>
            <td><span class="status ${statusClass}">${item.status}</span></td>
            <td class="${actionClass}">${item.action}</td>
        `;
        
        inventoryAnalysisBody.appendChild(row);
    });
}

// Apply date range
function applyDateRangeFilter() {
    const from = fromDate.value;
    const to = toDate.value;
    
    // In a real application, this would fetch new data based on the date range
    alert(`Applying date range: ${from} to ${to}`);
    
    // For demo purposes, we'll just simulate loading new data
    simulateDataRefresh();
}

// Quick date selection
function setQuickDateRange(days, month) {
    const today = new Date();
    const toDate = new Date(today);
    
    let fromDate = new Date(today);
    
    if (days) {
        fromDate.setDate(today.getDate() - days);
    } else if (month === 1) {
        // This month
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (month === 0) {
        // Last month
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        toDate.setDate(0); // Last day of previous month
    }
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    document.getElementById('from-date').value = formatDate(fromDate);
    document.getElementById('to-date').value = formatDate(toDate);
    
    // Apply the new date range
    applyDateRangeFilter();
}

// Simulate data refresh
function simulateDataRefresh() {
    // Show loading state
    generateReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    generateReportBtn.disabled = true;
    
    // Simulate API call delay
    setTimeout(() => {
        // Reset button
        generateReportBtn.innerHTML = '<i class="fas fa-file-export"></i> Generate Report';
        generateReportBtn.disabled = false;
        
        // Show success message
        alert('Report data updated successfully!');
    }, 1500);
}

// Generate report
function generateReport() {
    // In a real application, this would generate a detailed report
    alert('Generating comprehensive report... This may take a moment.');
    
    // Simulate report generation
    setTimeout(() => {
        alert('Report generated successfully! You can now download or print it.');
    }, 2000);
}

// Event Listeners
applyDateRange.addEventListener('click', applyDateRangeFilter);

quickDateButtons.forEach(button => {
    button.addEventListener('click', () => {
        const days = button.getAttribute('data-days');
        const month = button.getAttribute('data-month');
        setQuickDateRange(days ? parseInt(days) : null, month ? parseInt(month) : null);
    });
});

generateReportBtn.addEventListener('click', generateReport);

// Initialize the page
initializeCharts();
initializeTopProductsTable();
initializeInventoryAnalysisTable();