import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, Package } from "lucide-react";
import { BudgetItem } from "./types";
import { toast } from "sonner";

interface BudgetItemsFormProps {
  items: BudgetItem[];
  onItemsChange: (items: BudgetItem[]) => void;
}

export function BudgetItemsForm({ items, onItemsChange }: BudgetItemsFormProps) {
  const [currentItem, setCurrentItem] = useState({
    description: "",
    quantity: 1,
    unit_price: 0
  });

  const addItem = () => {
    if (!currentItem.description.trim()) {
      toast.error('Descrição do item é obrigatória');
      return;
    }

    if (currentItem.unit_price <= 0) {
      toast.error('O preço deve ser maior que zero');
      return;
    }

    const newItem: BudgetItem = {
      id: Date.now().toString(),
      description: currentItem.description,
      quantity: currentItem.quantity,
      unit_price: currentItem.unit_price,
      total: currentItem.quantity * currentItem.unit_price
    };

    onItemsChange([...items, newItem]);

    setCurrentItem({
      description: "",
      quantity: 1,
      unit_price: 0
    });
  };

  const removeItem = (itemId: string) => {
    onItemsChange(items.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId: string, field: keyof BudgetItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = Number(updated.quantity) * Number(updated.unit_price);
        }
        return updated;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Itens do Orçamento</h3>
      </div>

      {/* Add new item form */}
      <div className="bg-muted/50 rounded-lg p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5 space-y-2">
            <Label htmlFor="item_description">Descrição do Item/Serviço</Label>
            <Input
              id="item_description"
              value={currentItem.description}
              onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
              placeholder="Ex: Desenvolvimento de website"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="item_quantity">Quantidade</Label>
            <Input
              id="item_quantity"
              type="number"
              min="1"
              value={currentItem.quantity}
              onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="item_price">Preço Unitário (R$)</Label>
            <Input
              id="item_price"
              type="number"
              step="0.01"
              min="0"
              value={currentItem.unit_price || ""}
              onChange={(e) => setCurrentItem({ ...currentItem, unit_price: Number(e.target.value) })}
              placeholder="0,00"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="button" onClick={addItem} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Items table */}
      {items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40%]">Descrição</TableHead>
                <TableHead className="text-center w-[15%]">Qtd</TableHead>
                <TableHead className="text-right w-[20%]">Preço Unit.</TableHead>
                <TableHead className="text-right w-[20%]">Total</TableHead>
                <TableHead className="w-[5%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="border-0 bg-transparent p-0 h-auto text-center focus-visible:ring-0 w-16 mx-auto"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(item.total)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Total */}
      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-primary/10 rounded-lg px-6 py-4 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum item adicionado</p>
          <p className="text-sm">Adicione itens usando o formulário acima</p>
        </div>
      )}
    </div>
  );
}
