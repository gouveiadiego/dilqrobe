
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Credential {
  id: string;
  company_id: string;
  title: string;
  username: string;
  password: string;
  url: string | null;
  notes: string | null;
}

interface CompanyCredentialsProps {
  companyId: string;
  companyName: string;
}

export function CompanyCredentials({ companyId, companyName }: CompanyCredentialsProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['company-credentials', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_credentials')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Erro ao carregar credenciais');
        throw error;
      }
      
      return data as Credential[];
    }
  });

  const addCredentialMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const newCredential = {
        company_id: companyId,
        title: formData.get('title') as string,
        username: formData.get('username') as string,
        password: formData.get('password') as string,
        url: formData.get('url') as string || null,
        notes: formData.get('notes') as string || null,
      };

      const { error } = await supabase
        .from('project_credentials')
        .insert([newCredential]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-credentials', companyId] });
      setOpen(false);
      toast.success('Credencial adicionada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar credencial');
      console.error(error);
    }
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-credentials', companyId] });
      toast.success('Credencial removida com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao remover credencial');
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    addCredentialMutation.mutate(formData);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDeleteCredential = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta credencial?")) {
      deleteCredentialMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Carregando credenciais...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Credenciais do Projeto</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Credencial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Credencial para {companyName}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" required placeholder="Ex: Instagram, Facebook, Site" />
              </div>
              <div>
                <Label htmlFor="username">Usuário/Email</Label>
                <Input id="username" name="username" required />
              </div>
              <div className="relative">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword['new'] ? "text" : "password"} 
                  required 
                />
                <button 
                  type="button"
                  className="absolute right-2 top-7"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPassword['new'] ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
              <div>
                <Label htmlFor="url">URL (opcional)</Label>
                <Input id="url" name="url" placeholder="https://" />
              </div>
              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit">Adicionar Credencial</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {credentials.length === 0 ? (
          <p className="text-gray-500 text-center py-4 col-span-2">Nenhuma credencial adicionada ainda.</p>
        ) : (
          credentials.map((credential) => (
            <Card key={credential.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md">{credential.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCredential(credential.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-500">Usuário/Email</Label>
                  <p className="text-sm">{credential.username}</p>
                </div>
                <div className="relative">
                  <Label className="text-xs text-gray-500">Senha</Label>
                  <div className="flex items-center">
                    <Input 
                      value={credential.password}
                      type={showPassword[credential.id] ? "text" : "password"} 
                      readOnly
                      className="pr-8 text-sm"
                    />
                    <button 
                      type="button"
                      className="absolute right-2"
                      onClick={() => togglePasswordVisibility(credential.id)}
                    >
                      {showPassword[credential.id] ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                {credential.url && (
                  <div>
                    <Label className="text-xs text-gray-500">URL</Label>
                    <div className="flex items-center">
                      <a 
                        href={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center"
                      >
                        {credential.url}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
                {credential.notes && (
                  <div>
                    <Label className="text-xs text-gray-500">Observações</Label>
                    <p className="text-sm">{credential.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
