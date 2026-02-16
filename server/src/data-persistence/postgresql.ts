import { Pool, PoolClient } from "pg";
import { Database } from "../types";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

function buildUpdateSetClause<T extends Record<string, any>>(
    row: T,
    startIndex = 1
): { setClause: string; values: any[] } {
    const keys = Object.keys(row);

    const setClause = keys
        .map((key, i) => `${key}=$${startIndex + i}`)
        .join(", ");

    const values = keys.map((k) => row[k]);

    return { setClause, values };
}

export class PostgresqlDB<T extends Record<string, any>> implements Database<T> {
    private db: Queryable;
    tableName: string;

    constructor(db: Queryable, tableName: string) {
        this.db = db;
        this.tableName = tableName;
    }

    async get(whereClause?: { key: string; value: any }): Promise<T[]> {
        let query = `SELECT * FROM ${this.tableName}`;
        const params: any[] = [];

        if (whereClause) {
            query += ` WHERE ${whereClause.key} = $1`;
            params.push(whereClause.value);
        }

        const result = await this.db.query(query, params);
        return result.rows;
    }

    async create(row: T): Promise<T> {
        const keys = Object.keys(row);
        const values = Object.values(row);

        const columns = keys.join(", ");
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

        const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;

        await this.db.query(query, values);
        return row;
    }

    async update(id: string, row: Partial<T>): Promise<void> {
        const { setClause, values } = buildUpdateSetClause(row as T, 1);

        const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length + 1}`;
        await this.db.query(query, [...values, id]);
    }

    async find(id: string): Promise<T | null> {
        const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
        const result = await this.db.query(query, [id]);
        return result.rows[0] ?? null;
    }

    async query<R = any>(text: string, params: any[] = []): Promise<R[]> {
        const result = await this.db.query(text, params);
        return result.rows as R[];
    }
}
