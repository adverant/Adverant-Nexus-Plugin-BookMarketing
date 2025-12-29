/**
 * Database Utility Functions
 */

import { Pool, QueryResult } from 'pg';
import { config } from '../config';
import logger from './logger';

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database pool error:', err);
    });
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    try {
      const result: QueryResult = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result.rows as T[];
    } catch (error) {
      logger.error('Database query error:', { text, error });
      throw error;
    }
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async insert<T = any>(table: string, data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const rows = await this.query<T>(query, values);
    return rows[0];
  }

  async update<T = any>(
    table: string,
    id: string,
    data: Record<string, any>
  ): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const query = `
      UPDATE ${table}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;

    return this.queryOne<T>(query, [...values, id]);
  }

  async delete(table: string, id: string): Promise<boolean> {
    const query = `DELETE FROM ${table} WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new Database();
export default db;
