
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CredentialsManager() {
  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_credentials')
        .select(`
          *,
          project_companies (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Credentials</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Credentials
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {credentials.map((credential) => (
          <div key={credential.id} className="p-4 border rounded-lg">
            <h4 className="font-medium">{credential.title}</h4>
            <p className="text-sm">Company: {credential.project_companies?.name}</p>
            <p className="text-sm">Username: {credential.username}</p>
            {credential.url && (
              <p className="text-sm">
                <a href={credential.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Visit Site
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
