
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Mail, Phone, Calendar, Shield, CheckSquare, ChevronDown, ChevronRight, Clock, FileText, Briefcase, TrendingUp, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

interface WorkLogEntry {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  completed_at: string;
  checklist_item_id: string | null;
}

export default function SharedCompany() {
  const { token } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [contentTasks, setContentTasks] = useState<ContentTask[]>([]);
  const [workLogEntries, setWorkLogEntries] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
          
          // Initialize all categories as expanded
          const categories = [...new Set(checklistData.map(item => item.category || "geral"))];
          const expanded: Record<string, boolean> = {};
          categories.forEach(cat => {
            expanded[cat] = true;
          });
          setExpandedCategories(expanded);
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

        // Fetch work log entries
        const { data: workLogData, error: workLogError } = await publicSupabase
          .from('company_work_log')
          .select('id, title, description, category, completed_at, checklist_item_id')
          .eq('company_id', shareLink.company_id)
          .order('completed_at', { ascending: false });

        console.log('Work log query result:', { workLogData, error: workLogError });

        if (!workLogError && workLogData) {
          setWorkLogEntries(workLogData);
        } else if (workLogError) {
          console.error('Work log error:', workLogError);
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

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'design': return { icon: '🎨', color: 'bg-pink-100 text-pink-800', bgColor: '#fdf2f8', chartColor: '#ec4899' };
      case 'desenvolvimento': return { icon: '💻', color: 'bg-blue-100 text-blue-800', bgColor: '#eff6ff', chartColor: '#3b82f6' };
      case 'conteúdo': return { icon: '📝', color: 'bg-green-100 text-green-800', bgColor: '#f0fdf4', chartColor: '#22c55e' };
      case 'seo': return { icon: '🔍', color: 'bg-purple-100 text-purple-800', bgColor: '#faf5ff', chartColor: '#a855f7' };
      case 'reunião': return { icon: '🤝', color: 'bg-orange-100 text-orange-800', bgColor: '#fff7ed', chartColor: '#f97316' };
      case 'planejamento': return { icon: '📋', color: 'bg-indigo-100 text-indigo-800', bgColor: '#eef2ff', chartColor: '#6366f1' };
      default: return { icon: '📌', color: 'bg-gray-100 text-gray-800', bgColor: '#f9fafb', chartColor: '#6b7280' };
    }
  };

  const getCategoryDisplayName = (category: string | null) => {
    switch (category) {
      case 'design': return 'Design';
      case 'desenvolvimento': return 'Desenvolvimento';
      case 'conteúdo': return 'Conteúdo';
      case 'seo': return 'SEO';
      case 'reunião': return 'Reunião';
      case 'planejamento': return 'Planejamento';
      default: return 'Geral';
    }
  };

  // Prepare chart data
  const getCategoryChartData = () => {
    const categoryCount: Record<string, number> = {};
    workLogEntries.forEach(entry => {
      const category = entry.category || 'geral';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([category, count]) => ({
      category: getCategoryDisplayName(category),
      count,
      fill: getCategoryIcon(category).chartColor
    }));
  };

  // Prepare timeline data by month
  const getTimelineData = () => {
    const monthlyData: Record<string, number> = {};
    workLogEntries.forEach(entry => {
      const month = format(new Date(entry.completed_at), 'MM/yyyy');
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

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

  // Group checklist items by category
  const groupedItems = checklist.reduce((acc: Record<string, ChecklistItem[]>, item) => {
    const category = item.category || "geral";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Group work log entries by date for timeline
  const groupedByDate = workLogEntries.reduce((acc: Record<string, WorkLogEntry[]>, entry) => {
    const date = format(new Date(entry.completed_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const chartData = getCategoryChartData();
  const timelineChartData = getTimelineData();

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <CardTitle className="text-lg">Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {workLogEntries.length}
                </div>
                <p className="text-gray-600 text-sm">Total realizadas</p>
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

        {/* Organized sections using Accordion */}
        <Accordion type="multiple" defaultValue={["checklist"]} className="w-full">
          {/* Checklist Section */}
          {checklist.length > 0 && (
            <AccordionItem value="checklist">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center">
                  <CheckSquare className="mr-2 h-5 w-5" />
                  Checklist do Projeto ({completedTasks}/{totalTasks})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {Object.keys(groupedItems).sort().map((category) => (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleCategoryExpansion(category)}
                      >
                        <h4 className="font-medium text-gray-700 flex items-center">
                          {expandedCategories[category] ? 
                            <ChevronDown className="h-4 w-4 mr-2" /> : 
                            <ChevronRight className="h-4 w-4 mr-2" />
                          }
                          {category.charAt(0).toUpperCase() + category.slice(1)} ({groupedItems[category].length})
                        </h4>
                        <div className="text-xs text-gray-500">
                          {groupedItems[category].filter(item => item.completed).length} de {groupedItems[category].length} completos
                        </div>
                      </div>
                      
                      {expandedCategories[category] && (
                        <div className="space-y-2 p-3 bg-white">
                          {groupedItems[category].map((item) => (
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
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Enhanced Work Log Timeline Section */}
          {workLogEntries.length > 0 && (
            <AccordionItem value="worklog">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Linha do Tempo do Projeto ({workLogEntries.length} atividades)
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-8">
                  {/* Analytics Dashboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity Distribution Chart */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                          Distribuição por Categoria
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            count: {
                              label: "Atividades",
                            },
                          }}
                          className="h-[200px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                dataKey="count"
                                label={(entry) => `${entry.category}: ${entry.count}`}
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Timeline Chart */}
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                          Atividades por Mês
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            count: {
                              label: "Atividades",
                              color: "#22c55e",
                            },
                          }}
                          className="h-[200px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timelineChartData}>
                              <XAxis dataKey="month" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Interactive Timeline */}
                  <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-green-500"></div>
                    
                    <div className="space-y-8">
                      {sortedDates.map((date, dateIndex) => {
                        const dayEntries = groupedByDate[date];
                        const totalEntriesForDay = dayEntries.length;
                        
                        return (
                          <div key={date} className="relative">
                            {/* Timeline marker */}
                            <div className="absolute left-6 w-4 h-4 bg-white border-4 border-purple-500 rounded-full shadow-lg z-10"></div>
                            
                            {/* Date header */}
                            <div className="ml-16 mb-4">
                              <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold">
                                <Calendar className="h-4 w-4 mr-2" />
                                {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                                <Badge className="ml-2 bg-purple-600 text-white">
                                  {totalEntriesForDay} {totalEntriesForDay === 1 ? 'atividade' : 'atividades'}
                                </Badge>
                              </div>
                            </div>

                            {/* Activities for this date */}
                            <div className="ml-16 space-y-4">
                              {dayEntries.map((entry, entryIndex) => {
                                const categoryInfo = getCategoryIcon(entry.category);
                                
                                return (
                                  <Card 
                                    key={entry.id} 
                                    className="hover:shadow-lg transition-all duration-300 border-l-4 hover:scale-[1.02]"
                                    style={{ borderLeftColor: categoryInfo.chartColor }}
                                  >
                                    <CardContent className="p-6">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                          <div 
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm`}
                                            style={{ backgroundColor: categoryInfo.bgColor }}
                                          >
                                            {categoryInfo.icon}
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-gray-900 text-lg">{entry.title}</h4>
                                            <div className="flex items-center space-x-3 mt-1">
                                              <Badge variant="secondary" className={categoryInfo.color}>
                                                {getCategoryDisplayName(entry.category)}
                                              </Badge>
                                              <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {format(new Date(entry.completed_at), "HH:mm", { locale: pt })}
                                              </div>
                                              {entry.checklist_item_id && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                  <CheckSquare className="h-3 w-3 mr-1" />
                                                  Checklist
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {entry.description && (
                                        <div className="bg-gray-50 rounded-lg p-4 mt-4 border-l-2" style={{ borderLeftColor: categoryInfo.chartColor }}>
                                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.description}</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Content Tasks Section */}
          {contentTasks.length > 0 && (
            <AccordionItem value="content">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Conteúdos do Projeto ({contentTasks.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4">
          Esta é uma visualização compartilhada. Os dados são atualizados em tempo real.
        </div>
      </div>
    </div>
  );
}
