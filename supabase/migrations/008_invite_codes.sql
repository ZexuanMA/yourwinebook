-- ============================================================
-- INVITE CODES — Internal testing gate
-- ============================================================
CREATE TABLE invite_codes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_unused ON invite_codes(used_by) WHERE used_by IS NULL;

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "invite_codes_admin_all"
  ON invite_codes FOR ALL
  USING (is_admin());

-- Anyone can check if a code is valid (for registration)
CREATE POLICY "invite_codes_select_valid"
  ON invite_codes FOR SELECT
  USING (used_by IS NULL AND (expires_at IS NULL OR expires_at > now()));
