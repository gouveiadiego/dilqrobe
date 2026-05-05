import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, Wrench, GripVertical } from "lucide-react";
import { BudgetItem } from "./types";
import { toast } from "sonner";

interface ServiceItemsFormProps {
  items: BudgetItem[];
  onItemsChange: (items: BudgetItem[]) => void;
}

export function ServiceItemsForm({ items, onItemsChange }: ServiceItemsFormProps) {
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    has_value: false,
    value: 0,
  });

  const addItem = () => {
    if (!draft.title.trim() && !draft.description.trim()) {
      toast.error('Informe ao menos um título ou descrição do serviço');
      return;
    }

    const newItem: BudgetItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title: draft.title.trim(),
      description: draft.description.trim(),
      has_value: draft.has_value,
      quantity: 1,
      unit_price: draft.has_value ? draft.value : 0,
      total: draft.has_value ? draft.value : 0,
    };

    onItemsChange([...items, newItem]);
    setDraft({ title: "", description: "", has_value: false, value: 0 });
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, patch: Partial<BudgetItem>) => {
    onItemsChange(items.map(i => {
      if (i.id !== id) return i;
      const merged = { ...i, ...patch };
      const value = merged.has_value ? Number(merged.unit_price || 0) : 0;
      return { ...merged, quantity: 1, unit_price: value, total: value };
    }));
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.has_value ? Number(i.total || 0) : 0), 0);
  const hasAnyValue = items.some(i => i.has_value);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Serviços do Orçamento</h3>
      </div>

      {/* Add new service form */}
      <div className="bg-muted/50 rounded-lg p-4 border space-y-4">
        <div className="space-y-2">
          <Label htmlFor="service_title">Título do serviço</Label>
          <Input
            id="service_title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Ex: Consultoria estratégica"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_description">Descrição detalhada</Label>
          <Textarea
            id="service_description"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Descreva o escopo, entregáveis, etapas, etc."
            rows={4}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center gap-3">
            <Switch
              id="has_value_new"
              checked={draft.has_value}
              onCheckedChange={(v) => setDraft({ ...draft, has_value: v })}
            />
            <Label htmlFor="has_value_new" className="cursor-pointer">
              Incluir valor neste serviço
            </Label>
          </div>

          {draft.has_value && (
            <div className="flex-1 space-y-2">
              <Label htmlFor="service_value">Valor (R$)</Label>
              <Input
                id="service_value"
                type="number"
                step="0.01"
                min="0"
                value={draft.value || ""}
                onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
                placeholder="0,00"
              />
            </div>
          )}

          <Button type="button" onClick={addItem} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar serviço
          </Button>
        </div>
      </div>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="border rounded-lg p-4 bg-card space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 text-muted-foreground pt-2">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-xs font-mono">#{idx + 1}</span>
                </div>
                <div className="flex-1 space-y-3">
                  <Input
                    value={item.title || ""}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                    placeholder="Título do serviço"
                    className="font-semibold"
                  />
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder="Descrição detalhada"
                    rows={3}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={!!item.has_value}
                        onCheckedChange={(v) => updateItem(item.id, { has_value: v })}
                      />
                      <span className="text-sm">Incluir valor</span>
                    </div>
                    {item.has_value && (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price || ""}
                        onChange={(e) => updateItem(item.id, { unit_price: Number(e.target.value) })}
                        placeholder="0,00"
                        className="sm:max-w-[180px]"
                      />
                    )}
                    {item.has_value && (
                      <span className="text-sm font-bold text-primary sm:ml-auto">
                        {formatCurrency(item.total || 0)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum serviço adicionado</p>
          <p className="text-sm">Adicione serviços usando o formulário acima</p>
        </div>
      )}

      {hasAnyValue && (
        <div className="flex justify-end">
          <div className="bg-primary/10 rounded-lg px-6 py-4 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
