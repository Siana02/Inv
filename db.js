// db.js

const mysql = require('mysql2/promise'); // Use 'mysql2/promise' for promise support

const db = mysql.createConnection({
    host: 'localhost',      // Your MySQL host
    user: 'siana',           // Your MySQL username
    password: 'mysqlpassword',           // No password for root user
    database: 'inv'         // Your database name
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to the database.');
});

module.exports = db;
