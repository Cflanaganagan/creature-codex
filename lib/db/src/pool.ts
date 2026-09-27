import pg from "pg";
export const databaseConfigured = Boolean(process.env.DATABASE_URL);
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 8, connectionTimeoutMillis: 10000 });
export const usagePool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 10000 });
