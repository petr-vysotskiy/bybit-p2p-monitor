import db from '../db/db.ts';

/**
 * Asset interface
 */
export interface Asset {
  asset_id: string;
  scale?: number;
  sequence?: number;
}

/**
 * Asset data access layer
 */
export class AssetModel {
  /**
   * Insert or update asset information
   */
  async upsert(asset: Asset): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO assets (asset_id, scale, sequence) 
      VALUES (?, ?, ?)
    `;
    await db.run(sql, [asset.asset_id, asset.scale, asset.sequence]);
  }

  /**
   * Get asset by ID
   */
  async getById(assetId: string): Promise<Asset | null> {
    const sql = `SELECT * FROM assets WHERE asset_id = ?`;
    return await db.get(sql, [assetId]);
  }

  /**
   * Get all assets
   */
  async getAll(): Promise<Asset[]> {
    const sql = `SELECT * FROM assets ORDER BY sequence, asset_id`;
    return await db.query(sql);
  }

  /**
   * Get assets ordered by sequence
   */
  async getBySequence(): Promise<Asset[]> {
    const sql = `SELECT * FROM assets WHERE sequence IS NOT NULL ORDER BY sequence`;
    return await db.query(sql);
  }

  /**
   * Bulk upsert assets
   */
  async upsertMany(assets: Asset[]): Promise<void> {
    if (assets.length === 0) return;

    for (const asset of assets) {
      await this.upsert(asset);
    }
  }

  /**
   * Delete asset by ID
   */
  async delete(assetId: string): Promise<void> {
    const sql = `DELETE FROM assets WHERE asset_id = ?`;
    await db.run(sql, [assetId]);
  }

  /**
   * Search assets by ID pattern
   */
  async searchById(pattern: string): Promise<Asset[]> {
    const sql = `SELECT * FROM assets WHERE asset_id LIKE ? ORDER BY sequence, asset_id`;
    return await db.query(sql, [`%${pattern}%`]);
  }

  /**
   * Get asset statistics
   */
  async getAssetStats(): Promise<any[]> {
    const sql = `
      SELECT 
        a.asset_id,
        a.scale,
        a.sequence,
        COUNT(DISTINCT o.offer_id) as offer_count,
        AVG(o.price) as avg_price,
        MIN(o.price) as min_price,
        MAX(o.price) as max_price
      FROM assets a
      LEFT JOIN p2p_offers o ON (a.asset_id = o.token_id OR a.asset_id = o.currency_id)
      GROUP BY a.asset_id, a.scale, a.sequence
      ORDER BY offer_count DESC, a.sequence
    `;
    return await db.query(sql);
  }
} 