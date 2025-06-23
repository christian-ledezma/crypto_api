import bcrypt from 'bcrypt';
import { db } from './databaseService';
import { User } from '../models/User';

export class UserService {
  // Crear un nuevo usuario
  static async createUser(userData: {
    username: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<User> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('El usuario ya existe con este email');
      }

      // Verificar si el username ya existe
      const existingUsername = await this.getUserByUsername(userData.username);
      if (existingUsername) {
        throw new Error('El username ya está en uso');
      }

      // Hash de la contraseña
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(userData.password_hash, saltRounds);

      // Insertar usuario en la base de datos
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

      const result = await db.execute(query, params);
      const userId = result.insertId;

      const newUser = await this.getUserById(userId);
      if (!newUser) {
        throw new Error('No se pudo recuperar el usuario recién creado');
      }

      return newUser;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  // Obtener usuario por ID
  static async getUserById(id: number): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, email, first_name, last_name, phone, email_verified
        FROM USERS 
        WHERE id = ?
      `;
      
      const result = await db.execute(query, [id]);
      
      if (result.length === 0) {
        return null;
      }

      return this.mapRowToUser(result[0]);
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw error;
    }
  }

  // Obtener usuario por email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, email, first_name, last_name, phone, email_verified
        FROM USERS 
        WHERE email = ?
      `;
      
      const result = await db.execute(query, [email]);
      
      if (result.length === 0) {
        return null;
      }

      return this.mapRowToUser(result[0]);
    } catch (error) {
      console.error('Error al obtener usuario por email:', error);
      throw error;
    }
  }

  // Obtener usuario por username
  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, email, first_name, last_name, phone, email_verified
        FROM USERS
        WHERE username = ?
      `;
      
      const result = await db.execute(query, [username]);
      
      if (result.length === 0) {
        return null;
      }

      return this.mapRowToUser(result[0]);
    } catch (error) {
      console.error('Error al obtener usuario por username:', error);
      throw error;
    }
  }

  // Obtener usuario con contraseña (para autenticación)
  static async getUserWithPassword(email: string): Promise<(User & { password_hash: string }) | null> {
    try {
      const query = `
        SELECT id, username, email, password_hash, first_name, last_name, phone, email_verified
        FROM USERS 
        WHERE email = ?
      `;
      
      const result = await db.execute(query, [email]);
      
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
    } catch (error) {
      console.error('Error al obtener usuario con contraseña:', error);
      throw error;
    }
  }

  // Mapear fila de base de datos a objeto User
  private static mapRowToUser(row: any): User {
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

  // Verificar contraseña
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error al verificar contraseña:', error);
      return false;
    }
  }
}