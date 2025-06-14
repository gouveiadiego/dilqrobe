
-- 1. Tabela para templates de projeto
CREATE TABLE public.project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Tabela para itens dos templates
CREATE TABLE public.project_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS: ativar e garantir acesso apenas ao dono nos templates
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários veem apenas seus próprios templates"
  ON public.project_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários inserem seus próprios templates"
  ON public.project_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários editam seus próprios templates"
  ON public.project_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários excluem seus próprios templates"
  ON public.project_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS: garantir que só acessem itens de templates que possuem
ALTER TABLE public.project_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários veem apenas itens de seus próprios templates"
  ON public.project_template_items
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.project_templates pt
      WHERE pt.id = template_id AND pt.user_id = auth.uid()
    )
  );
CREATE POLICY "Usuários inserem apenas itens em seus templates"
  ON public.project_template_items
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.project_templates pt
      WHERE pt.id = template_id AND pt.user_id = auth.uid()
    )
  );
CREATE POLICY "Usuários alteram itens de seus próprios templates"
  ON public.project_template_items
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM public.project_templates pt
      WHERE pt.id = template_id AND pt.user_id = auth.uid()
    )
  );
CREATE POLICY "Usuários excluem itens de seus próprios templates"
  ON public.project_template_items
  FOR DELETE USING (
    EXISTS(
      SELECT 1 FROM public.project_templates pt
      WHERE pt.id = template_id AND pt.user_id = auth.uid()
    )
  );
