import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useEcommerce } from "@/hooks/useEcommerce";
import { ProductSearchSelector } from "./ProductSearchSelector";
import { 
  Gift, 
  Plus, 
  Search, 
  Trash2,
  Calendar,
  User as UserIcon,
  Instagram,
  BarChart2,
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

export const EcommerceBonuses = () => {
  const { products } = useProducts();
  const { bonuses, isLoading, addBonus } = useEcommerce();
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    influencer_name: "",
    influencer_handle: "",
    quantity: 1,
    bonus_value: 0,
    generated_sales: 0,
    reason: ""
  });

  // Reactive calculation of bonus_value based on product price
  useEffect(() => {
    const product = products.find(p => p.id === formData.product_id);
    if (product && formData.bonus_value === 0) {
      setFormData(prev => ({ ...prev, bonus_value: (product.price || 0) * formData.quantity }));
    }
  }, [formData.product_id, formData.quantity, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.influencer_name) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await addBonus.mutateAsync(formData as any);
      setIsOpen(false);
      setFormData({
        product_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        influencer_name: "",
        influencer_handle: "",
        quantity: 1,
        bonus_value: 0,
        generated_sales: 0,
        reason: ""
      });
    } catch (error) {
       console.error(error);
       toast.error("Erro ao registrar bonificação.");
    }
  };

  const fmtr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Bonificações & Parcerias</h3>
          <p className="text-gray-500">Controle de brindes enviados e retorno gerado.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#40657E] hover:bg-[#324f63] text-white shadow-lg gap-2">
              <Plus className="h-4 w-4" /> Nova Bonificação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Nova Bonificação</DialogTitle>
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
                  <Label htmlFor="influencer">Cliente / Influencer</Label>
                  <Input 
                    id="influencer" 
                    placeholder="Nome" 
                    value={formData.influencer_name}
                    onChange={(e) => setFormData({...formData, influencer_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="handle">Contato / @</Label>
                  <Input 
                    id="handle" 
                    placeholder="@perfil" 
                    value={formData.influencer_handle}
                    onChange={(e) => setFormData({...formData, influencer_handle: e.target.value})}
                  />
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
                  <Label htmlFor="bonus_val">Valor Bonif. (R$)</Label>
                  <Input 
                    id="bonus_val" 
                    type="number" 
                    value={formData.bonus_value}
                    onChange={(e) => setFormData({...formData, bonus_value: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gen_sales">Vendas Geradas (R$)</Label>
                  <Input 
                    id="gen_sales" 
                    type="number" 
                    value={formData.generated_sales}
                    onChange={(e) => setFormData({...formData, generated_sales: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo / Campanha</Label>
                <Input 
                  id="reason" 
                  placeholder="Ex: Campanha Verão" 
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-[#40657E] hover:bg-[#324f63] gap-2"
                  disabled={addBonus.isPending}
                >
                  {addBonus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Registrar Bonificação
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
                <TableHead>Influencer</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Vendas Geradas</TableHead>
                <TableHead>Campanha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : bonuses.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Nenhuma bonificação encontrada.</TableCell></TableRow>
              ) : (
                bonuses.map((b: any) => (
                  <TableRow key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="text-xs text-gray-500">{format(new Date(b.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{b.products?.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {b.products?.size || "-"} / {b.products?.color || "-"} • SKU: {b.products?.sku}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{b.influencer_name}</div>
                      <div className="text-[10px] text-[#40657E] flex items-center gap-1">
                        <Instagram className="h-2 w-2" /> {b.influencer_handle}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{b.quantity}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {fmtr.format(b.generated_sales || 0)}
                    </TableCell>
                    <TableCell className="text-xs italic text-gray-500">{b.reason || "-"}</TableCell>
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
