const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// SQLite Database Setup
const db = new sqlite3.Database('./raya-shot.db', (err) => {
    if (err) {
        console.error('Database opening error:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize Database Tables
function initializeDatabase() {
    // Products Table
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            image TEXT,
            stock INTEGER DEFAULT 10,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Orders Table
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_address TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Order Items Table
    db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    // Insert sample products
    const sampleProducts = [
        ('Professional DSLR Camera', 'cameras', 1299.99, 'High-resolution DSLR camera perfect for professional photography', '📷'),
        ('24-70mm Zoom Lens', 'lenses', 799.99, 'Versatile zoom lens for all occasions', '🔍'),
        ('Tripod Stand', 'accessories', 149.99, 'Sturdy aluminum tripod for stable shots', '📍'),
        ('Mirrorless Camera', 'cameras', 1699.99, 'Compact mirrorless camera with advanced features', '📸'),
        ('50mm Prime Lens', 'lenses', 499.99, 'Fixed focal length lens for sharp, clear images', '📹'),
        ('Camera Bag', 'accessories', 89.99, 'Protective camera bag for safe transport', '👜'),
        ('LED Ring Light', 'accessories', 199.99, 'Professional lighting kit for studio photography', '💡'),
        ('70-200mm Telephoto', 'lenses', 1199.99, 'Long zoom lens for distant subjects', '🎯')
    ];

    sampleProducts.forEach(product => {
        db.run(
            `INSERT OR IGNORE INTO products (name, category, price, description, image) 
             VALUES (?, ?, ?, ?, ?)`,
            product
        );
    });

    console.log('Database initialized');
}

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(row);
    });
});

// Create order
app.post('/api/orders', (req, res) => {
    const { customer, paymentMethod, items, total } = req.body;

    // Validate input
    if (!customer || !customer.name || !customer.email || !customer.address || !paymentMethod || !items) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
    }

    // Insert order
    db.run(
        `INSERT INTO orders (customer_name, customer_email, customer_address, payment_method, total_amount) 
         VALUES (?, ?, ?, ?, ?)`,
        [customer.name, customer.email, customer.address, paymentMethod, total],
        function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }

            const orderId = this.lastID;

            // Insert order items
            let completed = 0;
            items.forEach(item => {
                db.run(
                    `INSERT INTO order_items (order_id, product_id, quantity, price) 
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.id, item.quantity, item.price],
                    (err) => {
                        if (err) {
                            console.error('Error inserting order item:', err);
                        }
                        completed++;
                        if (completed === items.length) {
                            res.json({
                                success: true,
                                orderId: orderId,
                                message: 'Order created successfully'
                            });
                        }
                    }
                );
            });
        }
    );
});

// Get all orders
app.get('/api/orders', (req, res) => {
    db.all('SELECT * FROM orders ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get order by ID
app.get('/api/orders/:id', (req, res) => {
    db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, order) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Get order items
        db.all(
            `SELECT oi.*, p.name FROM order_items oi 
             JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id = ?`,
            [req.params.id],
            (err, items) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ ...order, items });
            }
        );
    });
});

// Add new product
app.post('/api/products', (req, res) => {
    const { name, category, price, description, image } = req.body;

    if (!name || !category || !price) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
    }

    db.run(
        `INSERT INTO products (name, category, price, description, image) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, category, price, description, image],
        function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }
            res.json({
                success: true,
                productId: this.lastID,
                message: 'Product created successfully'
            });
        }
    );
});

// Update product
app.put('/api/products/:id', (req, res) => {
    const { name, category, price, description, image } = req.body;

    db.run(
        `UPDATE products SET name = ?, category = ?, price = ?, description = ?, image = ? 
         WHERE id = ?`,
        [name, category, price, description, image, req.params.id],
        (err) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }
            res.json({ success: true, message: 'Product updated successfully' });
        }
    );
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
            return;
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    db.close();
    process.exit(0);
});
