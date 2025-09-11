import { useState } from "react";
import { useCategories, CategoryType } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  DollarSign, 
  CreditCard,
  Filter,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinanceCategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinanceCategoryManager = ({ open, onOpenChange }: FinanceCategoryManagerProps) => {
  const { categories, isLoading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>("expense");

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "all") return matchesSearch;
    if (filter === "income") return matchesSearch && category.type === "income";
    if (filter === "expense") return matchesSearch && (category.type === "expense" || !category.type);
    return matchesSearch;
  });

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory({ 
        name: newCategoryName.trim(), 
        type: newCategoryType 
      });
      setNewCategoryName("");
      setIsAddDialogOpen(false);
    }
  };

  const handleEditCategory = () => {
    if (selectedCategory && newCategoryName.trim()) {
      updateCategory({
        id: selectedCategory.id,
        name: newCategoryName.trim(),
        type: newCategoryType
      });
      setNewCategoryName("");
      setSelectedCategory(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteCategory = () => {
    if (selectedCategory) {
      deleteCategory(selectedCategory.id);
      setSelectedCategory(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (category: any) => {
    setSelectedCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryType(category.type || "expense");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: any) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const getCategoryTypeIcon = (type?: CategoryType) => {
    if (type === "income") {
      return <DollarSign className="h-4 w-4 text-emerald-600" />;
    }
    return <CreditCard className="h-4 w-4 text-rose-600" />;
  };

  const getCategoryTypeBadge = (type?: CategoryType) => {
    if (type === "income") {
      return <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">Recebimento</Badge>;
    }
    return <Badge variant="outline" className="text-rose-700 border-rose-200 bg-rose-50">Despesa</Badge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Gerenciar Categorias Financeiras
            </DialogTitle>
            <DialogDescription>
              Gerencie suas categorias de recebimentos e despesas para melhor organização das transações.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar categorias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filter} onValueChange={(value: "all" | "income" | "expense") => setFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="income">Recebimentos</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>

            {/* Categories Grid */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando categorias...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Nenhuma categoria encontrada" : "Nenhuma categoria criada"}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => (
                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getCategoryTypeIcon(category.type)}
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditDialog(category)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-rose-600 hover:text-rose-700"
                              onClick={() => openDeleteDialog(category)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {getCategoryTypeBadge(category.type)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar suas transações financeiras.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nome da Categoria</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Digite o nome da categoria"
                autoFocus
              />
            </div>
            
            <div>
              <Label>Tipo</Label>
              <RadioGroup 
                value={newCategoryType} 
                onValueChange={(value) => setNewCategoryType(value as CategoryType)}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="type-expense" />
                  <Label htmlFor="type-expense" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-rose-600" />
                    Despesa
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="type-income" />
                  <Label htmlFor="type-income" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Recebimento
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCategory} 
              disabled={!newCategoryName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Modifique o nome e tipo da categoria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Nome da Categoria</Label>
              <Input
                id="edit-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Digite o nome da categoria"
                autoFocus
              />
            </div>
            
            <div>
              <Label>Tipo</Label>
              <RadioGroup 
                value={newCategoryType} 
                onValueChange={(value) => setNewCategoryType(value as CategoryType)}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="edit-type-expense" />
                  <Label htmlFor="edit-type-expense" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-rose-600" />
                    Despesa
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="edit-type-income" />
                  <Label htmlFor="edit-type-income" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Recebimento
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditCategory} 
              disabled={!newCategoryName.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{selectedCategory?.name}"? 
              Esta ação não pode ser desfeita e pode afetar transações existentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};