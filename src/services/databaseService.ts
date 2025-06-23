import mysql from 'mysql2/promise';
import config from '../config';

const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
   ...(config.database.DB_SSL_ENABLED && {
    ssl: { rejectUnauthorized: true }
  })
};


// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para ejecutar queries
export const execute = async (query: string, params: any[] = []): Promise<any> => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error en la consulta SQL:', error);
    throw error;
  }
};

// Función para transacciones
export const transaction = async (callback: (connection: mysql.PoolConnection) => Promise<any>): Promise<any> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const db = {
  pool,
  execute,
  transaction
};