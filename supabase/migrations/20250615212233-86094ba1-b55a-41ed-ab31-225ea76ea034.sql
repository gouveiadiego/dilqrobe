
ALTER TABLE public.categories
ADD COLUMN project_company_id UUID REFERENCES public.project_companies(id) ON DELETE SET NULL;
