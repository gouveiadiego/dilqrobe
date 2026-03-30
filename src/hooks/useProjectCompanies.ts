
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectCompany {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean | null;
  project_type?: 'fixed_monthly' | 'parallel';
}

export const useProjectCompanies = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['project-companies', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        console.error('Erro ao carregar empresas:', error);
        return [];
      }

      return data as ProjectCompany[];
    }
  });

  return {
    companies,
    isLoading
  };
};
