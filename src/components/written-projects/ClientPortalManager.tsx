
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, Copy, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import bcrypt from "bcryptjs";

interface ClientPortalLink {
  id: string;
  company_id: string;
  access_token: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface ClientPortalManagerProps {
  companyId: string;
  companyName: string;
}

export function ClientPortalManager({ companyId, companyName }: ClientPortalManagerProps) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  // Fetch portal links for the company
  const { data: portalLinks = [], isLoading } = useQuery({
    queryKey: ['client-portal-links', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_portal_links')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar links de acesso');
        throw error;
      }

      return data as ClientPortalLink[];
    }
  });

  // Create portal link mutation
  const createLinkMutation = useMutation({
    mutationFn: async ({ password, expiresAt }: { password: string; expiresAt?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate a unique access token
      const accessToken = `client_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
      
      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from('client_portal_links')
        .insert([{
          company_id: companyId,
          access_token: accessToken,
          password_hash: passwordHash,
          expires_at: expiresAt || null,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar link de acesso');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      setPassword("");
      setExpiresAt("");
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['client-portal-links', companyId] });
      toast.success('Link de acesso criado com sucesso');
    }
  });

  // Delete portal link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('client_portal_links')
        .delete()
        .eq('id', linkId);

      if (error) {
        toast.error('Erro ao excluir link de acesso');
        throw error;
      }
    },
    onSuccess: () => {
      setIsDeleteConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['client-portal-links', companyId] });
      toast.success('Link de acesso excluído com sucesso');
    }
  });

  // Toggle link status mutation
  const toggleLinkMutation = useMutation({
    mutationFn: async ({ linkId, isActive }: { linkId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('client_portal_links')
        .update({ is_active: isActive })
        .eq('id', linkId);

      if (error) {
        toast.error('Erro ao atualizar status do link');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-links', companyId] });
      toast.success('Status do link atualizado');
    }
  });

  const handleCreateLink = () => {
    if (!password.trim()) {
      toast.error('A senha é obrigatória');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    createLinkMutation.mutate({ password, expiresAt });
  };

  const handleDeleteLink = (linkId: string) => {
    setSelectedLinkId(linkId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteLink = () => {
    if (selectedLinkId) {
      deleteLinkMutation.mutate(selectedLinkId);
    }
  };

  const copyLinkToClipboard = (accessToken: string) => {
    const link = `${window.location.origin}/client-portal/${accessToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência');
  };

  const getPortalUrl = (accessToken: string) => {
    return `${window.location.origin}/client-portal/${accessToken}`;
  };

  if (isLoading) {
    return <div className="p-4 text-center">Carregando links de acesso...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Links de Acesso para Clientes</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Criar Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Link de Acesso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">Senha de Acesso*</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha para o cliente"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label htmlFor="expires_at" className="block text-sm font-medium mb-1">Data de Expiração (opcional)</label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateLink} disabled={createLinkMutation.isPending}>
                {createLinkMutation.isPending ? 'Criando...' : 'Criar Link'}
              </Button>
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
            <p>Tem certeza que deseja excluir este link de acesso? Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteLink}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {portalLinks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhum link de acesso criado</p>
              <Button 
                variant="link" 
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-2"
              >
                Criar primeiro link
              </Button>
            </CardContent>
          </Card>
        ) : (
          portalLinks.map((link) => (
            <Card key={link.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Link de Acesso</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      link.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {link.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLinkMutation.mutate({ 
                        linkId: link.id, 
                        isActive: !link.is_active 
                      })}
                    >
                      {link.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <Link className="h-4 w-4 text-gray-500" />
                    <code className="text-sm flex-1 truncate">
                      {getPortalUrl(link.access_token)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLinkToClipboard(link.access_token)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>Criado em: {new Date(link.created_at).toLocaleString('pt-BR')}</p>
                    {link.expires_at && (
                      <p>Expira em: {new Date(link.expires_at).toLocaleString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
