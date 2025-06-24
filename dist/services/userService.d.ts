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
    private static mapRowToUser;
    static verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
//# sourceMappingURL=userService.d.ts.map