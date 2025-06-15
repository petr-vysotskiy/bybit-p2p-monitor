import db from '../db/db.ts';

export interface UserHistorySchema {
  id?: string;
  user: string;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  docVersion: number;
  isDisabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserHistory {
  /**
   * Create a new user history record
   */
  static async create(historyData: Omit<UserHistorySchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserHistorySchema> {
    const id = db.generateId();
    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO users_history (id, user, name, email, password, role, docVersion, isDisabled, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.run(sql, [
      id, 
      historyData.user, 
      historyData.name || '', 
      historyData.email || '', 
      historyData.password || '', 
      historyData.role || '', 
      historyData.docVersion, 
      historyData.isDisabled || false, 
      now, 
      now
    ]);
    
    return { 
      ...historyData, 
      id, 
      createdAt: new Date(now), 
      updatedAt: new Date(now) 
    };
  }

  /**
   * Find history by user ID
   */
  static async findByUserId(userId: string): Promise<UserHistorySchema[]> {
    const sql = `SELECT * FROM users_history WHERE user = ? ORDER BY createdAt DESC`;
    const results = await db.query(sql, [userId]);
    return results.map(history => ({
      ...history,
      createdAt: new Date(history.createdAt),
      updatedAt: new Date(history.updatedAt)
    }));
  }

  /**
   * Find history by ID
   */
  static async findById(id: string): Promise<UserHistorySchema | null> {
    const sql = `SELECT * FROM users_history WHERE id = ? LIMIT 1`;
    const result = await db.get(sql, [id]);
    if (result) {
      result.createdAt = new Date(result.createdAt);
      result.updatedAt = new Date(result.updatedAt);
    }
    return result || null;
  }

  /**
   * Get all user history records
   */
  static async findAll(): Promise<UserHistorySchema[]> {
    const sql = `SELECT * FROM users_history ORDER BY createdAt DESC`;
    const results = await db.query(sql);
    return results.map(history => ({
      ...history,
      createdAt: new Date(history.createdAt),
      updatedAt: new Date(history.updatedAt)
    }));
  }

  /**
   * Delete history records by user ID
   */
  static async deleteByUserId(userId: string): Promise<number> {
    const sql = `DELETE FROM users_history WHERE user = ?`;
    const result = await db.run(sql, [userId]);
    return result.changes || 0;
  }

  /**
   * Delete history record by ID
   */
  static async deleteById(id: string): Promise<boolean> {
    const sql = `DELETE FROM users_history WHERE id = ?`;
    const result = await db.run(sql, [id]);
    return (result.changes || 0) > 0;
  }

  /**
   * Get latest version for a user
   */
  static async getLatestVersion(userId: string): Promise<number> {
    const sql = `SELECT MAX(docVersion) as maxVersion FROM users_history WHERE user = ?`;
    const result = await db.get(sql, [userId]);
    return result?.maxVersion || 0;
  }
}
