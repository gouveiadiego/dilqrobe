import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useEcommerce } from "@/hooks/useEcommerce";
import { ProductSearchSelector } from "./ProductSearchSelector";
import { 
  Gift, 
  Plus, 
  Edit,
  Trash2,
  Instagram,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

const defaultForm = () => ({
  product_id: "",
  date: format(new Date(), "yyyy-MM-dd"),
  influencer_name: "",
  influencer_handle: "",
  quantity: 1,
  bonus_value: 0,
  generated_sales: 0,
  reason: "",
});

export const EcommerceBonuses = () => {
  const { products } = useProducts();
  const { bonuses, loadingBonuses: isLoading, addBonus, updateBonus, deleteBonus } = useEcommerce();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm());

  useEffect(() => {
    const product = products.find(p => p.id === formData.product_id);
    if (product && formData.bonus_value === 0) {
      setFormData(prev => ({ ...prev, bonus_value: (product.price || 0) * formData.quantity }));
    }
  }, [formData.product_id, formData.quantity, products]);

  const openEdit = (b: any) => {
    setEditingId(b.id);
    setFormData({
      product_id: b.product_id || "",
      date: b.date || format(new Date(), "yyyy-MM-dd"),
      influencer_name: b.influencer_name || "",
      influencer_handle: b.influencer_handle || "",
      quantity: b.quantity || 1,
      bonus_value: b.bonus_value || 0,
      generated_sales: b.generated_sales || 0,
      reason: b.reason || "",
    });
    setIsOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setFormData(defaultForm());
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.influencer_name) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      if (editingId) {
        await updateBonus.mutateAsync({ id: editingId, ...formData } as any);
      } else {
        await addBonus.mutateAsync(formData as any);
      }
      setIsOpen(false);
      setEditingId(null);
      setFormData(defaultForm());
    } catch (error) {
      console.error(error);
      toast.error(`Erro ao ${editingId ? "atualizar" : "registrar"} bonificação.`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta bonificação?")) return;
    try {
      await deleteBonus.mutateAsync(id);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir bonificação.");
    }
  };

  const fmtr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const isPending = addBonus.isPending || updateBonus.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Bonificações & Parcerias</h3>
          <p className="text-muted-foreground">Controle de brindes enviados e retorno gerado.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Bonificação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Bonificação" : "Nova Bonificação"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Produto *</Label>
                <ProductSearchSelector 
                  products={products}
                  value={formData.product_id}
                  onValueChange={(val) => setFormData(p => ({ ...p, product_id: val }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Cliente / Influencer *</Label>
                  <Input placeholder="Nome" value={formData.influencer_name} onChange={(e) => setFormData({...formData, influencer_name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contato / @</Label>
                  <Input placeholder="@perfil" value={formData.influencer_handle} onChange={(e) => setFormData({...formData, influencer_handle: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input type="number" value={formData.quantity} onChange={(e) => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Bonif. (R$)</Label>
                  <Input type="number" value={formData.bonus_value} onChange={(e) => setFormData({...formData, bonus_value: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Vendas Geradas (R$)</Label>
                  <Input type="number" value={formData.generated_sales} onChange={(e) => setFormData({...formData, generated_sales: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo / Campanha</Label>
                <Input placeholder="Ex: Campanha Verão" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full gap-2" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Salvar Alterações" : "Registrar Bonificação"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Influencer</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Vendas Geradas</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead className="text-center w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : bonuses.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma bonificação encontrada.</TableCell></TableRow>
              ) : (
                bonuses.map((b: any) => (
                  <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(b.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{b.products?.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {b.products?.size || "-"} / {b.products?.color || "-"} • SKU: {b.products?.sku}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{b.influencer_name}</div>
                      <div className="text-[10px] text-primary flex items-center gap-1">
                        <Instagram className="h-2 w-2" /> {b.influencer_handle}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{b.quantity}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {fmtr.format(b.generated_sales || 0)}
                    </TableCell>
                    <TableCell className="text-xs italic text-muted-foreground">{b.reason || "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(b)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
