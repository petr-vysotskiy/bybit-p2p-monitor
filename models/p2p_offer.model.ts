import db from '../db/db.ts';

/**
 * P2P Offer interface representing the fact table schema
 */
export interface P2POffer {
  fetch_time: Date;
  offer_id: bigint;
  account_id: bigint;
  user_id: bigint;
  token_id: string;
  currency_id: string;
  side: number; // 1=SELL, 2=BUY
  price_type: number;
  price: number;
  premium: number;
  last_quantity: number;
  total_quantity: number;
  frozen_quantity: number;
  executed_quantity: number;
  min_amount: number;
  max_amount: number;
  status: number;
  is_online: boolean;
  remark?: string;
  last_logout?: Date;
  version: number;
  auth_status: number;
  user_type: string;
  payment_period: number;
  user_mask_id: string;
}

/**
 * P2P Offer data access layer
 */
export class P2POfferModel {
  /**
   * Insert a new P2P offer snapshot
   */
  async create(offer: P2POffer): Promise<void> {
    const sql = `
      INSERT INTO p2p_offers (
        fetch_time, offer_id, account_id, user_id, token_id, currency_id,
        side, price_type, price, premium, last_quantity, total_quantity,
        frozen_quantity, executed_quantity, min_amount, max_amount,
        status, is_online, remark, last_logout, version, auth_status,
        user_type, payment_period, user_mask_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      offer.fetch_time,
      offer.offer_id,
      offer.account_id,
      offer.user_id,
      offer.token_id,
      offer.currency_id,
      offer.side,
      offer.price_type,
      offer.price,
      offer.premium,
      offer.last_quantity,
      offer.total_quantity,
      offer.frozen_quantity,
      offer.executed_quantity,
      offer.min_amount,
      offer.max_amount,
      offer.status,
      offer.is_online,
      offer.remark,
      offer.last_logout,
      offer.version,
      offer.auth_status,
      offer.user_type,
      offer.payment_period,
      offer.user_mask_id
    ];

    await db.run(sql, params);
  }

  /**
   * Bulk insert P2P offers
   */
  async createMany(offers: P2POffer[]): Promise<void> {
    if (offers.length === 0) return;

    // Use a transaction-like approach with multiple inserts
    for (const offer of offers) {
      await this.create(offer);
    }
  }

  /**
   * Get offers by time range
   */
  async getByTimeRange(startTime: Date, endTime: Date): Promise<P2POffer[]> {
    const sql = `
      SELECT * FROM p2p_offers 
      WHERE fetch_time >= ? AND fetch_time <= ?
      ORDER BY fetch_time DESC
    `;
    return await db.query(sql, [startTime, endTime]);
  }

  /**
   * Get latest offers for a token pair
   */
  async getLatestByTokenPair(tokenId: string, currencyId: string, limit: number = 100): Promise<P2POffer[]> {
    const sql = `
      SELECT * FROM p2p_offers 
      WHERE token_id = ? AND currency_id = ?
      ORDER BY fetch_time DESC
      LIMIT ?
    `;
    return await db.query(sql, [tokenId, currencyId, limit]);
  }

  /**
   * Get price aggregations by time interval
   */
  async getPriceAggregationsByInterval(
    tokenId: string,
    currencyId: string,
    side: number,
    interval: string = '1 hour',
    startTime: Date,
    endTime: Date
  ): Promise<any[]> {
    const sql = `
      SELECT 
        DATE_TRUNC('${interval}', fetch_time) as time_bucket,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        COUNT(*) as offer_count,
        AVG(premium) as avg_premium
      FROM p2p_offers 
      WHERE token_id = ? AND currency_id = ? AND side = ?
        AND fetch_time >= ? AND fetch_time <= ?
      GROUP BY DATE_TRUNC('${interval}', fetch_time)
      ORDER BY time_bucket
    `;
    return await db.query(sql, [tokenId, currencyId, side, startTime, endTime]);
  }

  /**
   * Get price aggregations by time interval filtered by payment method
   */
  async getPriceAggregationsByIntervalAndPayment(
    tokenId: string,
    currencyId: string,
    side: number,
    paymentMethodId: number,
    interval: string = '1 hour',
    startTime: Date,
    endTime: Date
  ): Promise<any[]> {
    const sql = `
      SELECT 
        DATE_TRUNC('${interval}', o.fetch_time) as time_bucket,
        AVG(o.price) as avg_price,
        MIN(o.price) as min_price,
        MAX(o.price) as max_price,
        COUNT(*) as offer_count,
        AVG(o.premium) as avg_premium
      FROM p2p_offers o
      JOIN offer_payments op ON o.fetch_time = op.fetch_time AND o.offer_id = op.offer_id
      WHERE o.token_id = ? AND o.currency_id = ? AND o.side = ? AND op.method_id = ?
        AND o.fetch_time >= ? AND o.fetch_time <= ?
      GROUP BY DATE_TRUNC('${interval}', o.fetch_time)
      ORDER BY time_bucket
    `;
    return await db.query(sql, [tokenId, currencyId, side, paymentMethodId, startTime, endTime]);
  }

  /**
   * Get offers with user and symbol information
   */
  async getOffersWithDetails(limit: number = 100): Promise<any[]> {
    const sql = `
      SELECT 
        fetch_time,
        offer_id,
        account_id,
        user_id,
        token_id,
        currency_id,
        side,
        price,
        total_quantity
      FROM p2p_offers
      ORDER BY fetch_time DESC
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  }

  /**
   * Get offers with user and symbol information filtered by payment method
   * Groups by user_id and averages the total_quantity to avoid volume summing
   */
  async getOffersWithDetailsByPayment(paymentMethodId: number, limit: number = 100): Promise<any[]> {
    const sql = `
      SELECT 
        MAX(o.fetch_time) as fetch_time,
        o.offer_id,
        o.account_id,
        o.user_id,
        o.token_id,
        o.currency_id,
        o.side,
        AVG(o.price) as price,
        AVG(o.total_quantity) as total_quantity
      FROM p2p_offers o
      JOIN offer_payments op ON o.fetch_time = op.fetch_time AND o.offer_id = op.offer_id
      WHERE op.method_id = ?
      GROUP BY o.user_id, o.token_id, o.currency_id, o.side, o.offer_id, o.account_id
      ORDER BY MAX(o.fetch_time) DESC
      LIMIT ?
    `;
    return await db.query(sql, [paymentMethodId, limit]);
  }

  /**
   * Delete old offers beyond retention period
   */
  async deleteOldOffers(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const sql = `DELETE FROM p2p_offers WHERE fetch_time < ?`;
    await db.run(sql, [cutoffDate]);
  }
} 