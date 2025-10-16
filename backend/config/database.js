const { Pool } = require('pg');
require('dotenv').config();

// Cấu hình connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Function to test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Testing database connection...');
        client.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
};

// Function to execute queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query executed:', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Query error:', error.message);
        throw error;
    }
};

// Function to get a client from pool for transactions
const getClient = async () => {
    try {
        const client = await pool.connect();
        return client;
    } catch (error) {
        console.error('Error getting client from pool:', error.message);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    getClient,
    testConnection
};