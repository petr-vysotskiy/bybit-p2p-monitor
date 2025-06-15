ADR-001: Star Schema for Bybit P2P Price Capture in DuckDB

Status

Proposed

Context

We need to capture peer-to-peer (P2P) offer data from the Bybit API, store it in DuckDB, and support flexible aggregations over arbitrary timeframes (e.g., 1 min, 5 min, 1 day). The API returns detailed JSON for each fetch, including offer details, user info, symbol parameters, payment methods, and trading preferences.

Decision Drivers

* Time-series analysis: need to query average, min, max price by interval.
* Storage efficiency: avoid repeated storage of static data (e.g., symbol metadata).
* Query performance: DuckDB should scan a compact fact table for aggregations.
* Data integrity: maintain history of changes at each fetch.
* Extensibility: allow new dimensions (e.g., new payment methods) without migrating facts.

Considered Options

1. Raw JSON in a single table

   * Store full API response per fetch in a JSON column.
   * Pros: minimal upfront schema design.
   * Cons: slow to query, high storage overhead, JSON parsing at runtime.

2. Wide flat table

   * Extract all fields into one very wide table.
   * Pros: simple SELECTs.
   * Cons: lots of nullable columns, data duplication, hard to extend.

3. Star schema

   * One fact table for per-fetch offer snapshots.
   * Multiple dimension tables: symbols, users, payment methods, trading preferences.
   * Pros: compact fact table, normalized static data, fast aggregations, easy to extend.
   * Cons: more tables to maintain, joins required.

Decision

Adopt the star schema design:

* Fact table `p2p_offers(fetch_time, offer_id, account_id, user_id, token_id, currency_id, side, price_type, price, ...)`.
* Dimension `symbol_info(symbol_id, exchange_id, token_id, currency_id, lower_limit_alarm, ...)`.
* Dimension `users(user_id, account_id, nick_name, is_blocked, maker_contact)`.
* Dimension `payment_methods(method_id, name)` plus bridge `offer_payments`.
* Dimension `trading_preferences(fetch_time, offer_id, has_unposted_ad, is_kyc, ...)`.

This structure stores each API snapshot in the fact table with referential integrity to small dimensions. It optimizes for querying time-based aggregates while ensuring static attributes aren’t repeated.

Consequences

* Easy time-series queries via `DATE_TRUNC` on `fetch_time`.
* Reduced storage for static metadata.
* Slightly more complex ETL: need to upsert dimensions and insert bridge tables.
* Scalable: adding new dimensions (e.g. geo info) involves a new table and join.
* Fast aggregations: DuckDB handles star joins efficiently on columnar storage.

Detailed Database Schemas

```sql
-- 1. Fact table: snapshots of P2P offers
CREATE TABLE p2p_offers (
    fetch_time          TIMESTAMP       NOT NULL,
    offer_id            BIGINT          NOT NULL,
    account_id          BIGINT          NOT NULL,
    user_id             BIGINT          NOT NULL,
    token_id            VARCHAR         NOT NULL,
    currency_id         VARCHAR         NOT NULL,
    side                SMALLINT        NOT NULL,      -- 1=SELL, 2=BUY
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
);

CREATE INDEX idx_p2p_offers_time ON p2p_offers(fetch_time);
CREATE INDEX idx_p2p_offers_price ON p2p_offers(price);

-- 2. Dimension: symbol metadata
CREATE TABLE symbol_info (
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
);

-- 3. Dimension: users
CREATE TABLE users (
    user_id           BIGINT     PRIMARY KEY,
    account_id        BIGINT,
    nick_name         VARCHAR,
    blocked           BOOLEAN,
    maker_contact     BOOLEAN
);

-- 4. Dimension: payment methods
CREATE TABLE payment_methods (
    method_id   INTEGER  PRIMARY KEY,
    name        VARCHAR
);

CREATE TABLE offer_payments (
    fetch_time   TIMESTAMP   NOT NULL,
    offer_id     BIGINT      NOT NULL,
    method_id    INTEGER     NOT NULL,
    PRIMARY KEY (fetch_time, offer_id, method_id),
    FOREIGN KEY (fetch_time, offer_id) REFERENCES p2p_offers(fetch_time, offer_id),
    FOREIGN KEY (method_id) REFERENCES payment_methods(method_id)
);

-- 5. Dimension: trading preferences per snapshot
CREATE TABLE trading_preferences (
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
    PRIMARY KEY (fetch_time, offer_id),
    FOREIGN KEY (fetch_time, offer_id) REFERENCES p2p_offers(fetch_time, offer_id)
);

-- 6. Optional normalization: assets
CREATE TABLE assets (
    asset_id    VARCHAR   PRIMARY KEY,
    scale       INTEGER,
    sequence    INTEGER
);
```
