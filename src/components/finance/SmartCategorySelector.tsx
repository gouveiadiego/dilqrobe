import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, CreditCard, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryType, useCategories } from "@/hooks/useCategories";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SmartCategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  selectedFilter?: string;
}

export const SmartCategorySelector = ({ 
  value, 
  onChange, 
  selectedFilter 
}: SmartCategorySelectorProps) => {
  const { categories, addCategory } = useCategories();
  const [currentTab, setCurrentTab] = useState<"income" | "expense">("expense");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Detectar automaticamente o tipo baseado no filtro selecionado
  useEffect(() => {
    if (selectedFilter === "recebimentos") {
      setCurrentTab("income");
      if (!value || !categories.find(c => c.name === value && c.type === "income")) {
        const incomeCategory = categories.find(c => c.type === "income") || 
                              categories.find(c => c.name === "income");
        if (incomeCategory) {
          onChange(incomeCategory.name);
        }
      }
    } else {
      setCurrentTab("expense");
      if (!value || !categories.find(c => c.name === value && c.type !== "income")) {
        const expenseCategory = categories.find(c => c.type === "expense" || c.name === "fixed");
        if (expenseCategory) {
          onChange(expenseCategory.name);
        }
      }
    }
  }, [selectedFilter, categories]);

  // Separar categorias por tipo
  const incomeCategories = categories.filter(c => 
    c.type === "income" || c.name === "income"
  );
  
  const expenseCategories = categories.filter(c => 
    c.type === "expense" || 
    ["fixed", "variable", "people", "taxes", "transfer"].includes(c.name) ||
    (!c.type && c.name !== "income")
  );

  const getCategoryLabel = (categoryName: string): string => {
    switch (categoryName) {
      case "income": return "Recebimento Geral";
      case "fixed": return "Despesa Fixa";
      case "variable": return "Despesa Variável";
      case "people": return "Pessoas";
      case "taxes": return "Impostos";
      case "transfer": return "Transferência";
      default: return categoryName;
    }
  };

  const handleTabChange = (tab: "income" | "expense") => {
    setCurrentTab(tab);
    
    // Trocar automaticamente para uma categoria válida do novo tipo
    const targetCategories = tab === "income" ? incomeCategories : expenseCategories;
    if (targetCategories.length > 0) {
      onChange(targetCategories[0].name);
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory({ 
        name: newCategoryName.trim(), 
        type: currentTab === "income" ? "income" : "expense"
      });
      
      // Auto-selecionar a nova categoria após um delay
      setTimeout(() => {
        onChange(newCategoryName.trim());
      }, 500);
      
      setNewCategoryName("");
      setShowAddCategory(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Categoria</Label>
      
      <Tabs value={currentTab} onValueChange={(value) => handleTabChange(value as "income" | "expense")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income" className="flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
            Recebimentos
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-rose-600" />
            Despesas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-2 mt-3">
          {!showAddCategory ? (
            <div className="flex gap-2">
              <Select
                value={incomeCategories.find(c => c.name === value)?.name || ""}
                onValueChange={onChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma categoria de recebimento">
                    {value ? getCategoryLabel(value) : "Selecione uma categoria"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        {getCategoryLabel(category.name)}
                      </div>
                    </SelectItem>
                  ))}
                  {incomeCategories.length === 0 && (
                    <SelectItem value="income" disabled>
                      Nenhuma categoria de recebimento encontrada
                    </SelectItem>
                  )}
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
            <div className="space-y-3 border p-3 rounded-md bg-emerald-50">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nova categoria de recebimento..."
                className="bg-white"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategoryName("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCategory}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expense" className="space-y-2 mt-3">
          {!showAddCategory ? (
            <div className="flex gap-2">
              <Select
                value={expenseCategories.find(c => c.name === value)?.name || ""}
                onValueChange={onChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma categoria de despesa">
                    {value ? getCategoryLabel(value) : "Selecione uma categoria"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-rose-600" />
                        {getCategoryLabel(category.name)}
                      </div>
                    </SelectItem>
                  ))}
                  {expenseCategories.length === 0 && (
                    <SelectItem value="fixed" disabled>
                      Nenhuma categoria de despesa encontrada
                    </SelectItem>
                  )}
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
            <div className="space-y-3 border p-3 rounded-md bg-rose-50">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nova categoria de despesa..."
                className="bg-white"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategoryName("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCategory}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Visual feedback da categoria selecionada */}
      {value && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-md">
          <Badge 
            variant="outline"
            className={`${currentTab === "income" 
              ? "text-emerald-700 border-emerald-200 bg-emerald-50" 
              : "text-rose-700 border-rose-200 bg-rose-50"
            }`}
          >
            {currentTab === "income" ? (
              <DollarSign className="h-3 w-3 mr-1" />
            ) : (
              <CreditCard className="h-3 w-3 mr-1" />
            )}
            {getCategoryLabel(value)}
          </Badge>
        </div>
      )}
    </div>
  );
};