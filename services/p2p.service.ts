import { P2POfferModel, P2POffer } from '../models/p2p_offer.model.ts';
import { SymbolInfoModel, SymbolInfo } from '../models/symbol_info.model.ts';
import { P2PUserModel, P2PUser } from '../models/p2p_user.model.ts';
import { PaymentMethodModel, OfferPaymentModel, PaymentMethod, OfferPayment } from '../models/payment_method.model.ts';
import { TradingPreferencesModel, TradingPreferences } from '../models/trading_preferences.model.ts';
import { AssetModel, Asset } from '../models/asset.model.ts';
import { TRADE_SIDE, PAYMENT_METHODS, DEFAULT_PARAMS } from '../shared/constants.ts';

/**
 * Bybit P2P API response interfaces
 */
interface BybitP2PResponse {
  ret_code: number;
  ret_msg: string;
  result: {
    count: number;
    items: BybitP2POffer[];
  };
  ext_code: string;
  ext_info: Record<string, any>;
  time_now: string;
}

interface BybitP2POffer {
  id: string;
  accountId: string;
  userId: string;
  nickName: string;
  tokenId: string;
  tokenName: string;
  currencyId: string;
  side: number;
  priceType: number;
  price: string;
  premium: string;
  lastQuantity: string;
  quantity: string;
  frozenQuantity: string;
  executedQuantity: string;
  minAmount: string;
  maxAmount: string;
  remark?: string;
  status: number;
  createDate: string;
  payments: string[];
  orderNum: number;
  finishNum: number;
  recentOrderNum: number;
  recentExecuteRate: number;
  fee: string;
  isOnline: boolean;
  lastLogoutTime: string;
  blocked: string;
  makerContact: boolean;
  symbolInfo: {
    id: string;
    exchangeId: string;
    orgId: string;
    tokenId: string;
    currencyId: string;
    status: number;
    lowerLimitAlarm: number;
    upperLimitAlarm: number;
    itemDownRange: string;
    itemUpRange: string;
    currencyMinQuote: string;
    currencyMaxQuote: string;
    currencyLowerMaxQuote: string;
    tokenMinQuote: string;
    tokenMaxQuote: string;
    kycCurrencyLimit: string;
    itemSideLimit: number;
    buyFeeRate: string;
    sellFeeRate: string;
    orderAutoCancelMinute: number;
    orderFinishMinute: number;
    tradeSide: number;
    currency: {
      id: string;
      exchangeId: string;
      orgId: string;
      currencyId: string;
      scale: number;
    };
    token: {
      id: string;
      exchangeId: string;
      orgId: string;
      tokenId: string;
      scale: number;
      sequence: number;
    };
    buyAd: any;
    sellAd: any;
  };
  tradingPreferenceSet: {
    hasUnPostAd: number;
    isKyc: number;
    isEmail: number;
    isMobile: number;
    hasRegisterTime: number;
    registerTimeThreshold: number;
    orderFinishNumberDay30: number;
    completeRateDay30: string;
    nationalLimit: string;
    hasOrderFinishNumberDay30: number;
    hasCompleteRateDay30: number;
    hasNationalLimit: number;
  };
  version: number;
  authStatus: number;
  recommend: boolean;
  recommendTag: string;
  authTag: string[];
  userType: string;
  itemType: string;
  paymentPeriod: number;
  userMaskId: string;
  verificationOrderSwitch: boolean;
  verificationOrderLabels: any[];
  verificationOrderAmount: string;
  ban: boolean;
  baned: boolean;
}

/**
 * P2P Service for handling Bybit P2P data operations
 */
export class P2PService {
  private p2pOfferModel: P2POfferModel;
  private symbolInfoModel: SymbolInfoModel;
  private p2pUserModel: P2PUserModel;
  private paymentMethodModel: PaymentMethodModel;
  private offerPaymentModel: OfferPaymentModel;
  private tradingPreferencesModel: TradingPreferencesModel;
  private assetModel: AssetModel;

  constructor() {
    this.p2pOfferModel = new P2POfferModel();
    this.symbolInfoModel = new SymbolInfoModel();
    this.p2pUserModel = new P2PUserModel();
    this.paymentMethodModel = new PaymentMethodModel();
    this.offerPaymentModel = new OfferPaymentModel();
    this.tradingPreferencesModel = new TradingPreferencesModel();
    this.assetModel = new AssetModel();
  }

