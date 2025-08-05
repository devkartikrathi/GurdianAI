-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "total_capital" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "max_daily_drawdown_pct" DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    "max_consecutive_losses" INTEGER NOT NULL DEFAULT 3,
    "risk_per_trade_pct" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."broker_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "broker_name" TEXT NOT NULL DEFAULT 'zerodha',
    "api_key" TEXT NOT NULL,
    "api_secret" TEXT,
    "access_token" TEXT,
    "request_token" TEXT,
    "user_id_zerodha" TEXT,
    "user_name" TEXT,
    "email" TEXT,
    "session_generated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "connection_status" TEXT NOT NULL DEFAULT 'active',
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trade_books" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "upload_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parsed" BOOLEAN NOT NULL DEFAULT false,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "schema_mapping" JSONB,

    CONSTRAINT "trade_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."raw_trades" (
    "id" TEXT NOT NULL,
    "trade_book_id" TEXT,
    "user_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "trade_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "trade_datetime" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'csv',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matched_trades" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buy_price" DECIMAL(10,2) NOT NULL,
    "sell_price" DECIMAL(10,2) NOT NULL,
    "pnl" DECIMAL(15,2) NOT NULL,
    "pnl_pct" DECIMAL(8,4) NOT NULL,
    "buy_datetime" TIMESTAMP(3) NOT NULL,
    "sell_datetime" TIMESTAMP(3) NOT NULL,
    "duration" TEXT NOT NULL,
    "trade_session_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matched_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."open_trades" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buy_price" DECIMAL(10,2) NOT NULL,
    "buy_datetime" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "open_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."today_trades" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "trade_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "trade_datetime" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'zerodha_api',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "today_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guardian_ai_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "insight_type" TEXT NOT NULL,
    "insight_data" JSONB NOT NULL,
    "confidence_score" DECIMAL(3,2),
    "trades_analyzed" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardian_ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."risk_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_date" DATE NOT NULL,
    "trades_count" INTEGER NOT NULL DEFAULT 0,
    "current_pnl" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "current_drawdown_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "consecutive_losses" INTEGER NOT NULL DEFAULT 0,
    "last_trade_time" TIMESTAMP(3),
    "risk_status" TEXT NOT NULL DEFAULT 'green',
    "session_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_trading_summary" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_range_start" DATE NOT NULL,
    "data_range_end" DATE NOT NULL,
    "summary_data" JSONB NOT NULL,
    "insights_hash" TEXT,
    "next_update_due" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_trading_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_user_id_key" ON "public"."users"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "broker_connections_user_id_broker_name_key" ON "public"."broker_connections"("user_id", "broker_name");

-- CreateIndex
CREATE UNIQUE INDEX "risk_sessions_user_id_session_date_key" ON "public"."risk_sessions"("user_id", "session_date");

-- AddForeignKey
ALTER TABLE "public"."broker_connections" ADD CONSTRAINT "broker_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trade_books" ADD CONSTRAINT "trade_books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."raw_trades" ADD CONSTRAINT "raw_trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."raw_trades" ADD CONSTRAINT "raw_trades_trade_book_id_fkey" FOREIGN KEY ("trade_book_id") REFERENCES "public"."trade_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matched_trades" ADD CONSTRAINT "matched_trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."guardian_ai_insights" ADD CONSTRAINT "guardian_ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."risk_sessions" ADD CONSTRAINT "risk_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_trading_summary" ADD CONSTRAINT "user_trading_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
