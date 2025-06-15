import { DuckDBInstance } from '@duckdb/node-api';
import configs from '../config/config.ts';
import log from '../middlewares/logger.middleware.ts';

const { dbPath } = configs;

interface QueryResult {
  [key: string]: any;
}

interface RunResult {
  changes?: number;
}

interface DatabaseConfig {
  dbPath: string;
}

/**
 * Enhanced DuckDB database wrapper with improved error handling and connection management
 */
class Database {
  private instance: DuckDBInstance | null = null;
  private connection: any = null;
  private isConnected: boolean = false;
  private readonly config: DatabaseConfig;

  constructor(config: string | DatabaseConfig) {
    if (typeof config === 'string') {
      this.config = { dbPath: config };
    } else {
      this.config = config;
    }
  }

  /**
   * Establish connection to DuckDB database
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      log.warn('Database already connected');
      return;
    }

    log.info(`Connecting to DuckDB at: ${this.config.dbPath}`);
    
    try {
      this.instance = await DuckDBInstance.create(this.config.dbPath);
      this.connection = await this.instance.connect();
      this.isConnected = true;
      
      log.info('Database connected successfully');
      
      await this.initializeSchema();
      
    } catch (error) {
      this.isConnected = false;
      log.error('Database connection failed:', error);
      throw new Error(`Failed to connect to database: ${error}`);
    }
  }

  /**
   * Initialize all database tables and indexes
   */
  private async initializeSchema(): Promise<void> {
    try {
      await this.createCoreTables();
      await this.createP2PTables();
      await this.createIndexes();
      
      log.info('Database schema initialized successfully');
    } catch (error) {
      log.error('Schema initialization failed:', error);
      throw new Error(`Schema initialization failed: ${error}`);
    }
  }

  /**
   * Create core application tables
   */
  private async createCoreTables(): Promise<void> {
    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            email VARCHAR UNIQUE NOT NULL,
            password VARCHAR NOT NULL,
            role VARCHAR NOT NULL,
            docVersion INTEGER DEFAULT 1,
            isDisabled BOOLEAN DEFAULT false,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'users_history',
        sql: `
          CREATE TABLE IF NOT EXISTS users_history (
            id VARCHAR PRIMARY KEY,
            user VARCHAR NOT NULL,
            name VARCHAR,
            email VARCHAR,
            password VARCHAR,
            role VARCHAR,
            docVersion INTEGER NOT NULL,
            isDisabled BOOLEAN,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'tokens',
        sql: `
          CREATE TABLE IF NOT EXISTS tokens (
            id VARCHAR PRIMARY KEY,
            token VARCHAR NOT NULL,
            user VARCHAR NOT NULL,
            type VARCHAR NOT NULL,
            expires TIMESTAMP NOT NULL,
            blacklisted BOOLEAN DEFAULT false,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
    ];

    for (const table of tables) {
      await this.connection.run(table.sql);
      log.debug(`Created table: ${table.name}`);
    }
  }

