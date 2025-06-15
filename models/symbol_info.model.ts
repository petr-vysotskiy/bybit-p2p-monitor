import db from '../db/db.ts';

/**
 * Symbol Info interface representing symbol metadata
 */
export interface SymbolInfo {
  symbol_id: bigint;
  exchange_id?: bigint;
  org_id?: bigint;
  token_id?: string;
  currency_id?: string;
  status?: number;
  lower_limit_alarm?: number;
  upper_limit_alarm?: number;
  item_down_range?: number;
  item_up_range?: number;
  currency_min_quote?: number;
  currency_max_quote?: number;
  token_min_quote?: number;
  token_max_quote?: number;
  currency_lower_max?: number;
  buy_fee_rate?: number;
  sell_fee_rate?: number;
  order_auto_cancel?: number;
  order_finish_minute?: number;
}

/**
 * Symbol Info data access layer
 */
export class SymbolInfoModel {
  /**
   * Insert or update symbol information
   */
  async upsert(symbolInfo: SymbolInfo): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO symbol_info (
        symbol_id, exchange_id, org_id, token_id, currency_id, status,
        lower_limit_alarm, upper_limit_alarm, item_down_range, item_up_range,
        currency_min_quote, currency_max_quote, token_min_quote, token_max_quote,
        currency_lower_max, buy_fee_rate, sell_fee_rate, order_auto_cancel,
        order_finish_minute
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      symbolInfo.symbol_id,
      symbolInfo.exchange_id,
      symbolInfo.org_id,
      symbolInfo.token_id,
      symbolInfo.currency_id,
      symbolInfo.status,
      symbolInfo.lower_limit_alarm,
      symbolInfo.upper_limit_alarm,
      symbolInfo.item_down_range,
      symbolInfo.item_up_range,
      symbolInfo.currency_min_quote,
      symbolInfo.currency_max_quote,
      symbolInfo.token_min_quote,
      symbolInfo.token_max_quote,
      symbolInfo.currency_lower_max,
      symbolInfo.buy_fee_rate,
      symbolInfo.sell_fee_rate,
      symbolInfo.order_auto_cancel,
      symbolInfo.order_finish_minute
    ].map(val => val === undefined ? null : val);

    await db.run(sql, params);
  }

  /**
   * Get symbol info by ID
   */
  async getById(symbolId: bigint): Promise<SymbolInfo | null> {
    const sql = `SELECT * FROM symbol_info WHERE symbol_id = ?`;
    return await db.get(sql, [symbolId]);
  }

  /**
   * Get symbol info by token and currency pair
   */
  async getByTokenCurrency(tokenId: string, currencyId: string): Promise<SymbolInfo | null> {
    const sql = `SELECT * FROM symbol_info WHERE token_id = ? AND currency_id = ?`;
    return await db.get(sql, [tokenId, currencyId]);
  }

  /**
   * Get all active symbols
   */
  async getActiveSymbols(): Promise<SymbolInfo[]> {
    const sql = `SELECT * FROM symbol_info WHERE status = 1 ORDER BY token_id, currency_id`;
    return await db.query(sql);
  }

  /**
   * Get all symbols
   */
  async getAll(): Promise<SymbolInfo[]> {
    const sql = `SELECT * FROM symbol_info ORDER BY token_id, currency_id`;
    return await db.query(sql);
  }

  /**
   * Bulk upsert symbol information
   */
  async upsertMany(symbols: SymbolInfo[]): Promise<void> {
    if (symbols.length === 0) return;

    for (const symbol of symbols) {
      await this.upsert(symbol);
    }
  }

  /**
   * Delete symbol by ID
   */
  async delete(symbolId: bigint): Promise<void> {
    const sql = `DELETE FROM symbol_info WHERE symbol_id = ?`;
    await db.run(sql, [symbolId]);
  }
} 