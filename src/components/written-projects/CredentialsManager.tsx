
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Plus,
  Shield,
  ExternalLink
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Credential = {
  id: string;
  title: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  company_id: string;
  project_companies?: {
    name: string;
  };
};

export function CredentialsManager() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [newCredential, setNewCredential] = useState<Omit<Credential, 'id'>>({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    company_id: '',
  });
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['project-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

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
      return data as Credential[];
    }
  });

  const addCredentialMutation = useMutation({
    mutationFn: async (credential: Omit<Credential, 'id'>) => {
      const { data, error } = await supabase
        .from('project_credentials')
        .insert(credential)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success('Credencial adicionada com sucesso!');
      setIsAddDialogOpen(false);
      resetNewCredentialForm();
    },
    onError: (error) => {
      console.error('Erro ao adicionar credencial:', error);
      toast.error('Erro ao adicionar credencial');
    }
  });

  const updateCredentialMutation = useMutation({
    mutationFn: async (credential: Credential) => {
      const { data, error } = await supabase
        .from('project_credentials')
        .update({
          title: credential.title,
          username: credential.username,
          password: credential.password,
          url: credential.url,
          notes: credential.notes,
          company_id: credential.company_id
        })
        .eq('id', credential.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success('Credencial atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setEditingCredential(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar credencial:', error);
      toast.error('Erro ao atualizar credencial');
    }
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      const { error } = await supabase
        .from('project_credentials')
        .delete()
        .eq('id', credentialId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success('Credencial removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover credencial:', error);
      toast.error('Erro ao remover credencial');
    }
  });

  const resetNewCredentialForm = () => {
    setNewCredential({
      title: '',
      username: '',
      password: '',
      url: '',
      notes: '',
      company_id: '',
    });
  };

  const handleAddCredential = () => {
    if (!newCredential.title || !newCredential.password || !newCredential.company_id) {
      toast.error('Título, senha e empresa são obrigatórios');
      return;
    }
    addCredentialMutation.mutate(newCredential);
  };

  const handleUpdateCredential = () => {
    if (!editingCredential || !editingCredential.title || !editingCredential.password || !editingCredential.company_id) {
      toast.error('Título, senha e empresa são obrigatórios');
      return;
    }
    updateCredentialMutation.mutate(editingCredential);
  };

  const handleDeleteCredential = (credentialId: string) => {
    deleteCredentialMutation.mutate(credentialId);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Credenciais de Projeto</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Credencial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Credencial</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">Título</label>
                <Input
                  id="title"
                  value={newCredential.title}
                  onChange={(e) => setNewCredential({ ...newCredential, title: e.target.value })}
                  placeholder="Nome da credencial"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="company" className="text-sm font-medium">Empresa</label>
                <Select
                  value={newCredential.company_id}
                  onValueChange={(value) => setNewCredential({ ...newCredential, company_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="username" className="text-sm font-medium">Usuário</label>
                <Input
                  id="username"
                  value={newCredential.username || ''}
                  onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                  placeholder="Nome de usuário"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium">Senha</label>
                <Input
                  id="password"
                  type="password"
                  value={newCredential.password}
                  onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                  placeholder="Senha"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="url" className="text-sm font-medium">URL</label>
                <Input
                  id="url"
                  value={newCredential.url || ''}
                  onChange={(e) => setNewCredential({ ...newCredential, url: e.target.value })}
                  placeholder="https://exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="notes" className="text-sm font-medium">Notas</label>
                <Textarea
                  id="notes"
                  value={newCredential.notes || ''}
                  onChange={(e) => setNewCredential({ ...newCredential, notes: e.target.value })}
                  placeholder="Informações adicionais"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddCredential}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {credentials.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100 md:col-span-2 lg:col-span-3">
            <Shield className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h4 className="text-lg font-medium text-gray-700 mb-1">Nenhuma credencial encontrada</h4>
            <p className="text-gray-500 mb-4">Comece adicionando uma nova credencial de acesso.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Credencial
            </Button>
          </div>
        ) : (
          credentials.map((credential) => (
            <div key={credential.id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{credential.title}</h4>
                  <p className="text-sm text-gray-600">
                    {credential.project_companies?.name}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={isEditDialogOpen && editingCredential?.id === credential.id} onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) setEditingCredential(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => setEditingCredential(credential)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Editar Credencial</DialogTitle>
                      </DialogHeader>
                      {editingCredential && (
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label htmlFor="edit-title" className="text-sm font-medium">Título</label>
                            <Input
                              id="edit-title"
                              value={editingCredential.title}
                              onChange={(e) => setEditingCredential({ ...editingCredential, title: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="edit-company" className="text-sm font-medium">Empresa</label>
                            <Select
                              value={editingCredential.company_id}
                              onValueChange={(value) => setEditingCredential({ ...editingCredential, company_id: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma empresa" />
                              </SelectTrigger>
                              <SelectContent>
                                {companies.map((company) => (
                                  <SelectItem key={company.id} value={company.id}>
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="edit-username" className="text-sm font-medium">Usuário</label>
                            <Input
                              id="edit-username"
                              value={editingCredential.username || ''}
                              onChange={(e) => setEditingCredential({ ...editingCredential, username: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="edit-password" className="text-sm font-medium">Senha</label>
                            <Input
                              id="edit-password"
                              type={showPassword[`edit-${editingCredential.id}`] ? "text" : "password"}
                              value={editingCredential.password}
                              onChange={(e) => setEditingCredential({ ...editingCredential, password: e.target.value })}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => togglePasswordVisibility(`edit-${editingCredential.id}`)}
                            >
                              {showPassword[`edit-${editingCredential.id}`] ? "Ocultar Senha" : "Mostrar Senha"}
                            </Button>
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="edit-url" className="text-sm font-medium">URL</label>
                            <Input
                              id="edit-url"
                              value={editingCredential.url || ''}
                              onChange={(e) => setEditingCredential({ ...editingCredential, url: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="edit-notes" className="text-sm font-medium">Notas</label>
                            <Textarea
                              id="edit-notes"
                              value={editingCredential.notes || ''}
                              onChange={(e) => setEditingCredential({ ...editingCredential, notes: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdateCredential}>Salvar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Credencial</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta credencial? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteCredential(credential.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                {credential.username && (
                  <div className="text-sm">
                    <span className="font-medium">Usuário: </span>
                    {credential.username}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Senha: </span>
                  <div className="inline-flex items-center">
                    <span className="mr-2">
                      {showPassword[credential.id] ? credential.password : "••••••••"}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => togglePasswordVisibility(credential.id)}
                    >
                      {showPassword[credential.id] ? "Ocultar" : "Mostrar"}
                    </Button>
                  </div>
                </div>
                {credential.url && (
                  <div className="text-sm">
                    <a 
                      href={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline inline-flex items-center"
                    >
                      Acessar site
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
                {credential.notes && (
                  <div className="text-sm mt-2 pt-2 border-t border-gray-100">
                    <div className="font-medium mb-1">Notas:</div>
                    <p className="text-gray-600">{credential.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
