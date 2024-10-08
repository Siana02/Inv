import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
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
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return res.status(400).send('Invalid password.');

            const token = jwt.sign({ id: user.id }, 'SECRET_KEY'); // Use environment variable for secret
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
