// File: database/database.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Define the database directory and path
const dbDir = path.join(__dirname, '..', 'db');
const dbPath = path.join(dbDir, 'user_management.db');

// Check if the database directory exists, and create it if it doesn't.
if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to the database. The file will be created automatically if it doesn't exist.
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDatabase(); // Initialize tables after successful connection
    }
});

/**
 * Initializes the database tables and pre-fills manager data.
 */
function initDatabase() {
    db.serialize(() => {
        // Create Managers table
        db.run(`
            CREATE TABLE IF NOT EXISTS managers (
                manager_id TEXT PRIMARY KEY,
                manager_name TEXT NOT NULL,
                is_active INTEGER NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('Error creating Managers table:', err.message);
            } else {
                console.log('Managers table created.');
                prefillManagers();
            }
        });

        // Create Users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                mob_num TEXT UNIQUE NOT NULL,
                pan_num TEXT UNIQUE NOT NULL,
                manager_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                is_active INTEGER NOT NULL,
                FOREIGN KEY (manager_id) REFERENCES managers(manager_id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating Users table:', err.message);
            } else {
                console.log('Users table created.');
            }
        });
    });
}

/**
 * Fills the managers table with sample data if it's empty.
 */
function prefillManagers() {
    db.get("SELECT COUNT(*) as count FROM managers", (err, row) => {
        if (err) {
            console.error('Error checking managers table count:', err.message);
            return;
        }
        if (row.count === 0) {
            console.log('Managers table is empty, pre-filling with sample data.');
            const stmt = db.prepare("INSERT INTO managers (manager_id, manager_name, is_active) VALUES (?, ?, ?)");
            stmt.run(uuidv4(), 'Manager A', 1);
            stmt.run(uuidv4(), 'Manager B', 1);
            stmt.run(uuidv4(), 'Inactive Manager', 0);
            stmt.finalize(() => {
                console.log('Managers table pre-filled with sample data.');
            });
        }
    });
}

// Export the database connection for use in controllers
module.exports = db;