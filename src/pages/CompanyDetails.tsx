
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Edit, X, Save, CheckSquare, Key, FileText, Link, Instagram } from "lucide-react";
import { toast } from "sonner";
import { CompanyCredentials } from "@/components/company-details/CompanyCredentials";
import { CompanyChecklist } from "@/components/company-details/CompanyChecklist";
import { CompanyNotes } from "@/components/company-details/CompanyNotes";
import { CompanyContentTasks } from "@/components/company-details/CompanyContentTasks";
import { CompanyWorkLog } from "@/components/company-details/CompanyWorkLog";
import { CompanyInstagramPlanner } from "@/components/company-details/CompanyInstagramPlanner";

interface Company {
  id: string;
  name: string;
  description: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export default function CompanyDetails() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Omit<Company, 'id'>>({
    name: '',
    description: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    async function fetchCompanyDetails() {
      if (!companyId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('project_companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (error) {
          throw error;
        }

        setCompany(data);
        setEditForm({
          name: data.name,
          description: data.description || '',
          contact_person: data.contact_person || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
        });
      } catch (error) {
        console.error('Erro ao carregar detalhes da empresa:', error);
        toast.error('Não foi possível carregar os detalhes da empresa');
      } finally {
        setLoading(false);
      }
    }

    fetchCompanyDetails();
  }, [companyId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSaveCompanyDetails = async () => {
    if (!companyId || !company) return;

    try {
      const { error } = await supabase
        .from('project_companies')
        .update({
          name: editForm.name,
          description: editForm.description,
          contact_person: editForm.contact_person,
          contact_email: editForm.contact_email,
          contact_phone: editForm.contact_phone,
        })
        .eq('id', companyId);

      if (error) throw error;

      setCompany({
        ...company,
        name: editForm.name,
        description: editForm.description,
        contact_person: editForm.contact_person,
        contact_email: editForm.contact_email,
        contact_phone: editForm.contact_phone,
      });

      setIsEditing(false);
      toast.success('Informações da empresa atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar informações da empresa:', error);
      toast.error('Erro ao atualizar informações da empresa');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <p>Carregando detalhes da empresa...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <p>Empresa não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{company?.name}</h1>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Informações da Empresa */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Informações da Empresa</CardTitle>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p>{company.name}</p>
                </div>
                {company.description && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500">Descrição</p>
                    <p>{company.description}</p>
                  </div>
                )}
                {company.contact_person && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500">Pessoa de Contato</p>
                    <p>{company.contact_person}</p>
                  </div>
                )}
                {company.contact_email && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500">Email de Contato</p>
                    <p>{company.contact_email}</p>
                  </div>
                )}
                {company.contact_phone && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500">Telefone de Contato</p>
                    <p>{company.contact_phone}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    placeholder="Nome da Empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={editForm.description || ''}
                    onChange={handleInputChange}
                    placeholder="Descrição da empresa ou projeto"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Pessoa de Contato</Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={editForm.contact_person || ''}
                    onChange={handleInputChange}
                    placeholder="Nome da pessoa de contato"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email de Contato</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={editForm.contact_email || ''}
                    onChange={handleInputChange}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Telefone de Contato</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={editForm.contact_phone || ''}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <Button className="w-full" onClick={handleSaveCompanyDetails}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seções Organizadas em Accordion */}
        <Accordion type="multiple" defaultValue={["checklist"]} className="w-full">
          <AccordionItem value="checklist">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center">
                <CheckSquare className="mr-2 h-5 w-5" />
                Checklist do Projeto
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CompanyChecklist companyId={company.id} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="worklog">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Diário de Bordo
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CompanyWorkLog companyId={company.id} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="content">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Conteúdos
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CompanyContentTasks companyId={company.id} companyName={company.name} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="credentials">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center">
                <Key className="mr-2 h-5 w-5" />
                Credenciais
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CompanyCredentials companyId={company.id} companyName={company.name} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="instagram">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center">
                <Instagram className="mr-2 h-5 w-5" />
                Planejamento Instagram
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CompanyInstagramPlanner companyId={company.id} companyName={company.name} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notes">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center">
                <Link className="mr-2 h-5 w-5" />
                Anotações
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CompanyNotes companyId={company.id} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
