CREATE TABLE IF NOT EXISTS study_sessions (
  id BIGSERIAL PRIMARY KEY,
  participant_id TEXT NOT NULL,
  time_condition TEXT NOT NULL,
  read_seconds TEXT NOT NULL,
  k INTEGER NOT NULL,
  aligned_is_a BOOLEAN NOT NULL,
  order_ab TEXT NOT NULL,
  restaurant_key TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  cue_set JSONB NOT NULL,
  aligned_order JSONB NOT NULL,
  baseline_order JSONB NOT NULL,
  selected_count INTEGER NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_answers (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  explanation_label TEXT NOT NULL,
  decision TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  starts_important INTEGER NOT NULL,
  gist JSONB NOT NULL,
  coverage TEXT NOT NULL,
  full_reading_time_sec INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
