export interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email_verified: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateUserInput {
    username: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    phone?: string;
}
export interface UpdateUserInput {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email_verified?: boolean;
}
//# sourceMappingURL=User.d.ts.map