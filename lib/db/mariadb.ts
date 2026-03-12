import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (pool) return pool;

  const uri = process.env.MARIADB_URI;
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  if (!uri || uri === "your_mariadb_connection_string_here") {
    if (isBuildPhase) {
      console.warn("MARIADB_URI is not available during build phase. Database operations will fail if called.");
      return null as any;
    }
    console.error("MARIADB_URI check failed.");
    console.error("MARIADB_URI present:", !!process.env.MARIADB_URI);
    console.error("MARIADB_URI value length:", process.env.MARIADB_URI?.length || 0);
    console.error("MARIADB_URI is placeholder:", process.env.MARIADB_URI === "your_mariadb_connection_string_here");
    
    const mariaKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes("MARIA"));
    console.error("MARIA-related keys found:", mariaKeys.join(", "));
    
    throw new Error("MARIADB_URI is not configured");
  }

  // Strip quotes
  const cleanUri = uri.startsWith('"') && uri.endsWith('"') ? uri.slice(1, -1) : uri;
  pool = mysql.createPool(cleanUri);
  return pool;
}

export async function initUserTable(): Promise<void> {
  const p = getPool();
  if (!p) {
    console.warn("Skipping user table initialization: MariaDB pool not available.");
    return;
  }
  await p.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    )
  `);
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const p = getPool();
  const [rows] = await p.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  if (!rows || rows.length === 0) return null;
  return rows[0] as UserRow;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string
): Promise<number> {
  const p = getPool();
  const [result] = await p.execute<mysql.ResultSetHeader>(
    "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
    [email, passwordHash, name]
  );
  return result.insertId;
}

export async function isMariaDBAvailable(): Promise<boolean> {
  try {
    const p = getPool();
    if (!p) return false;
    await p.execute("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
