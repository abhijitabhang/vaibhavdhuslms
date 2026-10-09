import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🔄 Starting Vaibhav Dhus LMS database migration...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const connection = await pool.getConnection();
    
    // Execute schema statements
    await connection.query(schemaSql);
    connection.release();

    console.log('✅ Database tables created/verified successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
