
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Trash2, PlusCircle, FileText, Copy, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Budget {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_document: string;
  client_address: string;
  company_name: string;
  company_document: string;
  company_address: string;
  company_phone: string;
  company_logo: string;
  items: BudgetItem[];
  total_amount: number;
  notes: string;
  delivery_time: string;
  payment_terms: string;
  valid_until: string;
  created_at: string;
  user_id: string;
}

interface NewBudget {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_document: string;
  client_address: string;
  company_name: string;
  company_document: string;
  company_address: string;
  company_phone: string;
  company_logo: string;
  items: BudgetItem[];
  total_amount: number;
  notes: string;
  delivery_time: string;
  payment_terms: string;
  valid_until: string;
  user_id: string;
}

export function BudgetTab() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [budgetToDuplicate, setBudgetToDuplicate] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState<Omit<NewBudget, 'user_id'>>({
    client_name: "",
    client_email: "",
    client_phone: "",
    client_document: "",
    client_address: "",
    company_name: "",
    company_document: "",
    company_address: "",
    company_phone: "",
    company_logo: "",
    items: [],
    total_amount: 0,
    notes: "",
    delivery_time: "",
    payment_terms: "",
    valid_until: ""
  });
  const [currentItem, setCurrentItem] = useState({
    description: "",
    quantity: 1,
    unit_price: 0
  });

  const fetchBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar orçamentos');
        throw error;
      }

      // Convert Json items to BudgetItem[]
      const budgets = data?.map(budget => ({
        ...budget,
        items: Array.isArray(budget.items) ? budget.items as unknown as BudgetItem[] : []
      })) || [];

      setBudgets(budgets);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const addItem = () => {
    if (!currentItem.description.trim()) {
      toast.error('Descrição do item é obrigatória');
      return;
    }

    const newItem: BudgetItem = {
      id: Date.now().toString(),
      description: currentItem.description,
      quantity: currentItem.quantity,
      unit_price: currentItem.unit_price,
      total: currentItem.quantity * currentItem.unit_price
    };

    const updatedItems = [...newBudget.items, newItem];
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);

    setNewBudget({
      ...newBudget,
      items: updatedItems,
      total_amount: totalAmount
    });

    setCurrentItem({
      description: "",
      quantity: 1,
      unit_price: 0
    });
  };

  const removeItem = (itemId: string) => {
    const updatedItems = newBudget.items.filter(item => item.id !== itemId);
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);

    setNewBudget({
      ...newBudget,
      items: updatedItems,
      total_amount: totalAmount
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (newBudget.items.length === 0) {
        toast.error('Adicione pelo menos um item ao orçamento');
        return;
      }

      const budgetToAdd: NewBudget = {
        ...newBudget,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          ...budgetToAdd,
          items: budgetToAdd.items as unknown as any
        }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar orçamento');
        throw error;
      }

      const createdBudget = {
        ...data,
        items: Array.isArray(data.items) ? data.items as unknown as BudgetItem[] : []
      };

      setBudgets([createdBudget, ...budgets]);
      setNewBudget({
        client_name: "",
        client_email: "",
        client_phone: "",
        client_document: "",
        client_address: "",
        company_name: "",
        company_document: "",
        company_address: "",
        company_phone: "",
        company_logo: "",
        items: [],
        total_amount: 0,
        notes: "",
        delivery_time: "",
        payment_terms: "",
        valid_until: ""
      });
      
      toast.success('Orçamento criado com sucesso');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!budgetToDelete) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetToDelete);

      if (error) {
        toast.error('Erro ao deletar orçamento');
        throw error;
      }

      setBudgets(budgets.filter(budget => budget.id !== budgetToDelete));
      setBudgetToDelete(null);
      setShowDeleteDialog(false);
      toast.success('Orçamento removido com sucesso');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDuplicate = async () => {
    if (!budgetToDuplicate) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Create a copy of the budget with new items (new IDs)
      const duplicatedItems = budgetToDuplicate.items.map(item => ({
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }));

      const duplicatedBudget: NewBudget = {
        client_name: budgetToDuplicate.client_name,
        client_email: budgetToDuplicate.client_email,
        client_phone: budgetToDuplicate.client_phone,
        client_document: budgetToDuplicate.client_document,
        client_address: budgetToDuplicate.client_address,
        company_name: budgetToDuplicate.company_name,
        company_document: budgetToDuplicate.company_document,
        company_address: budgetToDuplicate.company_address,
        company_phone: budgetToDuplicate.company_phone,
        company_logo: budgetToDuplicate.company_logo,
        items: duplicatedItems,
        total_amount: budgetToDuplicate.total_amount,
        notes: budgetToDuplicate.notes,
        delivery_time: budgetToDuplicate.delivery_time,
        payment_terms: budgetToDuplicate.payment_terms,
        valid_until: budgetToDuplicate.valid_until,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          ...duplicatedBudget,
          items: duplicatedBudget.items as unknown as any
        }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao duplicar orçamento');
        throw error;
      }

      const duplicatedBudgetResult = {
        ...data,
        items: Array.isArray(data.items) ? data.items as unknown as BudgetItem[] : []
      };

      setBudgets([duplicatedBudgetResult, ...budgets]);
      setBudgetToDuplicate(null);
      setShowDuplicateDialog(false);
      toast.success('Orçamento duplicado com sucesso');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openDuplicateDialog = (budget: Budget) => {
    setBudgetToDuplicate(budget);
    setShowDuplicateDialog(true);
  };

  const generateProfessionalPDF = (budget: Budget) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Colors
      const primaryColor = [79, 70, 229]; // Indigo
      const secondaryColor = [100, 116, 139]; // Slate
      const accentColor = [236, 254, 255]; // Light cyan
      
      // Header with gradient effect
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Company title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ORÇAMENTO PROFISSIONAL', pageWidth / 2, 22, { align: 'center' });
      
      // Subtle accent line
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 35, pageWidth, 2, 'F');
      
      // Budget number and date
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const budgetNumber = `#${budget.id.substring(0, 8).toUpperCase()}`;
      const createdDate = format(new Date(budget.created_at), "dd/MM/yyyy", { locale: ptBR });
      doc.text(`Orçamento: ${budgetNumber}`, 20, 45);
      doc.text(`Data: ${createdDate}`, pageWidth - 20, 45, { align: 'right' });
      
      let yPosition = 60;
      
      // Company Information Section
      if (budget.company_name) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, yPosition - 5, pageWidth - 40, 25, 'F');
        
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('EMPRESA', 25, yPosition + 5);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(budget.company_name, 25, yPosition + 15);
        yPosition += 35;
      }
      
      // Client Information Section
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPosition - 5, pageWidth - 40, 35, 'F');
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENTE', 25, yPosition + 5);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(budget.client_name, 25, yPosition + 15);
      if (budget.client_email) {
        doc.text(`Email: ${budget.client_email}`, 25, yPosition + 22);
      }
      if (budget.client_phone) {
        doc.text(`Telefone: ${budget.client_phone}`, 25, yPosition + 29);
      }
      
      yPosition += 50;
      
      // Items Table Header
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ITENS DO ORÇAMENTO', 25, yPosition);
      yPosition += 15;
      
      // Prepare table data
      const tableData = budget.items.map(item => [
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unit_price),
        formatCurrency(item.total)
      ]);
      
      // Create table with professional styling
      (doc as any).autoTable({
        startY: yPosition,
        head: [['Descrição', 'Qtd', 'Valor Unit.', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [51, 51, 51]
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: 25, right: 25 }
      });
      
      // Get table end position
      const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
      
      // Total amount with elegant styling
      const totalBoxY = finalY + 10;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(pageWidth - 80, totalBoxY, 55, 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL GERAL', pageWidth - 52.5, totalBoxY + 8, { align: 'center' });
      doc.setFontSize(14);
      doc.text(formatCurrency(budget.total_amount), pageWidth - 52.5, totalBoxY + 17, { align: 'center' });
      
      let infoY = totalBoxY + 35;
      
      // Additional Information
      if (budget.delivery_time || budget.payment_terms || budget.valid_until) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, infoY - 5, pageWidth - 40, 30, 'F');
        
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CONDIÇÕES', 25, infoY + 5);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        let conditionY = infoY + 12;
        
        if (budget.delivery_time) {
          doc.text(`Prazo de Entrega: ${budget.delivery_time}`, 25, conditionY);
          conditionY += 6;
        }
        
        if (budget.payment_terms) {
          doc.text(`Condições de Pagamento: ${budget.payment_terms}`, 25, conditionY);
          conditionY += 6;
        }
        
        if (budget.valid_until) {
          const validDate = format(new Date(budget.valid_until), "dd/MM/yyyy", { locale: ptBR });
          doc.text(`Válido até: ${validDate}`, 25, conditionY);
        }
        
        infoY += 40;
      }
      
      // Notes section
      if (budget.notes) {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVAÇÕES', 25, infoY);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const noteLines = doc.splitTextToSize(budget.notes, pageWidth - 50);
        doc.text(noteLines, 25, infoY + 8);
        infoY += noteLines.length * 4 + 15;
      }
      
      // Professional footer
      const footerY = pageHeight - 30;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, footerY, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Orçamento gerado automaticamente', pageWidth / 2, footerY + 10, { align: 'center' });
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, footerY + 18, { align: 'center' });
      
      // Save the PDF
      const fileName = `orcamento-${budget.client_name.replace(/\s+/g, '-').toLowerCase()}-${budgetNumber}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Orçamentos</h1>
      </div>

      {/* Form for new budget */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-indigo-600" />
          Novo Orçamento
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Nome do Cliente</Label>
              <Input
                id="client_name"
                value={newBudget.client_name}
                onChange={(e) => setNewBudget({ ...newBudget, client_name: e.target.value })}
                className="glass-card"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_email">Email do Cliente</Label>
              <Input
                id="client_email"
                type="email"
                value={newBudget.client_email}
                onChange={(e) => setNewBudget({ ...newBudget, client_email: e.target.value })}
                className="glass-card"
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={newBudget.company_name}
                onChange={(e) => setNewBudget({ ...newBudget, company_name: e.target.value })}
                className="glass-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Válido até</Label>
              <Input
                id="valid_until"
                type="date"
                value={newBudget.valid_until}
                onChange={(e) => setNewBudget({ ...newBudget, valid_until: e.target.value })}
                className="glass-card"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Itens do Orçamento</h3>
            
            {/* Add new item */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="item_description">Descrição</Label>
                <Input
                  id="item_description"
                  value={currentItem.description}
                  onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                  className="glass-card"
                  placeholder="Descrição do item"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item_quantity">Quantidade</Label>
                <Input
                  id="item_quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                  className="glass-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item_price">Preço Unitário</Label>
                <Input
                  id="item_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentItem.unit_price}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit_price: Number(e.target.value) })}
                  className="glass-card"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addItem} className="w-full">
                  Adicionar Item
                </Button>
              </div>
            </div>

            {/* Items list */}
            {newBudget.items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newBudget.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {newBudget.total_amount > 0 && (
              <div className="text-right text-xl font-bold">
                Total: {formatCurrency(newBudget.total_amount)}
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_time">Prazo de Entrega</Label>
              <Input
                id="delivery_time"
                value={newBudget.delivery_time}
                onChange={(e) => setNewBudget({ ...newBudget, delivery_time: e.target.value })}
                className="glass-card"
                placeholder="Ex: 15 dias úteis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Condições de Pagamento</Label>
              <Input
                id="payment_terms"
                value={newBudget.payment_terms}
                onChange={(e) => setNewBudget({ ...newBudget, payment_terms: e.target.value })}
                className="glass-card"
                placeholder="Ex: 50% antecipado, 50% na entrega"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={newBudget.notes}
              onChange={(e) => setNewBudget({ ...newBudget, notes: e.target.value })}
              className="glass-card"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button">Cancelar</Button>
            <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
              Criar Orçamento
            </Button>
          </div>
        </form>
      </div>

      {/* Budgets List */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" />
          Orçamentos Criados
        </h2>

        <div className="space-y-4">
          {budgets.map((budget) => (
            <div key={budget.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{budget.client_name}</h3>
                  <p className="text-gray-600">{budget.client_email}</p>
                  <p className="text-sm text-gray-500">
                    Criado em {format(new Date(budget.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(budget.total_amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {budget.items.length} {budget.items.length === 1 ? 'item' : 'itens'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateProfessionalPDF(budget)}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                >
                  <Download className="h-4 w-4" />
                  PDF Profissional
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDuplicateDialog(budget)}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingBudget(budget)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBudgetToDelete(budget.id);
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {budgets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum orçamento criado ainda.
          </div>
        )}
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicar Orçamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja duplicar este orçamento? Uma cópia será criada com os mesmos dados, 
              permitindo que você edite apenas os itens necessários.
            </DialogDescription>
          </DialogHeader>
          {budgetToDuplicate && (
            <div className="py-4">
              <p><strong>Cliente:</strong> {budgetToDuplicate.client_name}</p>
              <p><strong>Valor Total:</strong> {formatCurrency(budgetToDuplicate.total_amount)}</p>
              <p><strong>Itens:</strong> {budgetToDuplicate.items.length}</p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowDuplicateDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
