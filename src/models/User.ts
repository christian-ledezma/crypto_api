export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email_verified: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string; 
  first_name: string;
  last_name: string;
  phone?: string;
  email_verified?: boolean;
}

// Esta interfaz es para crear usuarios en la base de datos
export interface CreateUserInput {
  username: string;
  email: string;
  password_hash: string; // <- Contraseña ya hasheada
  first_name: string;
  last_name: string;
  phone?: string;
  email_verified?: boolean;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email_verified?: boolean;
}

// Define la interfaz para la respuesta de login
export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface UserWithPassword extends User {
  password_hash: string;
}

// Interfaz para el usuario con contraseña (solo para uso interno)
export interface UserWithPassword extends User {
  password_hash: string; 
}