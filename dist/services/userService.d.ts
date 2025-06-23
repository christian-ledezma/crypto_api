import { User } from '../models/User';
export declare class UserService {
    static createUser(userData: {
        username: string;
        email: string;
        password_hash: string;
        first_name: string;
        last_name: string;
        phone?: string;
    }): Promise<User>;
    static getUserById(id: number): Promise<User | null>;
    static getUserByEmail(email: string): Promise<User | null>;
    static getUserByUsername(username: string): Promise<User | null>;
    static getUserWithPassword(email: string): Promise<(User & {
        password_hash: string;
    }) | null>;
    static updateUser(id: number, updateData: {
        username?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
    }): Promise<User | null>;
    static changePassword(id: number, newPassword: string): Promise<boolean>;
    static verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    static verifyEmail(id: number): Promise<boolean>;
    static deleteUser(id: number): Promise<boolean>;
    static getAllUsers(page?: number, limit?: number): Promise<{
        users: User[];
        totalCount: number;
        totalPages: number;
        currentPage: number;
    }>;
    private static mapRowToUser;
}
//# sourceMappingURL=userService.d.ts.map