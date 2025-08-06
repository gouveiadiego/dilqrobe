
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface CompanyShareButtonProps {
  companyId: string;
  companyName: string;
}

interface ShareLink {
  id: string;
  share_token: string;
  slug: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function CompanyShareButton({ companyId, companyName }: CompanyShareButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch existing share links for this company
  const { data: shareLinks = [], isLoading } = useQuery({
    queryKey: ['company-share-links', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_share_links')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching share links:', error);
        throw error;
      }

      return data as ShareLink[];
    }
  });

  // Create new share link mutation
  const createShareLinkMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const shareToken = crypto.randomUUID();
      
      // Generate slug using the database function
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_company_slug', { 
          company_name: companyName
        });

      if (slugError) {
        console.error('Error generating slug:', slugError);
      }

      const slug = slugData || null;
      
      const { data, error } = await supabase
        .from('company_share_links')
        .insert([{
          company_id: companyId,
          share_token: shareToken,
          slug: slug,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating share link:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-share-links', companyId] });
      toast.success('Link de compartilhamento criado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar link de compartilhamento');
    }
  });

  // Toggle link status mutation
  const toggleLinkMutation = useMutation({
    mutationFn: async ({ linkId, isActive }: { linkId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('company_share_links')
        .update({ is_active: isActive })
        .eq('id', linkId);

      if (error) {
        console.error('Error updating share link:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-share-links', companyId] });
      toast.success('Status do link atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status do link');
    }
  });

  const generateShareUrl = (link: ShareLink) => {
    const identifier = link.slug || link.share_token;
    return `${window.location.origin}/shared-company/${identifier}`;
  };

  const copyToClipboard = async (link: ShareLink) => {
    const shareUrl = generateShareUrl(link);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToken(link.share_token);
      toast.success('Link copiado para a área de transferência');
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const openInNewTab = (link: ShareLink) => {
    const shareUrl = generateShareUrl(link);
    window.open(shareUrl, '_blank');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-1" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar {companyName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <Label>Links de Compartilhamento</Label>
            <Button 
              size="sm" 
              onClick={() => createShareLinkMutation.mutate()}
              disabled={createShareLinkMutation.isPending}
            >
              Criar Novo Link
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center p-4">Carregando links...</div>
          ) : shareLinks.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              Nenhum link de compartilhamento criado
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {shareLinks.map((link) => (
                <div key={link.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={(checked) => 
                          toggleLinkMutation.mutate({ linkId: link.id, isActive: checked })
                        }
                      />
                      <span className="text-sm font-medium">
                        {link.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(link)}
                        title="Copiar link"
                      >
                        {copiedToken === link.share_token ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInNewTab(link)}
                        title="Abrir em nova aba"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-foreground">
                          {companyName}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        link.is_active 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {link.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Link público compartilhável
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Criado em: {new Date(link.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
