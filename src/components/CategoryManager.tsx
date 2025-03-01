
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { CategoryType } from "@/hooks/useCategories";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CategoryManagerProps {
  categories: { id: string; name: string; type?: CategoryType }[];
  onAddCategory: (params: { name: string; type?: CategoryType }) => void;
  onUpdateCategory?: (params: { id: string; name?: string; type?: CategoryType }) => void;
  onDeleteCategory?: (id: string) => void;
}

export function CategoryManager({ 
  categories, 
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>("expense");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editType, setEditType] = useState<CategoryType>("expense");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    onAddCategory({ name: newCategory.trim(), type: newCategoryType });
    setNewCategory("");
    setNewCategoryType("expense");
    setShowAddForm(false);
  };

  const startEditing = (category: { id: string; name: string; type?: CategoryType }) => {
    setEditingCategoryId(category.id);
    setEditValue(category.name);
    setEditType(category.type || "expense");
  };

  const handleDelete = (categoryId: string) => {
    if (onDeleteCategory) {
      onDeleteCategory(categoryId);
    }
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
        type: editType 
      });
    }
    setEditingCategoryId(null);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getCategoryTypeLabel = (type?: CategoryType): string => {
    switch (type) {
      case "income": return "Recebimento";
      case "expense": return "Despesa";
      default: return "Despesa";
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Categorias ({categories.length})
        </button>
      </div>

      {isExpanded && (
        <>
          {!showAddForm ? (
            <Button 
              onClick={() => setShowAddForm(true)} 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" /> Nova Categoria
            </Button>
          ) : (
            <div className="space-y-3 p-3 border border-gray-100 rounded-md bg-gray-50">
              <Input
                placeholder="Nome da categoria..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />

              <RadioGroup 
                value={newCategoryType} 
                onValueChange={(value) => setNewCategoryType(value as CategoryType)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="new-expense" />
                  <Label htmlFor="new-expense">Despesa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="new-income" />
                  <Label htmlFor="new-income">Recebimento</Label>
                </div>
              </RadioGroup>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddCategory}
                  className="bg-black hover:bg-black/90"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 mt-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                {editingCategoryId === category.id ? (
                  <div className="space-y-3 w-full">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-white border-gray-200 mb-2"
                      autoFocus
                    />
                    
                    <RadioGroup 
                      value={editType} 
                      onValueChange={(value) => setEditType(value as CategoryType)}
                      className="flex space-x-4 mb-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expense" id="edit-expense" />
                        <Label htmlFor="edit-expense">Despesa</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="income" id="edit-income" />
                        <Label htmlFor="edit-income">Recebimento</Label>
                      </div>
                    </RadioGroup>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCategoryId(null)}
                        className="h-8 text-gray-500 hover:text-gray-600"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEdit(category.id)}
                        className="h-8 bg-black hover:bg-black/90"
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700 mr-2">{category.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        category.type === 'income' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getCategoryTypeLabel(category.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(category)}
                        className="h-8 w-8 text-blue-500 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-3 text-gray-500 text-sm">
                Nenhuma categoria cadastrada
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
