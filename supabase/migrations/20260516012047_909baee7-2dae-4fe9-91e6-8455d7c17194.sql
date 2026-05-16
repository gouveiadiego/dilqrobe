-- Make nutrition goals calculation trigger run with elevated privileges
-- so it can upsert into fitness_nutrition_goals (which has SELECT-only RLS).
CREATE OR REPLACE FUNCTION public.calculate_nutrition_goals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
    v_user_id := NEW.user_id;

    SELECT idade, sexo, altura_cm, peso_kg, objetivo, frequencia_treino, atividade_fora_treino
    INTO v_idade, v_sexo, v_altura_cm, v_peso_kg, v_objetivo, v_frequencia, v_atividade
    FROM fitness_nutrition_profile
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    SELECT peso_kg, gordura_percentual, massa_magra_kg, tmb_kcal
    INTO v_peso_kg, v_gordura_percentual, v_massa_magra_kg, v_tmb_bio
    FROM fitness_bioimpedance
    WHERE user_id = v_user_id
    ORDER BY medicao_data DESC, created_at DESC
    LIMIT 1;

    IF v_peso_kg IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_tmb_bio IS NOT NULL THEN
        v_tmb := v_tmb_bio;
    ELSE
        IF v_sexo = 'masculino' THEN
            v_tmb := (10 * v_peso_kg) + (6.25 * v_altura_cm) - (5 * v_idade) + 5;
        ELSE
            v_tmb := (10 * v_peso_kg) + (6.25 * v_altura_cm) - (5 * v_idade) - 161;
        END IF;
    END IF;

    IF v_frequencia = '1-3x' THEN v_fator_atividade := 1.375;
    ELSIF v_frequencia = '4-5x' THEN v_fator_atividade := 1.55;
    ELSIF v_frequencia = '6-7x' THEN v_fator_atividade := 1.725;
    ELSE v_fator_atividade := 1.2;
    END IF;

    v_tdee := v_tmb * v_fator_atividade;

    IF v_objetivo = 'cutting' THEN v_ajuste_objetivo := 0.80;
    ELSIF v_objetivo = 'recomp' THEN v_ajuste_objetivo := 0.95;
    ELSIF v_objetivo = 'manutencao' THEN v_ajuste_objetivo := 1.00;
    ELSIF v_objetivo = 'bulking' THEN v_ajuste_objetivo := 1.10;
    END IF;

    v_calorias := v_tdee * v_ajuste_objetivo;

    IF v_massa_magra_kg IS NOT NULL AND v_gordura_percentual > 30 THEN
        v_proteina := 2.2 * v_massa_magra_kg;
    ELSE
        v_proteina := 2.0 * v_peso_kg;
    END IF;

    v_gordura := GREATEST((v_calorias * 0.25) / 9, v_peso_kg * 0.8);
    v_carbo := (v_calorias - (v_proteina * 4) - (v_gordura * 9)) / 4;
    IF v_carbo < 0 THEN v_carbo := 0; END IF;

    v_calorias_rest := v_calorias * 0.90;
    v_carbo_rest := (v_calorias_rest - (v_proteina * 4) - (v_gordura * 9)) / 4;
    IF v_carbo_rest < 0 THEN v_carbo_rest := 0; END IF;

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
$function$;

-- Ensure triggers exist on both source tables
DROP TRIGGER IF EXISTS trg_calc_nutrition_goals_profile ON public.fitness_nutrition_profile;
CREATE TRIGGER trg_calc_nutrition_goals_profile
AFTER INSERT OR UPDATE ON public.fitness_nutrition_profile
FOR EACH ROW EXECUTE FUNCTION public.calculate_nutrition_goals();

DROP TRIGGER IF EXISTS trg_calc_nutrition_goals_bio ON public.fitness_bioimpedance;
CREATE TRIGGER trg_calc_nutrition_goals_bio
AFTER INSERT OR UPDATE ON public.fitness_bioimpedance
FOR EACH ROW EXECUTE FUNCTION public.calculate_nutrition_goals();

-- Ensure unique constraint on user_id for the upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fitness_nutrition_goals_user_id_key'
  ) THEN
    ALTER TABLE public.fitness_nutrition_goals
      ADD CONSTRAINT fitness_nutrition_goals_user_id_key UNIQUE (user_id);
  END IF;
END $$;