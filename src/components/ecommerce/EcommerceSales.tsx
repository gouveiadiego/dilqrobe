import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useEcommerce } from "@/hooks/useEcommerce";
import { ProductSearchSelector } from "./ProductSearchSelector";
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  Calendar,
  User as UserIcon,
  DollarSign,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ptBR } from "date-fns/locale";

export const EcommerceSales = () => {
  const { products } = useProducts();
  const { sales, isLoading, addSale } = useEcommerce();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    client_name: "",
    payment_method: "",
    quantity: 1,
    discount_pct: 0,
    total_amount: 0
  });

  // Reactive calculation of total_amount
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.client_name) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await addSale.mutateAsync(formData as any);
      setIsOpen(false);
      setFormData({
        product_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        client_name: "",
        payment_method: "",
        quantity: 1,
        discount_pct: 0,
        total_amount: 0
      });
    } catch (error: any) {
       console.error(error);
       const detailedError = error?.message || error?.details || "Erro desconhecido";
       toast.error(`Erro ao registrar venda: ${detailedError}`);
    }
  };

  const fmtr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Registro de Vendas</h3>
          <p className="text-gray-500">Acompanhe as vendas da sua loja fitness.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#40657E] hover:bg-[#324f63] text-white shadow-lg gap-2">
              <Plus className="h-4 w-4" /> Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Nova Venda</DialogTitle>
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
                  <Label htmlFor="date">Data</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Input 
                    id="client" 
                    placeholder="Nome do cliente" 
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select onValueChange={(val) => setFormData({...formData, payment_method: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantidade</Label>
                  <Input 
                    id="qty" 
                    type="number" 
                    value={formData.quantity}
                    onChange={(e) => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto (%)</Label>
                  <Input 
                    id="discount" 
                    type="number" 
                    value={formData.discount_pct}
                    onChange={(e) => setFormData({...formData, discount_pct: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#40657E] font-bold">Total Venda</Label>
                  <div className="text-xl font-bold p-2 bg-gray-50 rounded-md border text-[#40657E]">
                    {fmtr.format(formData.total_amount)}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-[#40657E] hover:bg-[#324f63] gap-2"
                  disabled={addSale.isPending}
                >
                  {addSale.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Registrar Venda
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card shadow-lg border-none overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : sales.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Nenhuma venda registrada.</TableCell></TableRow>
              ) : (
                sales.map((s: any) => (
                  <TableRow key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="text-xs text-gray-500">{format(new Date(s.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{s.products?.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {s.products?.size || "-"} / {s.products?.color || "-"} • SKU: {s.products?.sku}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.client_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-normal">{s.payment_method}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{s.quantity}</TableCell>
                    <TableCell className="text-right font-bold text-[#40657E]">
                      {fmtr.format(s.total_amount)}
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
