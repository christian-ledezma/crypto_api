import mysql from 'mysql2/promise';
export declare const execute: (query: string, params?: any[]) => Promise<any>;
export declare const transaction: (callback: (connection: mysql.PoolConnection) => Promise<any>) => Promise<any>;
export declare const db: {
    pool: mysql.Pool;
    execute: (query: string, params?: any[]) => Promise<any>;
    transaction: (callback: (connection: mysql.PoolConnection) => Promise<any>) => Promise<any>;
};
//# sourceMappingURL=databaseService.d.ts.map