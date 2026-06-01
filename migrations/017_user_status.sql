-- Migration: Add user status column for suspension support (#140)
-- Pairs with #48 auto-suspend flow

ALTER TABLE users
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  ADD COLUMN suspension_reason TEXT,
  ADD COLUMN suspended_at TIMESTAMPTZ,
  ADD COLUMN suspended_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_status ON users (status);

-- Down migration (for rollback):
-- ALTER TABLE users
--   DROP COLUMN status,
--   DROP COLUMN suspension_reason,
--   DROP COLUMN suspended_at,
--   DROP COLUMN suspended_by;
-- DROP INDEX IF EXISTS idx_users_status;
