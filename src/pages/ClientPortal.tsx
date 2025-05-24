
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Building2, CheckCircle2, Clock, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import bcrypt from "bcryptjs";

interface Company {
  id: string;
  name: string;
  description: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  created_at: string;
}

interface ContentTask {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  client_status: string;
  completed: boolean;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  category: string | null;
  completed: boolean;
  created_at: string;
}

export default function ClientPortal() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already authenticated on component mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem(`client_portal_auth_${accessToken}`);
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, [accessToken]);

  // Verify portal link exists and get company data
  const { data: portalData, isLoading: isPortalLoading } = useQuery({
    queryKey: ['client-portal', accessToken],
    queryFn: async () => {
      if (!accessToken) throw new Error('Access token is required');

      const { data, error } = await supabase
        .from('client_portal_links')
        .select(`
          id,
          company_id,
          is_active,
          expires_at,
          project_companies!inner (
            id,
            name,
            description,
            contact_person,
            contact_email,
            contact_phone
          )
        `)
        .eq('access_token', accessToken)
        .single();

      if (error || !data) {
        throw new Error('Link de acesso inválido ou expirado');
      }

      // Check if link is active
      if (!data.is_active) {
        throw new Error('Este link de acesso foi desativado');
      }

      // Check if link has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('Este link de acesso expirou');
      }

      return {
        portalLink: data,
        company: data.project_companies as Company
      };
    },
    enabled: !!accessToken
  });

  // Fetch project tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['client-portal-tasks', portalData?.company.id],
    queryFn: async () => {
      if (!portalData?.company.id) return [];

      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('company_id', portalData.company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: isAuthenticated && !!portalData?.company.id
  });

  // Fetch content tasks
  const { data: contentTasks = [] } = useQuery({
    queryKey: ['client-portal-content-tasks', portalData?.company.id],
    queryFn: async () => {
      if (!portalData?.company.id) return [];

      const { data, error } = await supabase
        .from('company_content_tasks')
        .select('*')
        .eq('company_id', portalData.company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContentTask[];
    },
    enabled: isAuthenticated && !!portalData?.company.id
  });

  // Fetch checklist items
  const { data: checklistItems = [] } = useQuery({
    queryKey: ['client-portal-checklist', portalData?.company.id],
    queryFn: async () => {
      if (!portalData?.company.id) return [];

      const { data, error } = await supabase
        .from('project_checklist')
        .select('*')
        .eq('company_id', portalData.company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: isAuthenticated && !!portalData?.company.id
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Digite a senha de acesso');
      return;
    }

    setIsLoading(true);

    try {
      // Get the password hash from the database
      const { data, error } = await supabase
        .from('client_portal_links')
        .select('password_hash')
        .eq('access_token', accessToken)
        .single();

      if (error || !data) {
        toast.error('Erro ao verificar senha');
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, data.password_hash);

      if (isPasswordValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem(`client_portal_auth_${accessToken}`, 'true');
        toast.success('Acesso autorizado!');
      } else {
        toast.error('Senha incorreta');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      toast.error('Erro ao verificar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'concluído':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'medium':
      case 'média':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
      case 'baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isPortalLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando portal do cliente...</p>
        </div>
      </div>
    );
  }

  if (!portalData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
            <p className="text-gray-600">Link de acesso inválido ou expirado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6" />
              {portalData.company.name}
            </CardTitle>
            <p className="text-gray-600">Portal do Cliente</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    disabled={isLoading}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Acessar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">{portalData.company.name}</h1>
          </div>
          {portalData.company.description && (
            <p className="text-gray-600 mb-4">{portalData.company.description}</p>
          )}
          
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {portalData.company.contact_person && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{portalData.company.contact_person}</span>
                  </div>
                )}
                {portalData.company.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{portalData.company.contact_email}</span>
                  </div>
                )}
                {portalData.company.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{portalData.company.contact_phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">Tarefas do Projeto</TabsTrigger>
            <TabsTrigger value="content">Conteúdos</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <h2 className="text-xl font-semibold">Tarefas do Projeto</h2>
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Nenhuma tarefa encontrada
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium">{task.title}</h3>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          {task.priority && (
                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      <div className="text-sm text-gray-500">
                        <p>Criado em: {new Date(task.created_at).toLocaleDateString('pt-BR')}</p>
                        {task.due_date && (
                          <p>Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <h2 className="text-xl font-semibold">Conteúdos Desenvolvidos</h2>
            {contentTasks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Nenhum conteúdo encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {contentTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium">{task.title}</h3>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <Badge variant="outline">
                            {task.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="prose max-w-none mb-3">
                        <p className="text-gray-600">{task.content}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Criado em: {new Date(task.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <h2 className="text-xl font-semibold">Checklist do Projeto</h2>
            {checklistItems.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Nenhum item de checklist encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  checklistItems.reduce((acc, item) => {
                    const category = item.category || 'Geral';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(item);
                    return acc;
                  }, {} as Record<string, ChecklistItem[]>)
                ).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
                            <span className={item.completed ? 'line-through text-gray-500' : ''}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
