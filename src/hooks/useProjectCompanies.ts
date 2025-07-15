
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
        console.log('⚠️ No session found, returning empty array');
        return [];
      }
      
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('name');
      
      if (error) {
        console.error('Erro ao carregar empresas:', error);
        return [];
      }
      
      console.log('✅ Project companies loaded for user:', sessionData.session.user.email, '- Count:', data?.length);
      return data as ProjectCompany[];
    }
  });

  return {
    companies,
    isLoading
  };
};
