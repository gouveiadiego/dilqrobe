
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

interface CategoryManagerProps {
  categories: { id: string; name: string }[];
  onAddCategory: (category: string) => void;
}

export function CategoryManager({ categories, onAddCategory }: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    onAddCategory(newCategory.trim());
    setNewCategory("");
  };

  const startEditing = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditValue(categoryName);
  };

  const handleDelete = (categoryId: string) => {
    // Aqui você pode implementar a lógica de exclusão usando o Supabase
    toast.error("Função de exclusão ainda não implementada");
  };

  const handleEdit = (categoryId: string) => {
    if (!editValue.trim() || editValue === editingCategory) {
      setEditingCategory(null);
      return;
    }
    // Aqui você pode implementar a lógica de edição usando o Supabase
    toast.error("Função de edição ainda não implementada");
    setEditingCategory(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-4">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Nova categoria..."
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleAddCategory}
          className="h-8 w-8 text-purple-400 hover:text-purple-300"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
            {editingCategory === category.name ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-white border-gray-200"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(category.id)}
                  className="h-8 w-8 text-green-500 hover:text-green-600"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingCategory(null)}
                  className="h-8 w-8 text-gray-500 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm text-gray-700">{category.name}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(category.name)}
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
      </div>
    </div>
  );
}
