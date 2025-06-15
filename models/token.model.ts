import db from '../db/db.ts';

export interface TokenSchema {
  id?: string;
  token: string;
  user: string;
  type: string;
  expires: Date;
  blacklisted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Token {
  /**
   * Create a new token
   */
  static async create(tokenData: Omit<TokenSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<TokenSchema> {
    const id = db.generateId();
    const now = new Date().toISOString();
    const expires = tokenData.expires.toISOString();
    
    const sql = `
      INSERT INTO tokens (id, token, user, type, expires, blacklisted, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.run(sql, [
      id, 
      tokenData.token, 
      tokenData.user, 
      tokenData.type, 
      expires, 
      tokenData.blacklisted, 
      now, 
      now
    ]);
    
    return { 
      ...tokenData, 
      id, 
      createdAt: new Date(now), 
      updatedAt: new Date(now) 
    };
  }

  /**
   * Find token by value
   */
  static async findByToken(token: string): Promise<TokenSchema | null> {
    const sql = `SELECT * FROM tokens WHERE token = ? LIMIT 1`;
    const result = await db.get(sql, [token]);
    if (result) {
      result.expires = new Date(result.expires);
      result.createdAt = new Date(result.createdAt);
      result.updatedAt = new Date(result.updatedAt);
    }
    return result || null;
  }

  /**
   * Find tokens by user ID
   */
  static async findByUserId(userId: string): Promise<TokenSchema[]> {
    const sql = `SELECT * FROM tokens WHERE user = ? ORDER BY createdAt DESC`;
    const results = await db.query(sql, [userId]);
    return results.map(token => ({
      ...token,
      expires: new Date(token.expires),
      createdAt: new Date(token.createdAt),
      updatedAt: new Date(token.updatedAt)
    }));
  }

  /**
   * Blacklist a token
   */
  static async blacklistToken(token: string): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = `UPDATE tokens SET blacklisted = ?, updatedAt = ? WHERE token = ?`;
    const result = await db.run(sql, [true, now, token]);
    return (result.changes || 0) > 0;
  }

  /**
   * Delete expired tokens
   */
  static async deleteExpiredTokens(): Promise<number> {
    const now = new Date().toISOString();
    const sql = `DELETE FROM tokens WHERE expires < ?`;
    const result = await db.run(sql, [now]);
    return result.changes || 0;
  }

  /**
   * Delete tokens by user ID
   */
  static async deleteByUserId(userId: string): Promise<number> {
    const sql = `DELETE FROM tokens WHERE user = ?`;
    const result = await db.run(sql, [userId]);
    return result.changes || 0;
  }

  /**
   * Check if token is valid (not blacklisted and not expired)
   */
  static async isValidToken(token: string): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = `
      SELECT COUNT(*) as count FROM tokens 
      WHERE token = ? AND blacklisted = ? AND expires > ?
    `;
    const result = await db.get(sql, [token, false, now]);
    return result?.count > 0;
  }
}
