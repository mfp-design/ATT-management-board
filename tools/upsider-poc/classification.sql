-- Additive migration: apply after schema.sql, only to the PoC database.
CREATE TABLE IF NOT EXISTS poc_card_owners (
  team_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  slack_user_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  PRIMARY KEY(team_id, card_id)
);
CREATE TABLE IF NOT EXISTS poc_classifications (
  team_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  source_ts TEXT NOT NULL,
  event_id TEXT NOT NULL,
  details TEXT NOT NULL,
  owner_id TEXT,
  state TEXT NOT NULL CHECK(state IN ('unmapped','pending','classified','review_required')),
  business_id TEXT,
  classified_by TEXT,
  classified_at TEXT,
  prompt_ts TEXT,
  PRIMARY KEY(team_id, transaction_id)
);
CREATE TABLE IF NOT EXISTS poc_parse_reviews (
  team_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  PRIMARY KEY(team_id,event_id)
);
CREATE TABLE IF NOT EXISTS poc_classification_audit (
  team_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(team_id,transaction_id)
);
CREATE TABLE IF NOT EXISTS poc_slack_outbox (
  team_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('prompt','update')),
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sending','sent','uncertain')),
  PRIMARY KEY(team_id,transaction_id,kind)
);
