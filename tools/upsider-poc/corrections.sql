-- Apply after classification.sql. Additive PoC migration; no production month closing model.
CREATE TABLE IF NOT EXISTS poc_correction_requests (
  request_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  expected_business TEXT NOT NULL,
  expected_at TEXT NOT NULL,
  view_id TEXT,
  stage TEXT NOT NULL CHECK(stage IN ('edit','confirm','applied')),
  business_id TEXT,
  reason TEXT,
  expires_at TEXT NOT NULL,
  apply_token TEXT,
  applied_at TEXT
);
CREATE TABLE IF NOT EXISTS poc_classification_revisions (
  request_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  before_business TEXT NOT NULL,
  after_business TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
-- Minimal signed interaction evidence; no body, token, trigger_id or response_url.
CREATE TABLE IF NOT EXISTS poc_interaction_receipts (
  receipt_id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  team_id TEXT,
  actor_id TEXT,
  action TEXT,
  target_id TEXT,
  message_ts TEXT,
  http_status INTEGER NOT NULL,
  response_action TEXT
);
