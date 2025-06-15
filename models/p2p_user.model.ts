import db from '../db/db.ts';

/**
 * P2P User interface representing P2P user data (separate from auth users)
 */
export interface P2PUser {
  user_id: bigint;
  account_id?: bigint;
  nick_name?: string;
  blocked?: boolean;
  maker_contact?: boolean;
}

/**
 * P2P User data access layer
 */
export class P2PUserModel {
  /**
   * Insert or update P2P user information
   */
  async upsert(user: P2PUser): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO p2p_users (
        user_id, account_id, nick_name, blocked, maker_contact
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      user.user_id,
      user.account_id,
      user.nick_name,
      user.blocked,
      user.maker_contact
    ];

    await db.run(sql, params);
  }

  /**
   * Get P2P user by ID
   */
  async getById(userId: bigint): Promise<P2PUser | null> {
    const sql = `SELECT * FROM p2p_users WHERE user_id = ?`;
    return await db.get(sql, [userId]);
  }

  /**
   * Get P2P user by account ID
   */
  async getByAccountId(accountId: bigint): Promise<P2PUser | null> {
    const sql = `SELECT * FROM p2p_users WHERE account_id = ?`;
    return await db.get(sql, [accountId]);
  }

  /**
   * Get all P2P users
   */
  async getAll(): Promise<P2PUser[]> {
    const sql = `SELECT * FROM p2p_users ORDER BY user_id`;
    return await db.query(sql);
  }

  /**
   * Get non-blocked users
   */
  async getActiveUsers(): Promise<P2PUser[]> {
    const sql = `SELECT * FROM p2p_users WHERE blocked = false OR blocked IS NULL ORDER BY user_id`;
    return await db.query(sql);
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(): Promise<P2PUser[]> {
    const sql = `SELECT * FROM p2p_users WHERE blocked = true ORDER BY user_id`;
    return await db.query(sql);
  }

  /**
   * Bulk upsert P2P users
   */
  async upsertMany(users: P2PUser[]): Promise<void> {
    if (users.length === 0) return;

    for (const user of users) {
      await this.upsert(user);
    }
  }

  /**
   * Update user blocked status
   */
  async updateBlockedStatus(userId: bigint, blocked: boolean): Promise<void> {
    const sql = `UPDATE p2p_users SET blocked = ? WHERE user_id = ?`;
    await db.run(sql, [blocked, userId]);
  }

  /**
   * Delete P2P user by ID
   */
  async delete(userId: bigint): Promise<void> {
    const sql = `DELETE FROM p2p_users WHERE user_id = ?`;
    await db.run(sql, [userId]);
  }

  /**
   * Search users by nickname
   */
  async searchByNickname(nickname: string): Promise<P2PUser[]> {
    const sql = `SELECT * FROM p2p_users WHERE nick_name LIKE ? ORDER BY user_id`;
    return await db.query(sql, [`%${nickname}%`]);
  }
} 