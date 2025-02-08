
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CategoryManagerProps {
  categories: { id: string; name: string }[];
  onAddCategory: (category: string) => void;
}

export function CategoryManager({ categories, onAddCategory }: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    onAddCategory(newCategory.trim());
    setNewCategory("");
  };

  return (
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
  );
}
