-- Apply only to att-upsider-poc-db. No production records.
CREATE TABLE IF NOT EXISTS poc_events (
  team_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_ts TEXT NOT NULL,
  received_at TEXT NOT NULL,
  raw_body TEXT NOT NULL,
  PRIMARY KEY (team_id, event_id)
);
