import db from '../db/db.ts';

/**
 * Trading Preferences interface
 */
export interface TradingPreferences {
  fetch_time: Date;
  offer_id: bigint;
  has_unposted_ad?: boolean;
  is_kyc?: boolean;
  is_email_verified?: boolean;
  is_mobile_verified?: boolean;
  register_time_threshold?: number;
  order_finish_30d?: number;
  complete_rate_30d?: number;
  national_limit?: string;
}

/**
 * Trading Preferences data access layer
 */
export class TradingPreferencesModel {
  /**
   * Insert trading preferences for an offer
   */
  async create(preferences: TradingPreferences): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO trading_preferences (
        fetch_time, offer_id, has_unposted_ad, is_kyc, is_email_verified,
        is_mobile_verified, register_time_threshold, order_finish_30d,
        complete_rate_30d, national_limit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      preferences.fetch_time,
      preferences.offer_id,
      preferences.has_unposted_ad,
      preferences.is_kyc,
      preferences.is_email_verified,
      preferences.is_mobile_verified,
      preferences.register_time_threshold,
      preferences.order_finish_30d,
      preferences.complete_rate_30d,
      preferences.national_limit
    ];

    await db.run(sql, params);
  }

  /**
   * Get trading preferences for a specific offer
   */
  async getByOffer(fetchTime: Date, offerId: bigint): Promise<TradingPreferences | null> {
    const sql = `
      SELECT * FROM trading_preferences 
      WHERE fetch_time = ? AND offer_id = ?
    `;
    return await db.get(sql, [fetchTime, offerId]);
  }

  /**
   * Get latest trading preferences for an offer ID
   */
  async getLatestByOfferId(offerId: bigint): Promise<TradingPreferences | null> {
    const sql = `
      SELECT * FROM trading_preferences 
      WHERE offer_id = ?
      ORDER BY fetch_time DESC
      LIMIT 1
    `;
    return await db.get(sql, [offerId]);
  }

  /**
   * Bulk insert trading preferences
   */
  async createMany(preferences: TradingPreferences[]): Promise<void> {
    if (preferences.length === 0) return;

    for (const pref of preferences) {
      await this.create(pref);
    }
  }

  /**
   * Get trading preferences by time range
   */
  async getByTimeRange(startTime: Date, endTime: Date): Promise<TradingPreferences[]> {
    const sql = `
      SELECT * FROM trading_preferences 
      WHERE fetch_time >= ? AND fetch_time <= ?
      ORDER BY fetch_time DESC, offer_id
    `;
    return await db.query(sql, [startTime, endTime]);
  }

  /**
   * Get KYC verified offers
   */
  async getKYCVerifiedOffers(limit: number = 100): Promise<TradingPreferences[]> {
    const sql = `
      SELECT * FROM trading_preferences 
      WHERE is_kyc = true
      ORDER BY fetch_time DESC
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  }

  /**
   * Get offers with email and mobile verification
   */
  async getFullyVerifiedOffers(limit: number = 100): Promise<TradingPreferences[]> {
    const sql = `
      SELECT * FROM trading_preferences 
      WHERE is_kyc = true AND is_email_verified = true AND is_mobile_verified = true
      ORDER BY fetch_time DESC
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  }

  /**
   * Get trading preferences with offer details
   */
  async getPreferencesWithOfferDetails(limit: number = 100): Promise<any[]> {
    const sql = `
      SELECT 
        tp.*,
        o.price,
        o.token_id,
        o.currency_id,
        o.side,
        o.user_id,
        u.nick_name
      FROM trading_preferences tp
      JOIN p2p_offers o ON tp.fetch_time = o.fetch_time AND tp.offer_id = o.offer_id
      LEFT JOIN p2p_users u ON o.user_id = u.user_id
      ORDER BY tp.fetch_time DESC
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  }

  /**
   * Get completion rate statistics
   */
  async getCompletionRateStats(): Promise<any[]> {
    const sql = `
      SELECT 
        CASE 
          WHEN complete_rate_30d >= 0.95 THEN '95%+'
          WHEN complete_rate_30d >= 0.90 THEN '90-95%'
          WHEN complete_rate_30d >= 0.80 THEN '80-90%'
          WHEN complete_rate_30d >= 0.70 THEN '70-80%'
          ELSE 'Below 70%'
        END as completion_rate_range,
        COUNT(*) as offer_count,
        AVG(complete_rate_30d) as avg_completion_rate
      FROM trading_preferences 
      WHERE complete_rate_30d IS NOT NULL
      GROUP BY completion_rate_range
      ORDER BY avg_completion_rate DESC
    `;
    return await db.query(sql);
  }

  /**
   * Get offers by national limit
   */
  async getByNationalLimit(nationalLimit: string, limit: number = 100): Promise<TradingPreferences[]> {
    const sql = `
      SELECT * FROM trading_preferences 
      WHERE national_limit = ?
      ORDER BY fetch_time DESC
      LIMIT ?
    `;
    return await db.query(sql, [nationalLimit, limit]);
  }

  /**
   * Delete trading preferences for a specific offer
   */
  async deleteByOffer(fetchTime: Date, offerId: bigint): Promise<void> {
    const sql = `DELETE FROM trading_preferences WHERE fetch_time = ? AND offer_id = ?`;
    await db.run(sql, [fetchTime, offerId]);
  }

  /**
   * Delete old trading preferences
   */
  async deleteOldRecords(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const sql = `DELETE FROM trading_preferences WHERE fetch_time < ?`;
    await db.run(sql, [cutoffDate]);
  }
} 