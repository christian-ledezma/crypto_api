"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.transaction = exports.execute = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const config_1 = __importDefault(require("../config"));
const dbConfig = {
    host: config_1.default.database.host,
    port: config_1.default.database.port,
    user: config_1.default.database.user,
    password: config_1.default.database.password,
    database: config_1.default.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00',
    ...(config_1.default.database.DB_SSL_ENABLED && {
        ssl: { rejectUnauthorized: true }
    })
};
const pool = promise_1.default.createPool(dbConfig);
const execute = async (query, params = []) => {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    }
    catch (error) {
        console.error('Error en la consulta SQL:', error);
        throw error;
    }
};
exports.execute = execute;
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
};
exports.transaction = transaction;
exports.db = {
    pool,
    execute: exports.execute,
    transaction: exports.transaction
};
//# sourceMappingURL=databaseService.js.map