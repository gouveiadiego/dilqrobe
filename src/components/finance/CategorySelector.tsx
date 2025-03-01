
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
import { CategoryType } from "@/hooks/useCategories";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  selectedFilter: string;
  categories?: { id: string; name: string; type?: CategoryType }[];
  onAddCategory?: (params: { name: string; type?: CategoryType }) => void;
}

export const CategorySelector = ({ 
  value, 
  onChange, 
  selectedFilter,
  categories: externalCategories,
  onAddCategory
}: CategorySelectorProps) => {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>(
    selectedFilter === "recebimentos" ? "income" : "expense"
  );
  
  const defaultCategories = [
    { id: "income", name: "income", type: "income" as CategoryType },
    { id: "fixed", name: "fixed", type: "expense" as CategoryType },
    { id: "variable", name: "variable", type: "expense" as CategoryType },
    { id: "people", name: "people", type: "expense" as CategoryType },
    { id: "taxes", name: "taxes", type: "expense" as CategoryType },
    { id: "transfer", name: "transfer", type: "expense" as CategoryType }
  ];
  
  // Combine default categories with external categories if provided
  const categories = externalCategories || defaultCategories;

  // Function to get readable category name
  const getCategoryLabel = (categoryValue: string): string => {
    switch (categoryValue) {
      case "income": return "Recebimento";
      case "fixed": return "Despesa Fixa";
      case "variable": return "Despesa Variável";
      case "people": return "Pessoas";
      case "taxes": return "Impostos";
      case "transfer": return "Transferência";
      default: {
        // Try to find in categories array
        const category = categories.find(c => c.name === categoryValue);
        return category ? category.name : categoryValue;
      }
    }
  };

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

  // Filter categories based on the selected filter
  const filteredCategories = categories.filter(category => {
    if (selectedFilter === "recebimentos") {
      return category.type === "income" || category.name === "income";
    } else {
      return category.type !== "income" || ["fixed", "variable", "people", "taxes", "transfer"].includes(category.name);
    }
  });

  useEffect(() => {
    // Set default category based on selected filter
    if (!value) {
      onChange(getDefaultCategory());
    }
  }, [selectedFilter]);

  // Set the default type for new categories based on selected filter
  useEffect(() => {
    setNewCategoryType(selectedFilter === "recebimentos" ? "income" : "expense");
  }, [selectedFilter]);

  const handleAddCategory = () => {
    if (!newCategory.trim() || categories.some(c => c.name === newCategory.trim())) {
      setShowAddCategory(false);
      setNewCategory("");
      return;
    }

    if (onAddCategory) {
      console.log("CategorySelector calling onAddCategory with:", { 
        name: newCategory.trim(), 
        type: newCategoryType 
      });
      
      onAddCategory({ 
        name: newCategory.trim(), 
        type: newCategoryType 
      });
      
      onChange(newCategory.trim());
    } else {
      // Fallback for when onAddCategory not provided
      console.log("No onAddCategory provided, using fallback");
      const updatedCategories = [...categories, { 
        id: newCategory.trim(), 
        name: newCategory.trim(), 
        type: newCategoryType 
      }];
      onChange(newCategory.trim());
    }
    
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
              <SelectValue placeholder="Selecione uma categoria">
                {getCategoryLabel(value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {getCategoryLabel(category.name)}
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
        <div className="space-y-3 border p-3 rounded-md bg-gray-50">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nova categoria..."
            className="flex-1 bg-white"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
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
              <RadioGroupItem value="expense" id="category-expense" />
              <Label htmlFor="category-expense">Despesa</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="income" id="category-income" />
              <Label htmlFor="category-income">Recebimento</Label>
            </div>
          </RadioGroup>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddCategory(false);
                setNewCategory("");
              }}
              className="h-9 text-red-500"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddCategory}
              className="h-9 bg-black hover:bg-black/90"
            >
              Adicionar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
