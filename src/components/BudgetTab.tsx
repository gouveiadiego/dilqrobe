import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, FileText, Copy, Trash2 } from "lucide-react";
import { useBudgets } from "@/hooks/useBudgets";
import { BudgetStats } from "./budget/BudgetStats";
import { BudgetForm } from "./budget/BudgetForm";
import { BudgetList } from "./budget/BudgetList";
import { BudgetPreviewDialog } from "./budget/BudgetPreviewDialog";
import { generateBudgetPDF } from "./budget/generateBudgetPDF";
import { Budget, NewBudget, EMPTY_BUDGET } from "./budget/types";
import { formatCurrency } from "@/lib/utils";
import { LoadingSpinner } from "./ui/loading-spinner";

export function BudgetTab() {
  const { 
    budgets, 
    isLoading, 
    stats, 
    createBudget, 
    deleteBudget, 
    duplicateBudget 
  } = useBudgets();

  const [showForm, setShowForm] = useState(false);
  const [previewBudget, setPreviewBudget] = useState<Budget | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [budgetToDuplicate, setBudgetToDuplicate] = useState<Budget | null>(null);

  const handleSubmit = async (data: Omit<NewBudget, 'user_id'>) => {
    const result = await createBudget(data);
    if (result) {
      setShowForm(false);
    }
  };

  const handleView = (budget: Budget) => {
    setPreviewBudget(budget);
    setShowPreview(true);
  };

  const handleDeleteClick = (budget: Budget) => {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (budgetToDelete) {
      await deleteBudget(budgetToDelete.id);
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    }
  };

  const handleDuplicateClick = (budget: Budget) => {
    setBudgetToDuplicate(budget);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateConfirm = async () => {
    if (budgetToDuplicate) {
      await duplicateBudget(budgetToDuplicate);
      setDuplicateDialogOpen(false);
      setBudgetToDuplicate(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Carregando orçamentos..." className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Orçamentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie orçamentos profissionais para seus clientes
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Novo Orçamento
          </Button>
        )}
      </div>

      {/* Stats */}
      {!showForm && <BudgetStats stats={stats} />}

      {/* Form or List */}
      {showForm ? (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Criar Novo Orçamento
          </h2>
          <BudgetForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Orçamentos Criados
          </h2>
          <BudgetList
            budgets={budgets}
            isLoading={isLoading}
            onView={handleView}
            onDuplicate={handleDuplicateClick}
            onDelete={handleDeleteClick}
            onDownloadPDF={generateBudgetPDF}
          />
        </div>
      )}

      {/* Preview Dialog */}
      <BudgetPreviewDialog
        budget={previewBudget}
        open={showPreview}
        onOpenChange={setShowPreview}
        onDownloadPDF={generateBudgetPDF}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {budgetToDelete && (
            <div className="py-4 space-y-2">
              <p><strong>Cliente:</strong> {budgetToDelete.client_name}</p>
              <p><strong>Valor:</strong> {formatCurrency(budgetToDelete.total_amount)}</p>
              <p><strong>Itens:</strong> {budgetToDelete.items.length}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-primary" />
              Duplicar Orçamento
            </DialogTitle>
            <DialogDescription>
              Uma cópia deste orçamento será criada com os mesmos dados, permitindo que você edite apenas os itens necessários.
            </DialogDescription>
          </DialogHeader>
          {budgetToDuplicate && (
            <div className="py-4 space-y-2">
              <p><strong>Cliente:</strong> {budgetToDuplicate.client_name}</p>
              <p><strong>Valor:</strong> {formatCurrency(budgetToDuplicate.total_amount)}</p>
              <p><strong>Itens:</strong> {budgetToDuplicate.items.length}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDuplicateConfirm}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
