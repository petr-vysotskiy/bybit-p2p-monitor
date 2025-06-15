import db from '../db/db.ts';

/**
 * Payment Method interface
 */
export interface PaymentMethod {
  method_id: number;
  name: string;
}

/**
 * Offer Payment interface for the bridge table
 */
export interface OfferPayment {
  fetch_time: Date;
  offer_id: bigint;
  method_id: number;
}

/**
 * Payment Method data access layer
 */
export class PaymentMethodModel {
  /**
   * Insert or update payment method
   */
  async upsert(method: PaymentMethod): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO payment_methods (method_id, name) 
      VALUES (?, ?)
    `;
    await db.run(sql, [method.method_id, method.name]);
  }

  /**
   * Get payment method by ID
   */
  async getById(methodId: number): Promise<PaymentMethod | null> {
    const sql = `SELECT * FROM payment_methods WHERE method_id = ?`;
    return await db.get(sql, [methodId]);
  }

  /**
   * Get all payment methods
   */
  async getAll(): Promise<PaymentMethod[]> {
    const sql = `SELECT * FROM payment_methods ORDER BY method_id`;
    return await db.query(sql);
  }

  /**
   * Bulk upsert payment methods
   */
  async upsertMany(methods: PaymentMethod[]): Promise<void> {
    if (methods.length === 0) return;

    for (const method of methods) {
      await this.upsert(method);
    }
  }

  /**
   * Delete payment method by ID
   */
  async delete(methodId: number): Promise<void> {
    const sql = `DELETE FROM payment_methods WHERE method_id = ?`;
    await db.run(sql, [methodId]);
  }

  /**
   * Search payment methods by name
   */
  async searchByName(name: string): Promise<PaymentMethod[]> {
    const sql = `SELECT * FROM payment_methods WHERE name LIKE ? ORDER BY method_id`;
    return await db.query(sql, [`%${name}%`]);
  }
}

/**
 * Offer Payment bridge table data access layer
 */
export class OfferPaymentModel {
  /**
   * Add payment method to an offer
   */
  async create(offerPayment: OfferPayment): Promise<void> {
    const sql = `
      INSERT OR IGNORE INTO offer_payments (fetch_time, offer_id, method_id) 
      VALUES (?, ?, ?)
    `;
    await db.run(sql, [
      offerPayment.fetch_time,
      offerPayment.offer_id,
      offerPayment.method_id
    ]);
  }

  /**
   * Add multiple payment methods to an offer
   */
  async createMany(offerPayments: OfferPayment[]): Promise<void> {
    if (offerPayments.length === 0) return;

    for (const offerPayment of offerPayments) {
      await this.create(offerPayment);
    }
  }

  /**
   * Get payment methods for a specific offer
   */
  async getByOffer(fetchTime: Date, offerId: bigint): Promise<PaymentMethod[]> {
    const sql = `
      SELECT pm.* 
      FROM payment_methods pm
      JOIN offer_payments op ON pm.method_id = op.method_id
      WHERE op.fetch_time = ? AND op.offer_id = ?
      ORDER BY pm.method_id
    `;
    return await db.query(sql, [fetchTime, offerId]);
  }

  /**
   * Get offers that support a specific payment method
   */
  async getOffersByPaymentMethod(methodId: number, limit: number = 100): Promise<any[]> {
    const sql = `
      SELECT o.*, pm.name as payment_method_name
      FROM p2p_offers o
      JOIN offer_payments op ON o.fetch_time = op.fetch_time AND o.offer_id = op.offer_id
      JOIN payment_methods pm ON op.method_id = pm.method_id
      WHERE op.method_id = ?
      ORDER BY o.fetch_time DESC
      LIMIT ?
    `;
    return await db.query(sql, [methodId, limit]);
  }

  /**
   * Get payment method statistics
   */
  async getPaymentMethodStats(): Promise<any[]> {
    const sql = `
      SELECT 
        pm.method_id,
        pm.name,
        COUNT(DISTINCT op.offer_id) as offer_count,
        COUNT(*) as total_snapshots
      FROM payment_methods pm
      LEFT JOIN offer_payments op ON pm.method_id = op.method_id
      GROUP BY pm.method_id, pm.name
      ORDER BY offer_count DESC
    `;
    return await db.query(sql);
  }

  /**
   * Delete payment methods for a specific offer
   */
  async deleteByOffer(fetchTime: Date, offerId: bigint): Promise<void> {
    const sql = `DELETE FROM offer_payments WHERE fetch_time = ? AND offer_id = ?`;
    await db.run(sql, [fetchTime, offerId]);
  }

  /**
   * Delete old offer payment records
   */
  async deleteOldRecords(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const sql = `DELETE FROM offer_payments WHERE fetch_time < ?`;
    await db.run(sql, [cutoffDate]);
  }
} 