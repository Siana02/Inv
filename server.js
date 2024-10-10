const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

async function connectToDatabase() {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'siana',
            password: 'mysqlpassword',
            database: 'inv'
        });
        console.log('Connected to the database.');
        return db;
    } catch (err) {
        console.error('Database connection failed:', err.stack);
        throw err;
    }
}

async function startServer() {
    const db = await connectToDatabase();

    function verifyToken(req, res, next) {
        const token = req.header('auth-token');
        if (!token) return res.status(401).send('Access denied.');

        try {
            const verified = jwt.verify(token, process.env.SECRET_KEY || 'SECRET_KEY');
            req.user = verified;
            next();
        } catch (error) {
            res.status(400).send('Invalid token.');
        }
    }

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

    app.post('/register', async (req, res) => {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).send('Name, email, and password are required.');
        }

        try {
            const [existingUser] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
            if (existingUser.length > 0) {
                return res.status(400).send('Email already exists.');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query('INSERT INTO Users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

            res.status(201).send('User registered successfully.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error.');
        }
    });

    app.post('/subscribe', async (req, res) => {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).send('Name and email are required.');
        }

        try {
            await db.query('INSERT INTO Subscribers (name, email) VALUES (?, ?)', [name, email]);
            res.status(201).send('Successfully subscribed to the newsletter.');
        } catch (error) {
            console.error('Error subscribing to newsletter:', error);
            res.status(500).send('Server error. Please try again later.');
        }
    });

    app.post('/login', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Email and password are required.');
        }

        try {
            const [rows] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(400).send('Email not found.');
            }

            const user = rows[0];
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return res.status(400).send('Invalid password.');

            const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY || 'SECRET_KEY');
            res.header('auth-token', token).send({ token });
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error.');
        }
    });

    app.get('/expenses', verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const [expenses] = await db.query('SELECT * FROM Expenses WHERE userId = ?', [userId]);
            res.send(expenses);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error.');
        }
    });

    app.post('/expenses', verifyToken, async (req, res) => {
        const { title, amount } = req.body;

        try {
            const userId = req.user.id;
            await db.query('INSERT INTO Expenses (userId, title, amount) VALUES (?, ?, ?)', [userId, title, amount]);
            res.send('Expense added!');
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error.');
        }
    });

    app.put('/expenses/:id', verifyToken, async (req, res) => {
        const { title, amount } = req.body;
        const expenseId = req.params.id;

        try {
            const userId = req.user.id;
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

    app.delete('/expenses/:id', verifyToken, async (req, res) => {
        const expenseId = req.params.id;

        try {
            const userId = req.user.id;
            const [result] = await db.query('DELETE FROM Expenses WHERE id = ? AND userId = ?', [expenseId, userId]);

            if (result.affectedRows === 0) return res.status(404).send('Expense not found or you do not have permission to delete it.');

            res.send('Expense deleted!');
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error.');
        }
    });

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer().catch(err => console.error('Failed to start server:', err));
