import type { RouterContext } from 'jsr:@oak/oak';
import { Status } from 'jsr:@oak/oak';
import { P2PService } from '../services/p2p.service.ts';
import { TRADE_SIDE, PAYMENT_METHODS, DEFAULT_PARAMS } from '../shared/constants.ts';

/**
 * Utility function to serialize BigInt values to strings for JSON serialization
 */
function serializeBigInts(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts);
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInts(value);
    }
    return serialized;
  }
  
  return obj;
}

/**
 * Map DuckDB column results to proper field names
 * This is a workaround for DuckDB column naming issue
 */
function mapColumns(rawData: any[]): any[] {
  return rawData.map(item => {
    // Handle the case where DuckDB returns column_0, column_1, etc.
    if (item.hasOwnProperty('column_0')) {
      let fetchTime: string;
      
      // Handle different timestamp formats from DuckDB
      if (item.column_0?.micros) {
        // Convert microseconds to milliseconds and create ISO string
        const millis = parseInt(item.column_0.micros) / 1000;
        fetchTime = new Date(millis).toISOString();
      } else if (item.column_0 instanceof Date) {
        fetchTime = item.column_0.toISOString();
      } else {
        fetchTime = new Date().toISOString(); // fallback
      }
      
      return {
        fetch_time: fetchTime,
        offer_id: String(item.column_1), // Convert to string immediately
        account_id: String(item.column_2),
        user_id: String(item.column_3),
        token_id: item.column_4,
        currency_id: item.column_5,
        side: item.column_6,
        price: Number(item.column_7),
        total_quantity: Number(item.column_8)
      };
    }
    // If columns have proper names, return as-is
    return item;
  });
}

export class P2PController {
  private static p2pService = new P2PService();

