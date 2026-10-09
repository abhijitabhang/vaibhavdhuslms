import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import pool from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test DB connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database pool successfully.');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Vaibhav Dhus LMS Server running at: http://localhost:${PORT}`);
      console.log(`🛡️  Video Security & Session Engine Active`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
