import { db } from './drizzle';
import { sql } from 'drizzle-orm';

async function resetDatabase() {
  console.log('🔄 Resetting database...');
  
  try {
    // Drop all tables
    await db.execute(sql`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    
    console.log('✅ Database reset completed.');
    console.log('📝 Run "pnpm run db:migrate" to apply migrations.');
    console.log('🌱 Run "pnpm run db:seed" to seed the database.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 