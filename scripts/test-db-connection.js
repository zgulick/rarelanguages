const { testConnection } = require('../lib/database');
require('dotenv').config();

console.log('Testing Database Connection...');
// Parse host from DATABASE_URL if present
const dbUrl = process.env.DATABASE_URL;
let connectionHost = 'Not found in DATABASE_URL';
if (dbUrl) {
    try {
        const url = new URL(dbUrl);
        connectionHost = url.hostname;
    } catch (e) {
        connectionHost = 'Invalid URL format';
    }
}

console.log('DB Config Debug:', {
    hasDatabaseUrl: !!dbUrl,
    extractedHost: connectionHost,
    envDbHost: process.env.DB_HOST, // Fallback
});

async function run() {
    console.log('Attempting to connect...');
    const result = await testConnection();
    if (result) {
        console.log('✅ Connection SUCCESS!');
        process.exit(0);
    } else {
        console.error('❌ Connection FAILED.');
        process.exit(1);
    }
}

run();
