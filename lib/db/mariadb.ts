import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (pool) return pool;

  const host = process.env.MARIADB_HOST;
  if (!host || host === "your_rds_host_here") {
    throw new Error("MARIADB_HOST is not configured");
  }

  pool = mysql.createPool({
    host,
    port: parseInt(process.env.MARIADB_PORT || "3306", 10),
    user: process.env.MARIADB_USER,
    password: process.env.MARIADB_PASSWORD,
    database: process.env.MARIADB_DATABASE || "skysafe",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
  });

  return pool;
}

export async function initUserTable(): Promise<void> {
  const p = getPool();
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
    const host = process.env.MARIADB_HOST;
    if (!host || host === "your_rds_host_here") return false;
    const p = getPool();
    await p.execute("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