  /**
   * Create P2P monitoring tables (ADR-001)
   */
  private async createP2PTables(): Promise<void> {
    const p2pTables = [
      {
        name: 'p2p_offers',
        sql: `
          CREATE TABLE IF NOT EXISTS p2p_offers (
            fetch_time          TIMESTAMP       NOT NULL,
            offer_id            BIGINT          NOT NULL,
            account_id          BIGINT          NOT NULL,
            user_id             BIGINT          NOT NULL,
            token_id            VARCHAR         NOT NULL,
            currency_id         VARCHAR         NOT NULL,
            side                SMALLINT        NOT NULL,
            price_type          SMALLINT        NOT NULL,
            price               DOUBLE          NOT NULL,
            premium             DOUBLE          NOT NULL,
            last_quantity       DOUBLE          NOT NULL,
            total_quantity      DOUBLE          NOT NULL,
            frozen_quantity     DOUBLE          NOT NULL,
            executed_quantity   DOUBLE          NOT NULL,
            min_amount          DOUBLE          NOT NULL,
            max_amount          DOUBLE          NOT NULL,
            status              SMALLINT        NOT NULL,
            is_online           BOOLEAN         NOT NULL,
            remark              VARCHAR,
            last_logout         TIMESTAMP,
            version             INTEGER         NOT NULL,
            auth_status         SMALLINT        NOT NULL,
            user_type           VARCHAR         NOT NULL,
            payment_period      INTEGER         NOT NULL,
            user_mask_id        VARCHAR         NOT NULL,
            PRIMARY KEY (fetch_time, offer_id)
          )
        `
      },
      {
        name: 'symbol_info',
        sql: `
          CREATE TABLE IF NOT EXISTS symbol_info (
            symbol_id             BIGINT       PRIMARY KEY,
            exchange_id           BIGINT,
            org_id                BIGINT,
            token_id              VARCHAR,
            currency_id           VARCHAR,
            status                SMALLINT,
            lower_limit_alarm     DOUBLE,
            upper_limit_alarm     DOUBLE,
            item_down_range       DOUBLE,
            item_up_range         DOUBLE,
            currency_min_quote    DOUBLE,
            currency_max_quote    DOUBLE,
            token_min_quote       DOUBLE,
            token_max_quote       DOUBLE,
            currency_lower_max    DOUBLE,
            buy_fee_rate          DOUBLE,
            sell_fee_rate         DOUBLE,
            order_auto_cancel     INTEGER,
            order_finish_minute   INTEGER
          )
        `
      },
      {
        name: 'p2p_users',
        sql: `
          CREATE TABLE IF NOT EXISTS p2p_users (
            user_id           BIGINT     PRIMARY KEY,
            account_id        BIGINT,
            nick_name         VARCHAR,
            blocked           BOOLEAN,
            maker_contact     BOOLEAN
          )
        `
      },
      {
        name: 'payment_methods',
        sql: `
          CREATE TABLE IF NOT EXISTS payment_methods (
            method_id   INTEGER  PRIMARY KEY,
            name        VARCHAR
          )
        `
      },
      {
        name: 'offer_payments',
        sql: `
          CREATE TABLE IF NOT EXISTS offer_payments (
            fetch_time   TIMESTAMP   NOT NULL,
            offer_id     BIGINT      NOT NULL,
            method_id    INTEGER     NOT NULL,
            PRIMARY KEY (fetch_time, offer_id, method_id)
          )
        `
      },
      {
        name: 'trading_preferences',
        sql: `
          CREATE TABLE IF NOT EXISTS trading_preferences (
            fetch_time                TIMESTAMP   NOT NULL,
            offer_id                  BIGINT      NOT NULL,
            has_unposted_ad           BOOLEAN,
            is_kyc                    BOOLEAN,
            is_email_verified         BOOLEAN,
            is_mobile_verified        BOOLEAN,
            register_time_threshold   INTEGER,
            order_finish_30d          INTEGER,
            complete_rate_30d         DOUBLE,
            national_limit            VARCHAR,
            PRIMARY KEY (fetch_time, offer_id)
          )
        `
      },
      {
        name: 'assets',
        sql: `
          CREATE TABLE IF NOT EXISTS assets (
            asset_id    VARCHAR   PRIMARY KEY,
            scale       INTEGER,
            sequence    INTEGER
          )
        `
      }
    ];

    for (const table of p2pTables) {
      await this.connection.run(table.sql);
      log.debug(`Created P2P table: ${table.name}`);
    }
  }

  /**
   * Create database indexes for performance optimization
   */
  private async createIndexes(): Promise<void> {
    const indexes = [
      // Core table indexes
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user)',
      'CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token)',
      'CREATE INDEX IF NOT EXISTS idx_users_history_user ON users_history(user)',
      
      // P2P table indexes
      'CREATE INDEX IF NOT EXISTS idx_p2p_offers_time ON p2p_offers(fetch_time)',
      'CREATE INDEX IF NOT EXISTS idx_p2p_offers_price ON p2p_offers(price)',
      'CREATE INDEX IF NOT EXISTS idx_p2p_offers_token_currency ON p2p_offers(token_id, currency_id)',
      'CREATE INDEX IF NOT EXISTS idx_p2p_offers_side ON p2p_offers(side)',
      'CREATE INDEX IF NOT EXISTS idx_symbol_info_token_currency ON symbol_info(token_id, currency_id)',
      'CREATE INDEX IF NOT EXISTS idx_offer_payments_fetch_offer ON offer_payments(fetch_time, offer_id)',
      'CREATE INDEX IF NOT EXISTS idx_trading_preferences_fetch_offer ON trading_preferences(fetch_time, offer_id)'
    ];

    for (const indexSql of indexes) {
      await this.connection.run(indexSql);
    }
    
