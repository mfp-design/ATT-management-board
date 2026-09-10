-- PoC-only rehearsal. Keep the original answer/revisions and an immutable reset snapshot.
CREATE TABLE IF NOT EXISTS poc_reminder_tests (
  test_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  run_date TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  source_ts TEXT NOT NULL,
  prompt_ts TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  before_json TEXT NOT NULL,
  reset_at TEXT NOT NULL,
  reset_token TEXT NOT NULL,
  reason TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('prepared','resetting','armed','sending','sent','skipped','uncertain','reset_uncertain')),
  outcome TEXT,
  message_ts TEXT,
  sent_at TEXT,
  UNIQUE(team_id,transaction_id,run_date)
);
CREATE TABLE IF NOT EXISTS poc_classification_answers (
  team_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  classified_at TEXT NOT NULL,
  user_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  PRIMARY KEY(team_id,transaction_id,classified_at)
);
