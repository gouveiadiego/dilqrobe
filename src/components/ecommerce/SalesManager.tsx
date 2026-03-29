import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";

interface Props {
  sales: any[];
  products: any[];
  loading: boolean;
  onAdd: (s: any) => void;
  onDelete: (id: string) => void;
}

const paymentMethods = ["Pix", "Cartão Crédito", "Cartão Débito", "Dinheiro", "Boleto", "Transferência"];

export function SalesManager({ sales, products, loading, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    product_id: "", sale_date: new Date().toISOString().split("T")[0],
    client_name: "", payment_method: "", quantity: 1,
    discount_percent: 0, notes: "",
  });

  const getProduct = (id: string) => products.find(p => p.id === id);

  const handleSubmit = () => {
    if (!form.product_id) return;
    const product = getProduct(form.product_id);
    const unitCost = product?.cost_price || 0;
    const unitPrice = product?.sale_price || 0;
    const discountAmount = (unitPrice * form.quantity * form.discount_percent) / 100;
    onAdd({
      ...form,
      unit_cost: unitCost,
      unit_price: unitPrice,
      discount_amount: discountAmount,
    });
    setForm({
      product_id: "", sale_date: new Date().toISOString().split("T")[0],
      client_name: "", payment_method: "", quantity: 1,
      discount_percent: 0, notes: "",
    });
    setOpen(false);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (loading) return <LoadingSpinner text="Carregando vendas..." />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Registro de Vendas
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Venda</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Venda</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Produto *</Label>
                <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.code} - {p.name} ({p.size}/{p.color})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.sale_date} onChange={e => setForm({ ...form, sale_date: e.target.value })} />
              </div>
              <div>
                <Label>Cliente</Label>
                <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Desconto (%)</Label>
                <Input type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} />
              </div>
              {form.product_id && (() => {
                const p = getProduct(form.product_id);
                if (!p) return null;
                const total = p.sale_price * form.quantity;
                const disc = total * form.discount_percent / 100;
                const net = total - disc;
                const costTotal = p.cost_price * form.quantity;
                const profit = net - costTotal;
                return (
                  <div className="col-span-2 bg-muted p-3 rounded-lg text-sm space-y-1">
                    <p>Preço Unit.: {formatCurrency(p.sale_price)} | Custo Unit.: {formatCurrency(p.cost_price)}</p>
                    <p>Total Bruto: {formatCurrency(total)} | Desconto: {formatCurrency(disc)}</p>
                    <p className="font-bold">Total Líquido: {formatCurrency(net)} | Lucro: <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(profit)}</span></p>
                  </div>
                );
              })()}
            </div>
            <Button onClick={handleSubmit} className="w-full mt-2">Registrar Venda</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <EmptyState title="Nenhuma venda" description="Registre suas vendas para acompanhar o desempenho." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pgto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Desc.</TableHead>
                  <TableHead className="text-right">Total Líq.</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s, i) => {
                  const total = (s.unit_price || 0) * (s.quantity || 1);
                  const disc = s.discount_amount || 0;
                  const net = total - disc;
                  const costTotal = (s.unit_cost || 0) * (s.quantity || 1);
                  const profit = net - costTotal;
                  const margin = net > 0 ? (profit / net) * 100 : 0;
                  const product = getProduct(s.product_id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{new Date(s.sale_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{product ? `${product.code} - ${product.name}` : "—"}</TableCell>
                      <TableCell>{s.client_name}</TableCell>
                      <TableCell>{s.payment_method}</TableCell>
                      <TableCell className="text-center">{s.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(disc)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(net)}</TableCell>
                      <TableCell className={`text-right font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(profit)}</TableCell>
                      <TableCell className="text-right">{margin.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
