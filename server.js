const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create a connection to the database inside an async function
async function connectToDatabase() {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',      // Your MySQL host
            user: 'siana',          // Your MySQL username
            password: 'mysqlpassword', // Replace with your actual password
            database: 'inv'         // Your database name
        });
        console.log('Connected to the database.');
        return db; // Return the database connection
    } catch (err) {
        console.error('Database connection failed:', err.stack);
        throw err; // Rethrow the error for handling elsewhere
    }
}

// Start the server and connect to the database
async function startServer() {
    const db = await connectToDatabase();

const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.header('auth-token'); // Get the token from the request header
    if (!token) return res.status(401).send('Access denied.'); // If no token, deny access

    try {
        const verified = jwt.verify(token, process.env.SECRET_KEY || 'SECRET_KEY'); // Verify the token
        req.user = verified; // Attach the user data to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        res.status(400).send('Invalid token.'); // If token verification fails
    }
}



    // Serve static HTML pages
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    app.get('/about-us', (req, res) => {
        res.sendFile(path.join(__dirname, 'about-us.html'));
    });

    app.get('/contact', (req, res) => {
        res.sendFile(path.join(__dirname, 'contact.html'));
    });

    app.get('/dashboard', (req, res) => {
        res.sendFile(path.join(__dirname, 'dash.html'));
    });

    app.get('/add-expense', (req, res) => {
        res.sendFile(path.join(__dirname, 'add-expense.html'));
    });

    app.get('/edit-expense', (req, res) => {
        res.sendFile(path.join(__dirname, 'edit-expense.html'));
    });

    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, 'login.html'));
    });

    app.get('/sign-up', (req, res) => {
        res.sendFile(path.join(__dirname, 'sign-up.html'));
    });




// POST: Registration Route
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body; // Include 'name' if necessary

    // Check if all required fields are provided
    if (!name || !email || !password) {
        return res.status(400).send('Name, email, and password are required.');
    }

    try {
        // Check if the email already exists
        const [existingUser] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).send('Email already exists.');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // Use 10 salt rounds

        // Insert new user into the database
        await db.query('INSERT INTO Users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        res.status(201).send('User registered successfully.');
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send('Server error.');
    }
});



// Subscribe route
app.post('/subscribe', async (req, res) => {
    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
        return res.status(400).send('Name and email are required.');
    }

    try {
        // Insert the subscriber into the database
        await db.query('INSERT INTO Subscribers (name, email) VALUES (?, ?)', [name, email]);
        res.status(201).send('Successfully subscribed to the newsletter.');
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        res.status(500).send('Server error. Please try again later.');
    }
});








    // POST: Login Route
    app.post('/login', async (req, res) => {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).send('Email and password are required.');
        }

        try {
            // Replace with your SQL query
            const [rows] = await db.query('SELECT * FROM Users WHERE email = ?', [email]); // Using a placeholder for safety
            if (rows.length === 0) {
                return res.status(400).send('Email not found.');
            }

            const user = rows[0]; // Assuming the first result is the user

            // Replace this with your password verification logic

        // Verify the password
        const validPassword = await bcrypt.compare(password, user.password); // Compare input password with hashed password
        if (!validPassword) return res.status(400).send('Invalid password.');

        // Generate a token
        const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY || 'SECRET_KEY'); // Use environment variable for the secret key

        // Send the token in the response
        res.header('auth-token', token).send({ token });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send('Server error.');
    }
});




    // Get expenses for a specific user
    app.get('/expenses', verifyToken, async (req, res) => {
        try {
            const userId = req.user.id; // Assuming you stored user ID in the token payload
            const [expenses] = await db.query('SELECT * FROM Expenses WHERE userId = ?', [userId]);
            res.send(expenses);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error.');
        }
    });

    // Add new expense
    app.post('/expenses', verifyToken, async (req, res) => {
        const { title, amount } = req.body;

        try {
            const userId = req.user.id; // Assuming you stored user ID in the token payload
            await db.query('INSERT INTO Expenses (userId, title, amount) VALUES (?, ?, ?)', [userId, title, amount]);
            res.send('Expense added!');
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error.');
        }
    });

    // Update an expense
    app.put('/expenses/:id', verifyToken, async (req, res) => {
        const { title, amount } = req.body;
        const expenseId = req.params.id;

        try {
            const userId = req.user.id; // Assuming you stored user ID in the token payload
            const [result] = await db.query(
                'UPDATE Expenses SET title = ?, amount = ? WHERE id = ? AND userId = ?',
                [title, amount, expenseId, userId]
            );

            if (result.affectedRows === 0) return res.status(404).send('Expense not found or you do not have permission to update it.');

            res.send('Expense updated!');
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error.');
        }
    });

    // Delete an expense
    app.delete('/expenses/:id', verifyToken, async (req, res) => {
        const expenseId = req.params.id;

        try {
            const userId = req.user.id; // Assuming you stored user ID in the token payload
            const [result] = await db.query('DELETE FROM Expenses WHERE id = ? AND userId = ?', [expenseId, userId]);

            if (result.affectedRows === 0) return res.status(404).send('Expense not found or you do not have permission to delete it.');

            res.send('Expense deleted!');
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error.');
        }
    });

    // Start the server
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Call the function to start the server
startServer().catch(err => console.error('Failed to start server:', err));
