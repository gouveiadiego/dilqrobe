import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Gift } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";

interface Props {
  bonifications: any[];
  products: any[];
  loading: boolean;
  onAdd: (b: any) => void;
  onDelete: (id: string) => void;
}

export function BonificationsManager({ bonifications, products, loading, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    product_id: "", bonification_date: new Date().toISOString().split("T")[0],
    client_name: "", contact_handle: "", quantity: 1,
    gift_value: 0, sales_generated: 0, campaign_reason: "", notes: "",
  });

  const getProduct = (id: string) => products.find(p => p.id === id);

  const handleSubmit = () => {
    if (!form.product_id) return;
    const product = getProduct(form.product_id);
    onAdd({
      ...form,
      unit_cost: product?.cost_price || 0,
      gift_value: form.gift_value || product?.sale_price || 0,
    });
    setForm({
      product_id: "", bonification_date: new Date().toISOString().split("T")[0],
      client_name: "", contact_handle: "", quantity: 1,
      gift_value: 0, sales_generated: 0, campaign_reason: "", notes: "",
    });
    setOpen(false);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (loading) return <LoadingSpinner text="Carregando bonificações..." />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Bonificações — Divulgação / Influencers
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Bonificação</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Produto *</Label>
                <Select value={form.product_id} onValueChange={v => {
                  const p = getProduct(v);
                  setForm({ ...form, product_id: v, gift_value: p?.sale_price || 0 });
                }}>
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
                <Input type="date" value={form.bonification_date} onChange={e => setForm({ ...form, bonification_date: e.target.value })} />
              </div>
              <div>
                <Label>Cliente / Influencer</Label>
                <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
              </div>
              <div>
                <Label>Contato / @</Label>
                <Input value={form.contact_handle} onChange={e => setForm({ ...form, contact_handle: e.target.value })} />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Valor Bonif. (R$)</Label>
                <Input type="number" value={form.gift_value} onChange={e => setForm({ ...form, gift_value: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Vendas Geradas (R$)</Label>
                <Input type="number" value={form.sales_generated} onChange={e => setForm({ ...form, sales_generated: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <Label>Motivo / Campanha</Label>
                <Input value={form.campaign_reason} onChange={e => setForm({ ...form, campaign_reason: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full mt-2">Registrar</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {bonifications.length === 0 ? (
          <EmptyState title="Nenhuma bonificação" description="Registre peças enviadas para influencers." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Valor Bonif.</TableHead>
                  <TableHead className="text-right">Vendas Geradas</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonifications.map((b, i) => {
                  const product = getProduct(b.product_id);
                  const totalCost = (b.unit_cost || 0) * (b.quantity || 1);
                  const roi = totalCost > 0 ? ((b.sales_generated || 0) / totalCost * 100) : 0;
                  return (
                    <TableRow key={b.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{new Date(b.bonification_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{b.client_name}</TableCell>
                      <TableCell>{b.contact_handle}</TableCell>
                      <TableCell>{product ? `${product.name}` : "—"}</TableCell>
                      <TableCell className="text-center">{b.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(b.gift_value || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(b.sales_generated || 0)}</TableCell>
                      <TableCell className={`text-right font-bold ${roi >= 100 ? "text-green-600" : "text-red-600"}`}>{roi.toFixed(0)}%</TableCell>
                      <TableCell>{b.campaign_reason}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
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
