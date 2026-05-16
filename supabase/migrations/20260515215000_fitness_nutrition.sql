-- Create enums
CREATE TYPE nutrition_objective AS ENUM ('cutting', 'recomp', 'manutencao', 'bulking');
CREATE TYPE training_frequency AS ENUM ('1-3x', '4-5x', '6-7x');
CREATE TYPE activity_level AS ENUM ('sedentario', 'leve', 'ativo');
CREATE TYPE stress_level AS ENUM ('baixo', 'medio', 'alto');
CREATE TYPE dietary_restriction AS ENUM ('nenhuma', 'vegetariano', 'vegano');

-- Create fitness_bioimpedance
CREATE TABLE IF NOT EXISTS fitness_bioimpedance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medicao_data DATE NOT NULL DEFAULT CURRENT_DATE,
    peso_kg DECIMAL(5,2) NOT NULL,
    gordura_percentual DECIMAL(5,2),
    massa_magra_kg DECIMAL(5,2),
    tmb_kcal DECIMAL(6,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create fitness_nutrition_profile
CREATE TABLE IF NOT EXISTS fitness_nutrition_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    idade INTEGER NOT NULL,
    sexo TEXT CHECK (sexo IN ('masculino', 'feminino')),
    altura_cm INTEGER NOT NULL,
    peso_kg DECIMAL(5,2), -- fallback if no bioimpedance
    objetivo nutrition_objective NOT NULL DEFAULT 'manutencao',
    frequencia_treino training_frequency NOT NULL DEFAULT '1-3x',
    atividade_fora_treino activity_level NOT NULL DEFAULT 'sedentario',
    alergias TEXT,
    intolerancias TEXT,
    restricao_alimentar dietary_restriction DEFAULT 'nenhuma',
    alimentos_evitar TEXT,
    horas_sono INTEGER,
    nivel_estresse stress_level DEFAULT 'medio',
    usa_ergogenicos BOOLEAN DEFAULT false,
    ergogenicos_quais TEXT,
    dietas_anteriores TEXT,
    observacoes_coach TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create fitness_nutrition_goals
CREATE TABLE IF NOT EXISTS fitness_nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    calories_with_workout DECIMAL(6,2) NOT NULL,
    protein_g DECIMAL(5,2) NOT NULL,
    fat_g DECIMAL(5,2) NOT NULL,
    carbs_g_with_workout DECIMAL(5,2) NOT NULL,
    calories_rest DECIMAL(6,2) NOT NULL,
    carbs_g_rest DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create fitness_nutrition_logs
CREATE TABLE IF NOT EXISTS fitness_nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    food_name TEXT NOT NULL,
    quantity DECIMAL(8,2),
    unit TEXT,
    protein_g DECIMAL(6,2) NOT NULL DEFAULT 0,
    carbs_g DECIMAL(6,2) NOT NULL DEFAULT 0,
    fat_g DECIMAL(6,2) NOT NULL DEFAULT 0,
    calories DECIMAL(6,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger function to calculate goals
CREATE OR REPLACE FUNCTION calculate_nutrition_goals()
RETURNS TRIGGER AS $$
DECLARE
    v_idade INTEGER;
    v_sexo TEXT;
    v_altura_cm INTEGER;
    v_peso_kg DECIMAL;
    v_objetivo nutrition_objective;
    v_frequencia training_frequency;
    v_atividade activity_level;
    
    v_gordura_percentual DECIMAL;
    v_massa_magra_kg DECIMAL;
    v_tmb_bio DECIMAL;
    
    v_tmb DECIMAL;
    v_fator_atividade DECIMAL;
    v_tdee DECIMAL;
    v_ajuste_objetivo DECIMAL;
    
    v_calorias DECIMAL;
    v_proteina DECIMAL;
    v_gordura DECIMAL;
    v_carbo DECIMAL;
    v_calorias_rest DECIMAL;
    v_carbo_rest DECIMAL;
    
    v_user_id UUID;
BEGIN
    -- Determine user_id depending on which table triggered
    IF TG_TABLE_NAME = 'fitness_nutrition_profile' THEN
        v_user_id := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'fitness_bioimpedance' THEN
        v_user_id := NEW.user_id;
    END IF;

    -- Fetch profile data
    SELECT idade, sexo, altura_cm, peso_kg, objetivo, frequencia_treino, atividade_fora_treino
    INTO v_idade, v_sexo, v_altura_cm, v_peso_kg, v_objetivo, v_frequencia, v_atividade
    FROM fitness_nutrition_profile
    WHERE user_id = v_user_id;

    -- If no profile exists yet, do nothing (wait for profile insertion)
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Fetch latest bioimpedance data
    SELECT peso_kg, gordura_percentual, massa_magra_kg, tmb_kcal
    INTO v_peso_kg, v_gordura_percentual, v_massa_magra_kg, v_tmb_bio
    FROM fitness_bioimpedance
    WHERE user_id = v_user_id
    ORDER BY medicao_data DESC, created_at DESC
    LIMIT 1;

    -- If profile weight is null and no bioimpedance, cannot calculate
    IF v_peso_kg IS NULL THEN
        RETURN NEW;
    END IF;

    -- 1. Calculate TMB
    IF v_tmb_bio IS NOT NULL THEN
        v_tmb := v_tmb_bio;
    ELSE
        -- Mifflin-St Jeor
        IF v_sexo = 'masculino' THEN
            v_tmb := (10 * v_peso_kg) + (6.25 * v_altura_cm) - (5 * v_idade) + 5;
        ELSE
            v_tmb := (10 * v_peso_kg) + (6.25 * v_altura_cm) - (5 * v_idade) - 161;
        END IF;
    END IF;

    -- 2. Activity Factor
    IF v_frequencia = '1-3x' THEN
        v_fator_atividade := 1.375;
    ELSIF v_frequencia = '4-5x' THEN
        v_fator_atividade := 1.55;
    ELSIF v_frequencia = '6-7x' THEN
        v_fator_atividade := 1.725;
    ELSE
        v_fator_atividade := 1.2; -- fallback
    END IF;

    v_tdee := v_tmb * v_fator_atividade;

    -- 3. Objective Adjustment
    IF v_objetivo = 'cutting' THEN v_ajuste_objetivo := 0.80;
    ELSIF v_objetivo = 'recomp' THEN v_ajuste_objetivo := 0.95;
    ELSIF v_objetivo = 'manutencao' THEN v_ajuste_objetivo := 1.00;
    ELSIF v_objetivo = 'bulking' THEN v_ajuste_objetivo := 1.10;
    END IF;

    v_calorias := v_tdee * v_ajuste_objetivo;

    -- 4. Protein
    IF v_massa_magra_kg IS NOT NULL AND v_gordura_percentual > 30 THEN
        v_proteina := 2.2 * v_massa_magra_kg;
    ELSE
        v_proteina := 2.0 * v_peso_kg;
    END IF;

    -- 5. Fat
    v_gordura := GREATEST( (v_calorias * 0.25) / 9, v_peso_kg * 0.8 );

    -- 6. Carbs
    v_carbo := (v_calorias - (v_proteina * 4) - (v_gordura * 9)) / 4;
    IF v_carbo < 0 THEN v_carbo := 0; END IF;

    -- 7. Rest day cycling (-10% calories from carbs)
    v_calorias_rest := v_calorias * 0.90;
    v_carbo_rest := (v_calorias_rest - (v_proteina * 4) - (v_gordura * 9)) / 4;
    IF v_carbo_rest < 0 THEN v_carbo_rest := 0; END IF;

    -- Upsert into fitness_nutrition_goals
    INSERT INTO fitness_nutrition_goals (user_id, calories_with_workout, protein_g, fat_g, carbs_g_with_workout, calories_rest, carbs_g_rest)
    VALUES (v_user_id, v_calorias, v_proteina, v_gordura, v_carbo, v_calorias_rest, v_carbo_rest)
    ON CONFLICT (user_id) DO UPDATE SET
        calories_with_workout = EXCLUDED.calories_with_workout,
        protein_g = EXCLUDED.protein_g,
        fat_g = EXCLUDED.fat_g,
        carbs_g_with_workout = EXCLUDED.carbs_g_with_workout,
        calories_rest = EXCLUDED.calories_rest,
        carbs_g_rest = EXCLUDED.carbs_g_rest,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_goals_from_profile
    AFTER INSERT OR UPDATE ON fitness_nutrition_profile
    FOR EACH ROW EXECUTE FUNCTION calculate_nutrition_goals();

CREATE TRIGGER trg_calculate_goals_from_bioimpedance
    AFTER INSERT OR UPDATE ON fitness_bioimpedance
    FOR EACH ROW EXECUTE FUNCTION calculate_nutrition_goals();

-- Enable RLS
ALTER TABLE fitness_bioimpedance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_nutrition_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own bioimpedance" ON fitness_bioimpedance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own nutrition profile" ON fitness_nutrition_profile FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read own nutrition goals" ON fitness_nutrition_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own nutrition logs" ON fitness_nutrition_logs FOR ALL USING (auth.uid() = user_id);