    log.debug('Database indexes created');
  }

  /**
   * Execute a query with parameters and return all results
   */
  async query(sql: string, params: any[] = []): Promise<QueryResult[]> {
    this.ensureConnection();
    
    try {
      if (params.length === 0) {
        return await this.executeSimpleQuery(sql);
      }
      
      return await this.executeParameterizedQuery(sql, params);
    } catch (error) {
      log.error('Query execution failed:', { sql, params, error });
      throw new Error(`Query failed: ${error}`);
    }
  }

  /**
   * Execute a simple query without parameters
   */
  private async executeSimpleQuery(sql: string): Promise<QueryResult[]> {
    const reader = await this.connection.runAndReadAll(sql);
    return this.formatResults(reader);
  }

  /**
   * Execute a parameterized query
   */
  private async executeParameterizedQuery(sql: string, params: any[]): Promise<QueryResult[]> {
    const prepared = await this.connection.prepare(sql);
    
    this.bindParameters(prepared, params);
    
    const reader = await prepared.runAndReadAll();
    return this.formatResults(reader);
  }

  /**
   * Bind parameters to prepared statement
   */
  private bindParameters(prepared: any, params: any[]): void {
    params.forEach((param, index) => {
      const position = index + 1;
      
      if (param === null || param === undefined) {
        this.bindNullParameter(prepared, position);
      } else if (param instanceof Date) {
        prepared.bindVarchar(position, param.toISOString());
      } else if (typeof param === 'string') {
        prepared.bindVarchar(position, param);
      } else if (typeof param === 'number') {
        if (Number.isInteger(param)) {
          prepared.bindInteger(position, param);
        } else {
          prepared.bindDouble(position, param);
        }
      } else if (typeof param === 'boolean') {
        prepared.bindBoolean(position, param);
      } else {
        prepared.bindVarchar(position, String(param));
      }
    });
  }

  /**
   * Safely bind null parameters
   */
  private bindNullParameter(prepared: any, position: number): void {
    try {
      prepared.bindNull(position);
    } catch {
      // Fallback if bindNull is not available
      log.debug(`Could not bind null at position ${position}, skipping`);
    }
  }

  /**
   * Format query results into objects
   */
  private formatResults(reader: any): QueryResult[] {
    const columns = reader.getColumns();
    
    return reader.getRows().map((row: any[]) => {
      const result: QueryResult = {};
      
      row.forEach((value, index) => {
        const columnName = columns[index]?.name || `column_${index}`;
        result[columnName] = value;
      });
      
      return result;
    });
  }

  /**
   * Execute a query and return the first result
   */
  async get(sql: string, params: any[] = []): Promise<QueryResult | null> {
    try {
      const results = await this.query(sql, params);
      return results[0] || null;
    } catch (error) {
      log.error('Get query failed:', { sql, params, error });
      throw error;
    }
  }

  /**
   * Execute a query and return execution info
   */
  async run(sql: string, params: any[] = []): Promise<RunResult> {
    this.ensureConnection();
    
    try {
      if (params.length === 0) {
        await this.connection.run(sql);
      } else {
        const prepared = await this.connection.prepare(sql);
        this.bindParameters(prepared, params);
        await prepared.run();
      }
      
      return { changes: 1 };
    } catch (error) {
      log.error('Run query failed:', { sql, params, error });
      throw new Error(`Run query failed: ${error}`);
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<void> {
    this.ensureConnection();
    
    try {
      await this.connection.run('BEGIN TRANSACTION');
      
      for (const query of queries) {
        await this.run(query.sql, query.params || []);
      }
      
      await this.connection.run('COMMIT');
    } catch (error) {
      await this.connection.run('ROLLBACK');
      log.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error}`);
    }
  }

  /**
   * Check if database connection is active
   */
  get isConnectionActive(): boolean {
    return this.isConnected && this.connection !== null;
  }

  /**
   * Ensure database connection is active
   */
  private ensureConnection(): void {
    if (!this.isConnectionActive) {
      throw new Error('Database connection is not active');
    }
  }

  /**
   * Close database connection gracefully
   */
  async close(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      if (this.connection) {
        this.connection.closeSync();
        this.connection = null;
      }
      
      if (this.instance) {
        this.instance.closeSync();
        this.instance = null;
      }
      
      this.isConnected = false;
      log.info('Database connection closed successfully');
    } catch (error) {
      log.error('Error closing database connection:', error);
      throw new Error(`Failed to close database: ${error}`);
    }
  }

  /**
   * Generate a UUID for database records
   */
  generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1 as health_check');
      return true;
    } catch {
      return false;
    }
  }
}

// Initialize data directory
async function ensureDataDirectory(): Promise<void> {
  try {
    await Deno.mkdir('./data', { recursive: true });
  } catch (error) {
    // Directory might already exist
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      log.error('Failed to create data directory:', error);
    }
  }
}

// Initialize database
await ensureDataDirectory();
const db = new Database(dbPath);
await db.connect();

export default db;
export { Database, type QueryResult, type RunResult, type DatabaseConfig };