  /**
   * Fetch and store P2P data for a token pair (TBC Bank only)
   * POST /api/p2p/fetch
   */
  public static async fetchP2PData({ request, response }: RouterContext<string>): Promise<void> {
    try {
      let tokenId = DEFAULT_PARAMS.TOKEN_ID;
      let currencyId = DEFAULT_PARAMS.CURRENCY_ID;
      let payment = [PAYMENT_METHODS.TBC_BANK.toString()]; // TBC Bank payment method only
      let size = DEFAULT_PARAMS.PAGE_SIZE;
      let page = DEFAULT_PARAMS.PAGE;

      if (request.method === 'POST') {
        const body = request.body;
        const bodyData = await body.json();
        tokenId = bodyData.tokenId || tokenId;
        currencyId = bodyData.currencyId || currencyId;
        // Always use TBC Bank payment method, ignore user input
        payment = [PAYMENT_METHODS.TBC_BANK.toString()];
        size = bodyData.size || size;
        page = bodyData.page || page;
      } else {
        // GET request - use query params or defaults
        const url = new URL(request.url);
        tokenId = url.searchParams.get('tokenId') || tokenId;
        currencyId = url.searchParams.get('currencyId') || currencyId;
        // Always use TBC Bank payment method
        payment = [PAYMENT_METHODS.TBC_BANK.toString()];
        size = parseInt(url.searchParams.get('size') || DEFAULT_PARAMS.PAGE_SIZE.toString());
        page = parseInt(url.searchParams.get('page') || DEFAULT_PARAMS.PAGE.toString());
      }

      // Fetch both buy and sell offers to ensure complete data
      
      // Fetch SELL orders
      await P2PController.p2pService.processAndStoreP2PData(
        tokenId, 
        currencyId, 
        TRADE_SIDE.SELL,
        payment,
        size,
        page
      );

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch BUY orders
      await P2PController.p2pService.processAndStoreP2PData(
        tokenId, 
        currencyId, 
        TRADE_SIDE.BUY,
        payment,
        size,
        page
      );

      response.status = Status.OK;
      response.body = {
        success: true,
        message: `Successfully fetched and stored both buy and sell P2P data for ${tokenId}/${currencyId}`
      };
    } catch (error) {
      response.status = Status.InternalServerError;
      response.body = {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  /**
   * Monitor multiple token pairs
   * POST /api/p2p/monitor
   */
  public static async monitorTokenPairs({ request, response }: RouterContext<string>): Promise<void> {
    try {
      const body = request.body;
      const { tokenPairs } = await body.json();

      if (!tokenPairs || !Array.isArray(tokenPairs)) {
        response.status = Status.BadRequest;
        response.body = {
          success: false,
          message: 'tokenPairs array is required'
        };
        return;
      }

      // Start monitoring in background
      P2PController.p2pService.monitorTokenPairs(tokenPairs).catch(console.error);

      response.status = Status.OK;
      response.body = {
        success: true,
        message: `Started monitoring ${tokenPairs.length} token pairs`
      };
    } catch (error) {
      response.status = Status.InternalServerError;
      response.body = {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  /**
   * Get price aggregations for a token pair
   * GET /api/p2p/aggregations/:tokenId/:currencyId
   */
  public static async getPriceAggregations({ params, request, response }: RouterContext<string>): Promise<void> {
    try {
      const tokenId = params.tokenId as string;
      const currencyId = params.currencyId as string;
      const url = new URL(request.url);
      const side = parseInt(url.searchParams.get('side') || '1');
      const interval = url.searchParams.get('interval') || '1 hour';
      const hours = parseInt(url.searchParams.get('hours') || '24');

      if (!tokenId || !currencyId) {
        response.status = Status.BadRequest;
        response.body = {
          success: false,
          message: 'tokenId and currencyId are required'
        };
        return;
      }

      const aggregations = await P2PController.p2pService.getPriceAggregations(
        tokenId,
        currencyId,
        side,
        interval,
        hours
      );

      response.status = Status.OK;
      response.body = {
        success: true,
        data: serializeBigInts(aggregations)
      };
    } catch (error) {
      response.status = Status.InternalServerError;
      response.body = {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  /**
   * Get market summary for a token pair
   * GET /api/p2p/summary/:tokenId/:currencyId
   */
  public static async getMarketSummary({ params, response }: RouterContext<string>): Promise<void> {
    try {
      const tokenId = params.tokenId as string;
      const currencyId = params.currencyId as string;

      if (!tokenId || !currencyId) {
        response.status = Status.BadRequest;
        response.body = {
          success: false,
          message: 'tokenId and currencyId are required'
        };
        return;
      }

      const summary = await P2PController.p2pService.getMarketSummary(tokenId, currencyId);

      response.status = Status.OK;
      response.body = {
        success: true,
        data: serializeBigInts(summary)
      };
    } catch (error) {
      response.status = Status.InternalServerError;
      response.body = {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  /**
   * Get latest offers with details
   * GET /api/p2p/offers
   */
  public static async getLatestOffers({ request, response }: RouterContext<string>): Promise<void> {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const offers = await P2PController.p2pService.getLatestOffersWithDetails(limit);
      
      // Map DuckDB columns to proper field names and serialize BigInts
      const mappedOffers = mapColumns(offers);
      const serializedOffers = serializeBigInts(mappedOffers);

      response.status = Status.OK;
      response.body = {
        success: true,
        data: serializedOffers
      };
    } catch (error) {
      response.status = Status.InternalServerError;
      response.body = {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }



  /**
   * Cleanup old data
   * DELETE /api/p2p/cleanup
   */
  public static async cleanupOldData({ request, response }: RouterContext<string>): Promise<void> {
    try {
      const url = new URL(request.url);
      const retentionDays = parseInt(url.searchParams.get('retentionDays') || '30');

      await P2PController.p2pService.cleanupOldData(retentionDays);

      response.status = Status.OK;
      response.body = {
        success: true,
        message: `Successfully cleaned up data older than ${retentionDays} days`
      };
    } catch (error) {
      response.status = Status.InternalServerError;
      response.body = {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  /**
   * Get P2P health check
   * GET /api/p2p/health
   */
  public static async healthCheck({ response }: RouterContext<string>): Promise<void> {
    try {
      // Try to fetch a small amount of data to verify the system is working
      const offers = await P2PController.p2pService.getLatestOffersWithDetails(1);
      
      response.status = Status.OK;
      response.body = {
        success: true,
        message: 'P2P monitoring system is healthy',
        data: {
          timestamp: new Date().toISOString(),
          offers_count: offers.length
        }
      };
    } catch (error) {
      response.status = Status.ServiceUnavailable;
      response.body = {
        success: false,
        message: 'P2P monitoring system is not healthy',
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }
} 