  /**
   * Parse and validate date string, return undefined if invalid
   * Handles both ISO date strings and Unix timestamps (in seconds)
   */
  private parseValidDate(dateString: string): Date | undefined {
    try {
      // Check if it's a Unix timestamp (numeric string)
      const numericValue = Number(dateString);
      if (!isNaN(numericValue) && dateString.match(/^\d+$/)) {
        // Convert Unix timestamp from seconds to milliseconds
        const date = new Date(numericValue * 1000);
        if (isNaN(date.getTime())) {
          console.warn(`Invalid Unix timestamp: ${dateString}`);
          return undefined;
        }
        return date;
      }

      // Try parsing as ISO date string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: ${dateString}`);
        return undefined;
      }
      return date;
    } catch (error) {
      console.warn(`Error parsing date string: ${dateString}`, error);
      return undefined;
    }
  }

  /**
   * Fetch P2P data from Bybit API using POST method with JSON payload
   */
  async fetchBybitP2PData(
    tokenId: string = DEFAULT_PARAMS.TOKEN_ID,
    currencyId: string = DEFAULT_PARAMS.CURRENCY_ID,
    side: number = TRADE_SIDE.BUY,
    payment: string[] = [PAYMENT_METHODS.TBC_BANK.toString()],
    size: number = DEFAULT_PARAMS.PAGE_SIZE,
    page: number = DEFAULT_PARAMS.PAGE,
    amount: string = '',
    sortType: string = 'TRADE_PRICE'
  ): Promise<BybitP2PResponse> {
    const url = 'https://api2.bybit.com/fiat/otc/item/online';
    
    const payload = {
      userId: '',
      tokenId,
      currencyId,
      payment,
      side: side.toString(),
      size: size.toString(),
      page: page.toString(),
      amount,
      vaMaker: false,
      bulkMaker: false,
      canTrade: false,
      verificationFilter: 0,
      sortType,
      paymentPeriod: [],
      itemRegion: 1
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Bybit P2P data:', error);
      throw error;
    }
  }

  /**
   * Process and store Bybit P2P data (ETL process)
   */
  async processAndStoreP2PData(
    tokenId: string = DEFAULT_PARAMS.TOKEN_ID,
    currencyId: string = DEFAULT_PARAMS.CURRENCY_ID,
    side: number = TRADE_SIDE.BUY,
    payment: string[] = [PAYMENT_METHODS.TBC_BANK.toString()],
    size: number = DEFAULT_PARAMS.PAGE_SIZE,
    page: number = DEFAULT_PARAMS.PAGE
  ): Promise<void> {
    try {
      const fetchTime = new Date();
      
      const data = await this.fetchBybitP2PData(tokenId, currencyId, side, payment, size, page);

      if (data.ret_code !== 0 || !data.result?.items) {
        throw new Error(`Bybit API error: ${data.ret_msg}`);
      }
      
      for (const item of data.result.items) {
        // Use Bybit's side values directly (no conversion needed)
        // Bybit API: side=0 is SELL, side=1 is BUY
        const normalizedItem = {
          ...item,
          side: item.side  // Use Bybit's side values directly
        };
        
        // 1. Upsert dimension data first
        await this.upsertDimensionData(normalizedItem, fetchTime);

        // 2. Insert fact data
        await this.insertFactData(normalizedItem, fetchTime);
      }
    } catch (error) {
      console.error('Error processing P2P data:', error);
      throw error;
    }
  }

  /**
   * Fetch data for TBC Bank (Georgian) USD/USDT trades
   */
  async fetchTbcBankOffers(side: number = TRADE_SIDE.BUY, size: number = DEFAULT_PARAMS.PAGE_SIZE): Promise<BybitP2PResponse> {
    return await this.fetchBybitP2PData(
      DEFAULT_PARAMS.TOKEN_ID, 
      DEFAULT_PARAMS.CURRENCY_ID, 
      side, 
      [PAYMENT_METHODS.TBC_BANK.toString()], 
      size, 
      DEFAULT_PARAMS.PAGE, 
      '', 
      'TRADE_PRICE'
    );
  }

  /**
   * Upsert dimension data
   */
  private async upsertDimensionData(item: BybitP2POffer, fetchTime: Date): Promise<void> {
    // Upsert symbol info if available
    if (item.symbolInfo) {
      
      const symbolInfo: SymbolInfo = {
        symbol_id: BigInt(item.symbolInfo.id),
        exchange_id: BigInt(item.symbolInfo.exchangeId),
        org_id: BigInt(item.symbolInfo.orgId),
        token_id: item.symbolInfo.tokenId,
        currency_id: item.symbolInfo.currencyId,
        status: item.symbolInfo.status || 0,
        lower_limit_alarm: item.symbolInfo.lowerLimitAlarm || 0,
        upper_limit_alarm: item.symbolInfo.upperLimitAlarm || 0,
        item_down_range: item.symbolInfo.itemDownRange ? parseFloat(item.symbolInfo.itemDownRange) : 0,
        item_up_range: item.symbolInfo.itemUpRange ? parseFloat(item.symbolInfo.itemUpRange) : 0,
        currency_min_quote: item.symbolInfo.currencyMinQuote ? parseFloat(item.symbolInfo.currencyMinQuote) : 0,
        currency_max_quote: item.symbolInfo.currencyMaxQuote ? parseFloat(item.symbolInfo.currencyMaxQuote) : 0,
        token_min_quote: item.symbolInfo.tokenMinQuote ? parseFloat(item.symbolInfo.tokenMinQuote) : 0,
        token_max_quote: item.symbolInfo.tokenMaxQuote ? parseFloat(item.symbolInfo.tokenMaxQuote) : 0,
        currency_lower_max: item.symbolInfo.currencyLowerMaxQuote ? parseFloat(item.symbolInfo.currencyLowerMaxQuote) : 0,
        buy_fee_rate: item.symbolInfo.buyFeeRate ? parseFloat(item.symbolInfo.buyFeeRate) : undefined,
        sell_fee_rate: item.symbolInfo.sellFeeRate ? parseFloat(item.symbolInfo.sellFeeRate) : undefined,
        order_auto_cancel: item.symbolInfo.orderAutoCancelMinute || 0,
        order_finish_minute: item.symbolInfo.orderFinishMinute || 0
      };
      
      await this.symbolInfoModel.upsert(symbolInfo);
    }

    // Upsert P2P user
    const p2pUser: P2PUser = {
      user_id: BigInt(item.userId),
      account_id: BigInt(item.accountId),
      nick_name: item.nickName,
      blocked: item.blocked === 'Y',
      maker_contact: item.makerContact
    };
    await this.p2pUserModel.upsert(p2pUser);

    // Upsert payment methods
    if (item.payments && item.payments.length > 0) {
      for (const paymentId of item.payments) {
        const paymentMethod: PaymentMethod = {
          method_id: parseInt(paymentId),
          name: `Payment Method ${paymentId}` // We'll need to map these properly later
        };
        await this.paymentMethodModel.upsert(paymentMethod);
      }
    }

    // Upsert assets
    const tokenAsset: Asset = { asset_id: item.tokenId };
    const currencyAsset: Asset = { asset_id: item.currencyId };
    await this.assetModel.upsert(tokenAsset);
    await this.assetModel.upsert(currencyAsset);
  }

  /**
   * Insert fact data
   */
  private async insertFactData(item: BybitP2POffer, fetchTime: Date): Promise<void> {
    // Insert P2P offer fact data
    const p2pOffer: P2POffer = {
      fetch_time: fetchTime,
      offer_id: BigInt(item.id),
      account_id: BigInt(item.accountId),
      user_id: BigInt(item.userId),
      token_id: item.tokenId,
      currency_id: item.currencyId,
      side: item.side !== undefined ? item.side : 0,
      price_type: item.priceType || 0,
      price: parseFloat(item.price),
      premium: parseFloat(item.premium || '0'),
      last_quantity: parseFloat(item.lastQuantity || '0'),
      total_quantity: parseFloat(item.quantity || '0'),
      frozen_quantity: parseFloat(item.frozenQuantity || '0'),
      executed_quantity: parseFloat(item.executedQuantity || '0'),
      min_amount: parseFloat(item.minAmount || '0'),
      max_amount: parseFloat(item.maxAmount || '0'),
      status: item.status || 0,
      is_online: item.isOnline || false,
      remark: item.remark,
      last_logout: item.lastLogoutTime ? this.parseValidDate(item.lastLogoutTime) : undefined,
      version: item.version || 0,
      auth_status: item.authStatus || 0,
      user_type: 'regular',
      payment_period: 0,
      user_mask_id: item.userId || ''
    };
    
         await this.p2pOfferModel.create(p2pOffer);

     // Insert payment methods
     if (item.payments && item.payments.length > 0) {
       for (const paymentId of item.payments) {
         const offerPayment: OfferPayment = {
           fetch_time: fetchTime,
           offer_id: BigInt(item.id),
           method_id: parseInt(paymentId)
         };
         
         await this.offerPaymentModel.create(offerPayment);
       }
     }

    // Insert trading preferences
    if (item.tradingPreferenceSet) {
      const tradingPreferences: TradingPreferences = {
        fetch_time: fetchTime,
        offer_id: BigInt(item.id),
        has_unposted_ad: item.tradingPreferenceSet.hasUnPostAd === 1,
        is_kyc: item.tradingPreferenceSet.isKyc === 1,
        is_email_verified: item.tradingPreferenceSet.isEmail === 1,
        is_mobile_verified: item.tradingPreferenceSet.isMobile === 1,
        register_time_threshold: item.tradingPreferenceSet.registerTimeThreshold,
        order_finish_30d: item.tradingPreferenceSet.orderFinishNumberDay30,
        complete_rate_30d: item.tradingPreferenceSet.completeRateDay30 ? parseFloat(item.tradingPreferenceSet.completeRateDay30) : 0,
        national_limit: item.tradingPreferenceSet.nationalLimit
      };
      await this.tradingPreferencesModel.create(tradingPreferences);
    }
  }

  /**
   * Get price aggregations for a token pair (TBC Bank only)
   */
  async getPriceAggregations(
    tokenId: string,
    currencyId: string,
    side: number,
    interval: string = '1 hour',
    hours: number = 24
  ): Promise<any[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    return await this.p2pOfferModel.getPriceAggregationsByIntervalAndPayment(
      tokenId,
      currencyId,
      side,
      165, // TBC Bank payment method
      interval,
      startTime,
      endTime
    );
  }

  /**
   * Get latest offers with all related information (TBC Bank only)
   */
  async getLatestOffersWithDetails(limit: number = 50): Promise<any[]> {
    return await this.p2pOfferModel.getOffersWithDetailsByPayment(165, limit);
  }

  /**
   * Get market summary for a token pair (TBC Bank only)
   */
  async getMarketSummary(tokenId: string, currencyId: string): Promise<any> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    // Get TBC bank offers only (payment method 165)
    const tbcOffers = await this.offerPaymentModel.getOffersByPaymentMethod(165, 1000);
    
    const buyOffersFiltered = tbcOffers.filter(o => 
      o.token_id === tokenId && 
      o.currency_id === currencyId && 
      o.side === TRADE_SIDE.BUY &&
      new Date(o.fetch_time) >= startTime && 
      new Date(o.fetch_time) <= endTime
    );
    
    const sellOffersFiltered = tbcOffers.filter(o => 
      o.token_id === tokenId && 
      o.currency_id === currencyId && 
      o.side === TRADE_SIDE.SELL &&
      new Date(o.fetch_time) >= startTime && 
      new Date(o.fetch_time) <= endTime
    );

    const summary = {
      token_id: tokenId,
      currency_id: currencyId,
      buy_offers: {
        count: buyOffersFiltered.length,
        avg_price: buyOffersFiltered.length > 0 ? buyOffersFiltered.reduce((sum, o) => sum + o.price, 0) / buyOffersFiltered.length : 0,
        min_price: buyOffersFiltered.length > 0 ? Math.min(...buyOffersFiltered.map(o => o.price)) : 0,
        max_price: buyOffersFiltered.length > 0 ? Math.max(...buyOffersFiltered.map(o => o.price)) : 0
      },
      sell_offers: {
        count: sellOffersFiltered.length,
        avg_price: sellOffersFiltered.length > 0 ? sellOffersFiltered.reduce((sum, o) => sum + o.price, 0) / sellOffersFiltered.length : 0,
        min_price: sellOffersFiltered.length > 0 ? Math.min(...sellOffersFiltered.map(o => o.price)) : 0,
        max_price: sellOffersFiltered.length > 0 ? Math.max(...sellOffersFiltered.map(o => o.price)) : 0
      },
      spread: 0
    };

    if (summary.sell_offers.min_price > 0 && summary.buy_offers.max_price > 0) {
      summary.spread = ((summary.sell_offers.min_price - summary.buy_offers.max_price) / summary.buy_offers.max_price) * 100;
    }

    return summary;
  }

  /**
   * Monitor P2P data for multiple token pairs (TBC Bank only)
   */
  async monitorTokenPairs(tokenPairs: Array<{ tokenId: string; currencyId: string }>): Promise<void> {
    for (const pair of tokenPairs) {
      try {
        // Fetch both buy and sell offers for TBC Bank only
        await this.processAndStoreP2PData(pair.tokenId, pair.currencyId, TRADE_SIDE.SELL, [PAYMENT_METHODS.TBC_BANK.toString()]);
        await this.processAndStoreP2PData(pair.tokenId, pair.currencyId, TRADE_SIDE.BUY, [PAYMENT_METHODS.TBC_BANK.toString()]);
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error monitoring ${pair.tokenId}/${pair.currencyId}:`, error);
      }
    }
  }

  /**
   * Clean up old P2P data (retention policy)
   */
  async cleanupOldData(retentionDays: number = 30): Promise<void> {
    await Promise.all([
      this.p2pOfferModel.deleteOldOffers(retentionDays),
      this.offerPaymentModel.deleteOldRecords(retentionDays),
      this.tradingPreferencesModel.deleteOldRecords(retentionDays)
    ]);
  }
} 