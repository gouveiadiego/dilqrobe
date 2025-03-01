
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, X } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  selectedFilter: string;
}

export const CategorySelector = ({ value, onChange, selectedFilter }: CategorySelectorProps) => {
  const [categories, setCategories] = useState<string[]>([
    "income", "fixed", "variable", "people", "taxes", "transfer"
  ]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const getDefaultCategory = () => {
    switch (selectedFilter) {
      case "recebimentos":
        return "income";
      case "despesas-fixas":
        return "fixed";
      case "despesas-variaveis":
        return "variable";
      case "pessoas":
        return "people";
      case "impostos":
        return "taxes";
      case "transferencias":
        return "transfer";
      default:
        return "income";
    }
  };

  useEffect(() => {
    // Set default category based on selected filter
    if (!value) {
      onChange(getDefaultCategory());
    }
  }, [selectedFilter]);

  const handleAddCategory = () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) {
      setShowAddCategory(false);
      setNewCategory("");
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    onChange(newCategory.trim());
    setNewCategory("");
    setShowAddCategory(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="category">Categoria</Label>
      
      {!showAddCategory ? (
        <div className="flex items-center gap-2">
          <Select
            value={value}
            onValueChange={onChange}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "income" && "Recebimento"}
                  {category === "fixed" && "Despesa Fixa"}
                  {category === "variable" && "Despesa Variável"}
                  {category === "people" && "Pessoas"}
                  {category === "taxes" && "Impostos"}
                  {category === "transfer" && "Transferência"}
                  {!["income", "fixed", "variable", "people", "taxes", "transfer"].includes(category) && category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowAddCategory(true)}
            className="h-10 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nova categoria..."
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddCategory}
            className="h-10 w-10 text-green-500"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setShowAddCategory(false);
              setNewCategory("");
            }}
            className="h-10 w-10 text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
