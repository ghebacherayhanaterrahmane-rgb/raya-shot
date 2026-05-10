// Product Database (simulated - will be replaced with SQLite API)
let products = [
    {
        id: 1,
        name: "Professional DSLR Camera",
        category: "cameras",
        price: 1299.99,
        description: "High-resolution DSLR camera perfect for professional photography",
        image: "📷"
    },
    {
        id: 2,
        name: "24-70mm Zoom Lens",
        category: "lenses",
        price: 799.99,
        description: "Versatile zoom lens for all occasions",
        image: "🔍"
    },
    {
        id: 3,
        name: "Tripod Stand",
        category: "accessories",
        price: 149.99,
        description: "Sturdy aluminum tripod for stable shots",
        image: "📍"
    },
    {
        id: 4,
        name: "Mirrorless Camera",
        category: "cameras",
        price: 1699.99,
        description: "Compact mirrorless camera with advanced features",
        image: "📸"
    },
    {
        id: 5,
        name: "50mm Prime Lens",
        category: "lenses",
        price: 499.99,
        description: "Fixed focal length lens for sharp, clear images",
        image: "📹"
    },
    {
        id: 6,
        name: "Camera Bag",
        category: "accessories",
        price: 89.99,
        description: "Protective camera bag for safe transport",
        image: "👜"
    },
    {
        id: 7,
        name: "LED Ring Light",
        category: "accessories",
        price: 199.99,
        description: "Professional lighting kit for studio photography",
        image: "💡"
    },
    {
        id: 8,
        name: "70-200mm Telephoto",
        category: "lenses",
        price: 1199.99,
        description: "Long zoom lens for distant subjects",
        image: "🎯"
    }
];

// Shopping Cart
let cart = [];
let currentFilter = 'all';
let currentProduct = null;

// Load products on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupEventListeners();
    updateCart();
});

// Setup Event Listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            loadProducts();
        });
    });

    // Cart modal
    const cartModal = document.getElementById('cart-modal');
    const cartBtn = document.querySelector('.cart-btn');
    const closeButtons = document.querySelectorAll('.close');

    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('show');
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Checkout button
    document.getElementById('checkout-btn').addEventListener('click', goToCheckout);

    // Checkout form
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);

    // Contact form
    document.getElementById('contact-form').addEventListener('submit', handleContactForm);

    // Payment method change
    document.getElementById('payment-method').addEventListener('change', updatePaymentDetails);
}

// Load and display products
function loadProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    const filteredProducts = currentFilter === 'all' 
        ? products 
        : products.filter(p => p.category === currentFilter);

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">${product.image}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-category">${product.category.toUpperCase()}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="viewProduct(${product.id})">View</button>
                    <button class="btn btn-secondary" onclick="quickAddToCart(${product.id})">Add</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// View product details
function viewProduct(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    document.getElementById('detail-name').textContent = currentProduct.name;
    document.getElementById('detail-description').textContent = currentProduct.description;
    document.getElementById('detail-price').textContent = `$${currentProduct.price.toFixed(2)}`;
    document.getElementById('detail-image').textContent = currentProduct.image;
    document.getElementById('detail-qty').value = 1;

    // Update buttons
    document.getElementById('decrease-qty').addEventListener('click', () => {
        let qty = parseInt(document.getElementById('detail-qty').value);
        if (qty > 1) qty--;
        document.getElementById('detail-qty').value = qty;
    });

    document.getElementById('increase-qty').addEventListener('click', () => {
        let qty = parseInt(document.getElementById('detail-qty').value);
        qty++;
        document.getElementById('detail-qty').value = qty;
    });

    document.getElementById('add-to-cart-btn').onclick = () => {
        const qty = parseInt(document.getElementById('detail-qty').value);
        addToCart(currentProduct.id, qty);
        document.getElementById('product-modal').classList.remove('show');
    };

    document.getElementById('product-modal').classList.add('show');
}

// Quick add to cart
function quickAddToCart(productId) {
    addToCart(productId, 1);
}

// Add to cart
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }

    updateCart();
    showNotification(`${product.name} added to cart!`);
}

// Update cart display
function updateCart() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = cartCount;

    // Update cart modal
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        return;
    }

    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>Quantity: ${item.quantity}</p>
                <p>Price: $${item.price.toFixed(2)} each</p>
            </div>
            <div class="cart-item-total">
                $${itemTotal.toFixed(2)}
                <button onclick="removeFromCart(${item.id})" class="btn btn-secondary" style="margin-left: 10px; padding: 0.4rem 0.8rem;">Remove</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    document.getElementById('cart-total').textContent = total.toFixed(2);
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Open cart modal
function openCart() {
    document.getElementById('cart-modal').classList.add('show');
}

// Go to checkout
function goToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    document.getElementById('cart-modal').classList.remove('show');
    document.getElementById('checkout').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update payment details based on selected method
function updatePaymentDetails() {
    const paymentMethod = document.getElementById('payment-method').value;
    const paymentDetails = document.getElementById('payment-details');
    paymentDetails.innerHTML = '';

    if (paymentMethod === 'credit_card') {
        paymentDetails.innerHTML = `
            <div class="form-group">
                <label for="card-number">Card Number</label>
                <input type="text" id="card-number" placeholder="1234 5678 9012 3456" required>
            </div>
            <div class="form-group">
                <label for="card-expiry">Expiry Date (MM/YY)</label>
                <input type="text" id="card-expiry" placeholder="12/26" required>
            </div>
            <div class="form-group">
                <label for="card-cvv">CVV</label>
                <input type="text" id="card-cvv" placeholder="123" required>
            </div>
        `;
    } else if (paymentMethod === 'paypal') {
        paymentDetails.innerHTML = `
            <div class="form-group">
                <label for="paypal-email">PayPal Email</label>
                <input type="email" id="paypal-email" required>
            </div>
        `;
    } else if (paymentMethod === 'stripe') {
        paymentDetails.innerHTML = `
            <div class="form-group">
                <p>You will be redirected to Stripe for payment processing.</p>
            </div>
        `;
    }
}

// Handle checkout
function handleCheckout(e) {
    e.preventDefault();

    const orderData = {
        customer: {
            name: document.getElementById('customer-name').value,
            email: document.getElementById('customer-email').value,
            address: document.getElementById('customer-address').value
        },
        paymentMethod: document.getElementById('payment-method').value,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString()
    };

    // Save order to database (API call)
    saveOrder(orderData);
}

// Save order to database
function saveOrder(orderData) {
    // This will call the backend API
    fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Order placed successfully!');
            cart = [];
            updateCart();
            document.getElementById('checkout').classList.add('hidden');
            document.getElementById('checkout-form').reset();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // For demo purposes, still process the order
        showNotification('Order placed successfully!');
        cart = [];
        updateCart();
        document.getElementById('checkout').classList.add('hidden');
        document.getElementById('checkout-form').reset();
    });
}

// Handle contact form
function handleContactForm(e) {
    e.preventDefault();
    showNotification('Thank you for your message! We will get back to you soon.');
    e.target.reset();
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4caf50;
        color: white;
        padding: 1rem;
        border-radius: 5px;
        z-index: 3000;
        animation: slideIn 0.3s;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
