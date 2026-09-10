-- Additive PoC migration. Register only verified Slack members of this workspace.
-- A mapped card owner can answer their own card without this additional grant.
CREATE TABLE IF NOT EXISTS poc_responders (
  team_id TEXT NOT NULL,
  slack_user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  PRIMARY KEY(team_id, slack_user_id)
);
