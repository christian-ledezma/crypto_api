"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const databaseService_1 = require("./databaseService");
class UserService {
    static async createUser(userData) {
        try {
            const existingUser = await this.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('El usuario ya existe con este email');
            }
            const existingUsername = await this.getUserByUsername(userData.username);
            if (existingUsername) {
                throw new Error('El username ya está en uso');
            }
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
            const passwordHash = await bcrypt_1.default.hash(userData.password_hash, saltRounds);
            const query = `
        INSERT INTO USERS (username, email, password_hash, first_name, last_name, phone, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, FALSE)
      `;
            const params = [
                userData.username,
                userData.email,
                passwordHash,
                userData.first_name,
                userData.last_name,
                userData.phone || null
            ];
            const result = await databaseService_1.db.execute(query, params);
            const userId = result.insertId;
            const newUser = await this.getUserById(userId);
            if (!newUser) {
                throw new Error('No se pudo recuperar el usuario recién creado');
            }
            return newUser;
        }
        catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }
    static async getUserById(id) {
        try {
            const query = `
        SELECT id, username, email, first_name, last_name, phone, email_verified
        FROM USERS 
        WHERE id = ?
      `;
            const result = await databaseService_1.db.execute(query, [id]);
            if (result.length === 0) {
                return null;
            }
            return this.mapRowToUser(result[0]);
        }
        catch (error) {
            console.error('Error al obtener usuario por ID:', error);
            throw error;
        }
    }
    static async getUserByEmail(email) {
        try {
            const query = `
        SELECT id, username, email, first_name, last_name, phone, email_verified
        FROM USERS 
        WHERE email = ?
      `;
            const result = await databaseService_1.db.execute(query, [email]);
            if (result.length === 0) {
                return null;
            }
            return this.mapRowToUser(result[0]);
        }
        catch (error) {
            console.error('Error al obtener usuario por email:', error);
            throw error;
        }
    }
    static async getUserByUsername(username) {
        try {
            const query = `
        SELECT id, username, email, first_name, last_name, phone, email_verified
        FROM USERS
        WHERE username = ?
      `;
            const result = await databaseService_1.db.execute(query, [username]);
            if (result.length === 0) {
                return null;
            }
            return this.mapRowToUser(result[0]);
        }
        catch (error) {
            console.error('Error al obtener usuario por username:', error);
            throw error;
        }
    }
    static async getUserWithPassword(email) {
        try {
            const query = `
        SELECT id, username, email, password_hash, first_name, last_name, phone, email_verified
        FROM USERS 
        WHERE email = ?
      `;
            const result = await databaseService_1.db.execute(query, [email]);
            if (result.length === 0) {
                return null;
            }
            const row = result[0];
            return {
                id: row.id,
                username: row.username,
                email: row.email,
                password_hash: row.password_hash,
                first_name: row.first_name,
                last_name: row.last_name,
                phone: row.phone,
                email_verified: row.email_verified,
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        }
        catch (error) {
            console.error('Error al obtener usuario con contraseña:', error);
            throw error;
        }
    }
    static mapRowToUser(row) {
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            password_hash: row.password_hash,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone,
            email_verified: row.email_verified,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }
    static async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt_1.default.compare(plainPassword, hashedPassword);
        }
        catch (error) {
            console.error('Error al verificar contraseña:', error);
            return false;
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map