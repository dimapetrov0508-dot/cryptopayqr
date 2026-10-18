CREATE TABLE IF NOT EXISTS users (id BIGINT PRIMARY KEY, username TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS payment_orders (id UUID PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), amount_rub NUMERIC(18,2) NOT NULL, network TEXT NOT NULL CHECK (network IN ('TRC20','BEP20')), status TEXT NOT NULL, tx_hash TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), paid_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS payment_events (event_id TEXT PRIMARY KEY, order_id UUID NOT NULL REFERENCES payment_orders(id), event_type TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS payment_orders_user_idx ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS payment_orders_status_idx ON payment_orders(status);
