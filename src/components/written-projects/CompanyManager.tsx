import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ExternalLink, Trash2, Link, Settings } from "lucide-react";
import { toast } from "sonner";
import { ClientPortalManager } from "./ClientPortalManager";

interface Company {
  id: string;
  name: string;
  description: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export function CompanyManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPortalDialogOpen, setIsPortalDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: "",
    description: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
  });

  // Fetch companies
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['project-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        toast.error('Erro ao carregar empresas');
        throw error;
      }

      return data as Company[];
    }
  });

  // Add company mutation
  const addCompanyMutation = useMutation({
    mutationFn: async (company: Omit<Company, "id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('project_companies')
        .insert([{ ...company, user_id: user.id }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao adicionar empresa');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      setNewCompany({
        name: "",
        description: "",
        contact_person: "",
        contact_email: "",
        contact_phone: "",
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['project-companies'] });
      toast.success('Empresa adicionada com sucesso');
    }
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from('project_companies')
        .delete()
        .eq('id', companyId);

      if (error) {
        toast.error('Erro ao excluir empresa');
        throw error;
      }
    },
    onSuccess: () => {
      setIsDeleteConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['project-companies'] });
      toast.success('Empresa excluída com sucesso');
    }
  });

  const handleAddCompany = () => {
    if (!newCompany.name.trim()) {
      toast.error('O nome da empresa é obrigatório');
      return;
    }

    addCompanyMutation.mutate(newCompany);
  };

  const handleDeleteCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteCompany = () => {
    if (selectedCompanyId) {
      deleteCompanyMutation.mutate(selectedCompanyId);
    }
  };

  const handleViewCompanyDetails = (companyId: string) => {
    navigate(`/company/${companyId}`);
  };

  const handlePortalManager = (company: Company) => {
    setSelectedCompany(company);
    setIsPortalDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCompany(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando empresas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Empresas</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Adicionar Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Nome da Empresa*</label>
                <Input
                  id="name"
                  name="name"
                  value={newCompany.name}
                  onChange={handleInputChange}
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
                <Textarea
                  id="description"
                  name="description"
                  value={newCompany.description}
                  onChange={handleInputChange}
                  placeholder="Descrição da empresa ou projeto"
                  rows={3}
                />
              </div>
              <div>
                <label htmlFor="contact_person" className="block text-sm font-medium mb-1">Pessoa de Contato</label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  value={newCompany.contact_person}
                  onChange={handleInputChange}
                  placeholder="Nome da pessoa de contato"
                />
              </div>
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium mb-1">Email de Contato</label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={newCompany.contact_email}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium mb-1">Telefone de Contato</label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  value={newCompany.contact_phone}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddCompany}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e todos os dados relacionados (checklists, credenciais, etc.) serão perdidos.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteCompany}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portal Manager Dialog */}
      <Dialog open={isPortalDialogOpen} onOpenChange={setIsPortalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Links de Acesso - {selectedCompany?.name}</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <ClientPortalManager 
              companyId={selectedCompany.id} 
              companyName={selectedCompany.name}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {companies.length === 0 ? (
          <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Nenhuma empresa cadastrada</p>
            <Button 
              variant="link" 
              onClick={() => setIsAddDialogOpen(true)}
              className="mt-2"
            >
              Adicionar empresa
            </Button>
          </div>
        ) : (
          companies.map((company) => (
            <Card key={company.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 p-4 border-b">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium truncate">{company.name}</h3>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewCompanyDetails(company.id)}
                      title="Ver detalhes"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handlePortalManager(company)}
                      title="Gerenciar links de acesso"
                    >
                      <Link className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteCompany(company.id)}
                      title="Excluir empresa"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 truncate">{company.description || "Sem descrição"}</p>
              </CardHeader>
              <CardContent className="p-4">
                {company.contact_person && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-500">Contato:</span>{" "}
                    <span>{company.contact_person}</span>
                  </div>
                )}
                {company.contact_email && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-500">Email:</span>{" "}
                    <span className="truncate block">{company.contact_email}</span>
                  </div>
                )}
                {company.contact_phone && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Telefone:</span>{" "}
                    <span>{company.contact_phone}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 p-3 border-t flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewCompanyDetails(company.id)}
                >
                  Ver Detalhes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePortalManager(company)}
                  title="Links de acesso"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
