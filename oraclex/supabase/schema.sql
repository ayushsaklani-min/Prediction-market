-- OracleX Markets Table
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT UNIQUE NOT NULL,
  event_id TEXT NOT NULL,
  description TEXT NOT NULL,
  close_timestamp BIGINT NOT NULL,
  vault_address TEXT,
  probability INTEGER,
  outcome SMALLINT,
  ai_hash TEXT,
  proof TEXT,
  proof_hash TEXT,
  proof_cid TEXT,
  creator_address TEXT NOT NULL,
  chain_id BIGINT NOT NULL,
  deploy_error TEXT,
  gas_estimate TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deployed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_markets_market_id ON markets(market_id);
CREATE INDEX IF NOT EXISTS idx_markets_creator ON markets(creator_address);
CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_markets_vault ON markets(vault_address) WHERE vault_address IS NOT NULL;

-- RLS (Row Level Security) - Allow public read, authenticated write
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read markets
DROP POLICY IF EXISTS "Public read access" ON markets;
CREATE POLICY "Public read access" ON markets
  FOR SELECT
  USING (true);

-- Policy: Service role can perform privileged writes.
DROP POLICY IF EXISTS "Service role insert" ON markets;
CREATE POLICY "Service role insert" ON markets
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role update" ON markets;
CREATE POLICY "Service role update" ON markets
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional creator-scoped update path for authenticated users (non-privileged fields only).
DROP POLICY IF EXISTS "Creator update limited" ON markets;
CREATE POLICY "Creator update limited" ON markets
  FOR UPDATE
  USING (auth.role() = 'authenticated' AND lower(creator_address) = lower(auth.jwt() ->> 'wallet_address'))
  WITH CHECK (
    auth.role() = 'authenticated'
    AND lower(creator_address) = lower(auth.jwt() ->> 'wallet_address')
    AND deploy_error IS NULL
    AND deployed_at IS NULL
    AND vault_address IS NULL
    AND ai_hash IS NULL
    AND proof IS NULL
    AND proof_hash IS NULL
    AND proof_cid IS NULL
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

