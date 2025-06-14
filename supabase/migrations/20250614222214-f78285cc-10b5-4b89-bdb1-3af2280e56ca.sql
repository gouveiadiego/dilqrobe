
-- Tabela para posts e ideias de calendário editorial por empresa
CREATE TABLE public.editorial_calendar_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  post_date date NOT NULL,
  idea text NOT NULL,
  status text DEFAULT 'planejado', -- Exemplo: planejado, aprovado, feito, publicado
  responsible text,               -- nome ou email opcional
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS: Bloquear tudo por padrão
ALTER TABLE public.editorial_calendar_posts ENABLE ROW LEVEL SECURITY;
-- Selecionar apenas as ideias do próprio usuário
CREATE POLICY "Selecionar só minhas ideias" 
  ON public.editorial_calendar_posts
  FOR SELECT USING (auth.uid() = user_id);
-- Inserir apenas no próprio calendário
CREATE POLICY "Inserir só como dono"
  ON public.editorial_calendar_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Atualizar só as próprias ideias
CREATE POLICY "Atualizar só minhas ideias"
  ON public.editorial_calendar_posts
  FOR UPDATE USING (auth.uid() = user_id);
-- Deletar só as próprias ideias
CREATE POLICY "Deletar só minhas ideias"
  ON public.editorial_calendar_posts
  FOR DELETE USING (auth.uid() = user_id);
