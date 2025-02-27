
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckSquare, Key, Link, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CompanyCredentials } from "@/components/company-details/CompanyCredentials";
import { CompanyChecklist } from "@/components/company-details/CompanyChecklist";
import { CompanyNotes } from "@/components/company-details/CompanyNotes";

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
  const [activeTab, setActiveTab] = useState<'checklist' | 'credentials' | 'notes'>('checklist');

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
        <h1 className="text-2xl font-bold">{company.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex space-x-4 border-b pb-3">
              <button 
                className={`py-2 px-4 font-medium ${activeTab === 'checklist' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('checklist')}
              >
                <CheckSquare className="inline mr-2 h-4 w-4" />
                Checklist
              </button>
              <button 
                className={`py-2 px-4 font-medium ${activeTab === 'credentials' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('credentials')}
              >
                <Key className="inline mr-2 h-4 w-4" />
                Credenciais
              </button>
              <button 
                className={`py-2 px-4 font-medium ${activeTab === 'notes' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('notes')}
              >
                <Link className="inline mr-2 h-4 w-4" />
                Anotações
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'checklist' && <CompanyChecklist companyId={company.id} />}
            {activeTab === 'credentials' && <CompanyCredentials companyId={company.id} companyName={company.name} />}
            {activeTab === 'notes' && <CompanyNotes companyId={company.id} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
