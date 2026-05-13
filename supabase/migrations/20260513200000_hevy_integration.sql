-- ============================================================
-- Hevy Integration Tables
-- ============================================================

-- Store user's Hevy API key (encrypted at rest via Supabase vault or base64 obfuscation)
CREATE TABLE IF NOT EXISTS hevy_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    workout_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE hevy_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hevy integration"
    ON hevy_integrations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Cache of synced workouts from Hevy API
CREATE TABLE IF NOT EXISTS hevy_workouts_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hevy_workout_id TEXT NOT NULL,
    workout_date DATE NOT NULL,
    title TEXT,
    description TEXT,
    duration_seconds INTEGER,
    volume_kg DECIMAL(10,2),
    exercise_count INTEGER DEFAULT 0,
    set_count INTEGER DEFAULT 0,
    muscle_groups TEXT[] DEFAULT '{}',
    exercises JSONB DEFAULT '[]',
    raw_data JSONB,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, hevy_workout_id)
);

CREATE INDEX IF NOT EXISTS hevy_workouts_user_date_idx ON hevy_workouts_cache (user_id, workout_date DESC);

ALTER TABLE hevy_workouts_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own workout cache"
    ON hevy_workouts_cache
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on hevy_integrations
CREATE OR REPLACE FUNCTION update_hevy_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hevy_integrations_updated_at
    BEFORE UPDATE ON hevy_integrations
    FOR EACH ROW EXECUTE FUNCTION update_hevy_integrations_updated_at();
