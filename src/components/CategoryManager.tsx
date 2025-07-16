
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle,
  Search,
  CheckCircle,
  Circle
} from "lucide-react";
import { CategoryType } from "@/hooks/useCategories";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CategoryManagerProps {
  categories: { id: string; name: string; type?: CategoryType }[];
  onAddCategory: (params: { name: string; type?: CategoryType }) => void;
  onUpdateCategory?: (params: { id: string; name?: string; type?: CategoryType }) => void;
  onDeleteCategory?: (id: string) => void;
  categoryStats?: Record<string, { total: number; completed: number }>;
}

export function CategoryManager({ 
  categories, 
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  categoryStats = {}
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    console.log("Calling onAddCategory with:", { name: newCategory.trim() });
    
    onAddCategory({ 
      name: newCategory.trim(), 
    });
    
    setNewCategory("");
    setShowAddForm(false);
  };

  const startEditing = (category: { id: string; name: string; type?: CategoryType }) => {
    setEditingCategoryId(category.id);
    setEditValue(category.name);
  };

  const handleDelete = (categoryId: string) => {
    if (onDeleteCategory) {
      onDeleteCategory(categoryId);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryProgress = (categoryName: string) => {
    const stats = categoryStats[categoryName];
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  const getCategoryColor = (progress: number) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-gray-300";
  };

  const handleEdit = (categoryId: string) => {
    if (!editValue.trim()) {
      setEditingCategoryId(null);
      return;
    }
    
    if (onUpdateCategory) {
      onUpdateCategory({ 
        id: categoryId, 
        name: editValue.trim(),
      });
    }
    setEditingCategoryId(null);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-card/50 p-6 rounded-lg border border-border/50 space-y-4 transition-all duration-200">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-2 text-base font-semibold text-foreground hover:text-primary transition-colors"
        >
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          Categorias de Tarefas
          <Badge variant="secondary" className="ml-2">
            {categories.length}
          </Badge>
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Search Bar */}
          {categories.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Add Category Button/Form */}
          {!showAddForm ? (
            <Button 
              onClick={() => setShowAddForm(true)} 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-center hover:bg-primary/10 hover:border-primary/20"
            >
              <Plus className="h-4 w-4 mr-2" /> Nova Categoria
            </Button>
          ) : (
            <div className="space-y-3 p-4 border border-border rounded-lg bg-card">
              <Input
                placeholder="Nome da categoria..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCategory("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3 mt-4">
            {filteredCategories.map((category) => {
              const stats = categoryStats[category.name];
              const progress = getCategoryProgress(category.name);
              const colorClass = getCategoryColor(progress);
              
              return (
                <div key={category.id} className="group relative p-4 rounded-lg border border-border/50 hover:border-border transition-all duration-200 bg-card/30">
                  {editingCategoryId === category.id ? (
                    <div className="space-y-3 w-full">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="focus:ring-2 focus:ring-primary/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleEdit(category.id);
                          }
                          if (e.key === 'Escape') {
                            setEditingCategoryId(null);
                          }
                        }}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCategoryId(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEdit(category.id)}
                          disabled={!editValue.trim()}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colorClass} transition-colors`} />
                          <span className="font-medium text-foreground">{category.name}</span>
                          {progress === 100 && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(category)}
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                  Excluir categoria
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a categoria "{category.name}"? 
                                  {stats && stats.total > 0 && (
                                    <span className="block mt-2 font-medium text-destructive">
                                      Esta ação afetará {stats.total} tarefa(s) existente(s).
                                    </span>
                                  )}
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(category.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Progress and Stats */}
                      {stats && stats.total > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {stats.completed} de {stats.total} tarefas concluídas
                            </span>
                            <span className="font-medium text-foreground">
                              {progress}%
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}

                      {(!stats || stats.total === 0) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Circle className="h-3 w-3" />
                          Nenhuma tarefa nesta categoria
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {categories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma categoria cadastrada</p>
                <p className="text-xs mt-1">Clique em "Nova Categoria" para começar</p>
              </div>
            )}

            {filteredCategories.length === 0 && categories.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma categoria encontrada</p>
                <p className="text-xs mt-1">Tente buscar por outro termo</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
