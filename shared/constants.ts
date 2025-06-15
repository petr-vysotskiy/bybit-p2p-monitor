/**
 * Shared constants for P2P trading sides
 * Following Bybit API convention
 */
export const TRADE_SIDE = {
  SELL: 0,  // Bybit API: side=0 for SELL orders
  BUY: 1    // Bybit API: side=1 for BUY orders
};

/**
 * Payment method IDs
 */
export const PAYMENT_METHODS = {
  TBC_BANK: 165  // TBC Bank (Georgian bank)
};

/**
 * Default API parameters
 */
export const DEFAULT_PARAMS = {
  TOKEN_ID: 'USDT',
  CURRENCY_ID: 'USD',
  PAGE_SIZE: 10,
  PAGE: 1
}; 