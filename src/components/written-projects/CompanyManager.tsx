
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  description: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export function CompanyManager() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .order('name');
      
      if (error) {
        toast.error('Erro ao carregar empresas');
        throw error;
      }
      
      return data;
    }
  });

  const addCompanyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      const newCompany = {
        user_id: user.id,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        contact_person: formData.get('contact_person') as string,
        contact_email: formData.get('contact_email') as string,
        contact_phone: formData.get('contact_phone') as string,
      };

      const { error } = await supabase.from('project_companies').insert([newCompany]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setOpen(false);
      toast.success('Empresa adicionada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar empresa');
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    addCompanyMutation.mutate(formData);
  };

  const handleCompanyClick = (company: Company) => {
    navigate(`/company/${company.id}`);
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Empresas</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Empresa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="contact_person">Pessoa de Contato</Label>
                <Input id="contact_person" name="contact_person" />
              </div>
              <div>
                <Label htmlFor="contact_email">Email de Contato</Label>
                <Input id="contact_email" name="contact_email" type="email" />
              </div>
              <div>
                <Label htmlFor="contact_phone">Telefone de Contato</Label>
                <Input id="contact_phone" name="contact_phone" />
              </div>
              <Button type="submit">Adicionar Empresa</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company: Company) => (
          <button
            key={company.id}
            onClick={() => handleCompanyClick(company)}
            className="p-4 border rounded-lg space-y-2 text-left w-full hover:border-purple-500 transition-colors"
          >
            <h4 className="font-medium">{company.name}</h4>
            {company.description && <p className="text-sm text-gray-600">{company.description}</p>}
            {company.contact_person && (
              <p className="text-sm">
                <strong>Contato:</strong> {company.contact_person}
              </p>
            )}
            {company.contact_email && (
              <p className="text-sm">
                <strong>Email:</strong> {company.contact_email}
              </p>
            )}
            {company.contact_phone && (
              <p className="text-sm">
                <strong>Telefone:</strong> {company.contact_phone}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
