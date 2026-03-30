import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useEcommerce } from "@/hooks/useEcommerce";
import { ProductSearchSelector } from "./ProductSearchSelector";
import { 
  ShoppingCart, 
  Plus, 
  Edit, 
  Trash2,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

const defaultForm = () => ({
  product_id: "",
  date: format(new Date(), "yyyy-MM-dd"),
  client_name: "",
  payment_method: "",
  quantity: 1,
  discount_pct: 0,
  total_amount: 0,
});

export const EcommerceSales = () => {
  const { products } = useProducts();
  const { sales, loadingSales: isLoading, addSale, updateSale, deleteSale } = useEcommerce();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm());

  useEffect(() => {
    const product = products.find(p => p.id === formData.product_id);
    if (product) {
      const baseAmount = (product.price || 0) * formData.quantity;
      const discountAmount = baseAmount * (formData.discount_pct / 100);
      setFormData(prev => ({ ...prev, total_amount: baseAmount - discountAmount }));
    } else {
      setFormData(prev => ({ ...prev, total_amount: 0 }));
    }
  }, [formData.product_id, formData.quantity, formData.discount_pct, products]);

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setFormData({
      product_id: s.product_id || "",
      date: s.date || format(new Date(), "yyyy-MM-dd"),
      client_name: s.client_name || "",
      payment_method: s.payment_method || "",
      quantity: s.quantity || 1,
      discount_pct: s.discount_pct || 0,
      total_amount: s.total_amount || 0,
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
    if (!formData.product_id || !formData.client_name) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      if (editingId) {
        await updateSale.mutateAsync({ id: editingId, ...formData } as any);
      } else {
        await addSale.mutateAsync(formData as any);
      }
      setIsOpen(false);
      setEditingId(null);
      setFormData(defaultForm());
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao ${editingId ? "atualizar" : "registrar"} venda: ${error?.message || "Erro desconhecido"}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta venda?")) return;
    try {
      await deleteSale.mutateAsync(id);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir venda.");
    }
  };

  const fmtr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const isPending = addSale.isPending || updateSale.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Registro de Vendas</h3>
          <p className="text-muted-foreground">Acompanhe as vendas da sua loja fitness.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Venda" : "Nova Venda"}</DialogTitle>
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
                  <Label>Cliente</Label>
                  <Input placeholder="Nome do cliente" value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={(val) => setFormData({...formData, payment_method: val})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input type="number" value={formData.quantity} onChange={(e) => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desconto (%)</Label>
                  <Input type="number" value={formData.discount_pct} onChange={(e) => setFormData({...formData, discount_pct: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-primary">Total Venda</Label>
                  <div className="text-xl font-bold p-2 bg-muted rounded-md border text-primary">
                    {fmtr.format(formData.total_amount)}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full gap-2" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Salvar Alterações" : "Registrar Venda"}
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
                <TableHead>Cliente</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : sales.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma venda registrada.</TableCell></TableRow>
              ) : (
                sales.map((s: any) => (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(s.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{s.products?.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {s.products?.size || "-"} / {s.products?.color || "-"} • SKU: {s.products?.sku}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.client_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-normal">{s.payment_method}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{s.quantity}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {fmtr.format(s.total_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}>
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
