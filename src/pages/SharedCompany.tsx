import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Mail, Phone, Calendar, Shield, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// Create a separate client for public access
const supabaseUrl = 'https://wgnvrxubwifcscrbkimm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbnZyeHVid2lmY3NjcmJraW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MjYxNzAsImV4cCI6MjA1NDEwMjE3MH0.AwaBd1VRrzz_DvvDjJ3Ke7CJFoxl5XUB2chymhueybg';

const publicSupabase = createClient(supabaseUrl, supabaseAnonKey);

interface Company {
  id: string;
  name: string;
  description: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

interface ShareLink {
  id: string;
  company_id: string;
  is_active: boolean;
  expires_at: string | null;
}

interface ChecklistItem {
  id: string;
  title: string;
  category: string | null;
  completed: boolean;
}

interface ContentTask {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  client_status: string;
}

export default function SharedCompany() {
  const { token } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [contentTasks, setContentTasks] = useState<ContentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedCompanyData() {
      if (!token) {
        console.error('No token provided in URL');
        setError('Token inválido');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching share link for token:', token);
        
        // First, get the share link to validate and get company_id
        const { data: shareLink, error: shareLinkError } = await publicSupabase
          .from('company_share_links')
          .select('*')
          .eq('share_token', token)
          .eq('is_active', true)
          .maybeSingle();

        console.log('Share link query result:', { shareLink, error: shareLinkError });

        if (shareLinkError) {
          console.error('Share link error:', shareLinkError);
          setError('Erro ao buscar link de compartilhamento: ' + shareLinkError.message);
          setLoading(false);
          return;
        }

        if (!shareLink) {
          console.error('Share link not found or inactive');
          setError('Link inválido ou inativo');
          setLoading(false);
          return;
        }

        // Check if link is expired
        if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
          console.error('Share link expired');
          setError('Link expirado');
          setLoading(false);
          return;
        }

        console.log('Share link found:', shareLink);

        // Fetch company details
        const { data: companyData, error: companyError } = await publicSupabase
          .from('project_companies')
          .select('*')
          .eq('id', shareLink.company_id)
          .maybeSingle();

        console.log('Company query result:', { companyData, error: companyError });

        if (companyError) {
          console.error('Company error:', companyError);
          setError('Erro ao buscar dados da empresa: ' + companyError.message);
          setLoading(false);
          return;
        }

        if (!companyData) {
          console.error('Company not found');
          setError('Empresa não encontrada');
          setLoading(false);
          return;
        }

        console.log('Company data:', companyData);
        setCompany(companyData);

        // Fetch checklist items
        const { data: checklistData, error: checklistError } = await publicSupabase
          .from('project_checklist')
          .select('id, title, category, completed')
          .eq('company_id', shareLink.company_id);

        console.log('Checklist query result:', { checklistData, error: checklistError });

        if (!checklistError && checklistData) {
          setChecklist(checklistData);
        } else if (checklistError) {
          console.error('Checklist error:', checklistError);
        }

        // Fetch content tasks
        const { data: contentData, error: contentError } = await publicSupabase
          .from('company_content_tasks')
          .select('id, title, content, type, status, client_status')
          .eq('company_id', shareLink.company_id);

        console.log('Content tasks query result:', { contentData, error: contentError });

        if (!contentError && contentData) {
          setContentTasks(contentData);
        } else if (contentError) {
          console.error('Content tasks error:', contentError);
        }

      } catch (error) {
        console.error('Error fetching shared company data:', error);
        setError('Erro inesperado ao carregar dados da empresa');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedCompanyData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Carregando informações da empresa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Verifique se o link está correto e ainda está ativo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <p>Empresa não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedTasks = checklist.filter(item => item.completed).length;
  const totalTasks = checklist.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-600">Visualização Compartilhada</p>
            </div>
          </div>
          
          {company.description && (
            <p className="text-gray-700 mb-4">{company.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {company.contact_person && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{company.contact_person}</span>
              </div>
            )}
            {company.contact_email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{company.contact_email}</span>
              </div>
            )}
            {company.contact_phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{company.contact_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progresso do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {completionPercentage}%
                </div>
                <p className="text-gray-600 text-sm">
                  {completedTasks} de {totalTasks} tarefas concluídas
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conteúdos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {contentTasks.length}
                </div>
                <p className="text-gray-600 text-sm">Total de conteúdos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criado em</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {format(new Date(company.created_at), 'dd/MM/yyyy', { locale: pt })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checklist */}
        {checklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Checklist do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      item.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {item.completed && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.title}
                    </span>
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tasks */}
        {contentTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Conteúdos do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{task.title}</h3>
                      <div className="flex space-x-2">
                        <Badge variant="outline">
                          {task.type}
                        </Badge>
                        <Badge 
                          variant={task.client_status === 'aprovado' ? 'default' : 'secondary'}
                        >
                          {task.client_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                      {task.content}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4">
          Esta é uma visualização compartilhada. Os dados são atualizados em tempo real.
        </div>
      </div>
    </div>
  );
}
