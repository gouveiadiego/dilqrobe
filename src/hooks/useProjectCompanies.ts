
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
}

export const useProjectCompanies = () => {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['project-companies'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Not authenticated');
      }
      
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('name');
      
      if (error) {
        console.error('Erro ao carregar empresas:', error);
        throw error;
      }
      
      return data as ProjectCompany[];
    }
  });

  return {
    companies,
    isLoading
  };
};
