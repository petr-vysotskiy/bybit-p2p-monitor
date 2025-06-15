import db from '../db/db.ts';

export interface UserSchema {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  docVersion: number;
  isDisabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  /**
   * Create a new user
   */
  static async create(userData: Omit<UserSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSchema> {
    const id = db.generateId();
    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO users (id, name, email, password, role, docVersion, isDisabled, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.run(sql, [
      id, 
      userData.name, 
      userData.email, 
      userData.password, 
      userData.role, 
      userData.docVersion, 
      userData.isDisabled, 
      now, 
      now
    ]);
    
    return { ...userData, id, createdAt: new Date(now), updatedAt: new Date(now) };
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<UserSchema | null> {
    const sql = `SELECT * FROM users WHERE email = ? LIMIT 1`;
    const result = await db.get(sql, [email]);
    return result || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<UserSchema | null> {
    const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
    const result = await db.get(sql, [id]);
    return result || null;
  }

  /**
   * Find all users
   */
  static async findAll(): Promise<UserSchema[]> {
    const sql = `SELECT * FROM users ORDER BY createdAt DESC`;
    return await db.query(sql);
  }

  /**
   * Update user by ID
   */
  static async updateById(id: string, updateData: Partial<UserSchema>): Promise<UserSchema | null> {
    const now = new Date().toISOString();
    const fields = Object.keys(updateData).filter(key => key !== 'id' && key !== 'createdAt');
    
    if (fields.length === 0) return null;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field as keyof UserSchema]);
    
    const sql = `UPDATE users SET ${setClause}, updatedAt = ? WHERE id = ?`;
    await db.run(sql, [...values, now, id]);
    
    return await User.findById(id);
  }

  /**
   * Delete user by ID
   */
  static async deleteById(id: string): Promise<boolean> {
    const sql = `DELETE FROM users WHERE id = ?`;
    const result = await db.run(sql, [id]);
    return (result.changes || 0) > 0;
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const sql = `SELECT COUNT(*) as count FROM users WHERE email = ?`;
    const result = await db.get(sql, [email]);
    return result?.count > 0;
  }
}
