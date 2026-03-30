import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Package, AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";

interface Props {
  products: any[];
  suppliers: any[];
  loading: boolean;
  onAdd: (p: any) => void;
  onUpdate: (p: any) => void;
  onDelete: (id: string) => void;
}

const categories = ["Macaquinho", "Top", "Legging", "Short", "Conjunto", "Outro"];
const sizes = ["PP", "P", "M", "G", "GG", "XG"];

const emptyForm = {
  code: "", name: "", category: "", size: "", color: "",
  supplier_id: "", cost_price: 0, sale_price: 0, qty_in: 0, notes: "",
};

export function InventoryManager({ products, suppliers, loading, onAdd, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchFilter, setSearchFilter] = useState("");

  const handleSubmit = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    const payload = { ...form, supplier_id: form.supplier_id || null };
    if (editing) {
      onUpdate({ id: editing.id, ...payload });
    } else {
      onAdd(payload);
    }
    setForm(emptyForm);
    setEditing(null);
    setOpen(false);
  };

  const handleEdit = (p: any) => {
    setEditing(p);
    setForm({
      code: p.code || "", name: p.name || "", category: p.category || "",
      size: p.size || "", color: p.color || "", supplier_id: p.supplier_id || "",
      cost_price: p.cost_price || 0, sale_price: p.sale_price || 0,
      qty_in: p.qty_in || 0, notes: p.notes || "",
    });
    setOpen(true);
  };

  const getBalance = (p: any) => (p.qty_in || 0) - (p.qty_sold || 0) - (p.qty_gifted || 0);
  const getMargin = (p: any) => {
    if (!p.sale_price || p.sale_price === 0) return 0;
    return (((p.sale_price - p.cost_price) / p.sale_price) * 100);
  };
  const getStatus = (p: any) => {
    const bal = getBalance(p);
    if (bal <= 0) return "Esgotado";
    if (bal <= 2) return "Crítico";
    return "Disponível";
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.code.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (loading) return <LoadingSpinner text="Carregando estoque..." />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Gestão de Estoque
        </CardTitle>
        <div className="flex gap-2 items-center">
          <Input placeholder="Buscar produto..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="w-48" />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Código *</Label>
                  <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="FIT001" />
                </div>
                <div>
                  <Label>Produto *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tamanho</Label>
                  <Select value={form.size} onValueChange={v => setForm({ ...form, size: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Custo (R$)</Label>
                  <Input type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Preço Venda (R$)</Label>
                  <Input type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Qtd Entrada</Label>
                  <Input type="number" value={form.qty_in} onChange={e => setForm({ ...form, qty_in: Number(e.target.value) })} />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full mt-2">{editing ? "Salvar" : "Adicionar"}</Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState title="Nenhum produto" description="Cadastre seus produtos para controlar o estoque." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Cat.</TableHead>
                  <TableHead>Tam.</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-center">Entrada</TableHead>
                  <TableHead className="text-center">Vendida</TableHead>
                  <TableHead className="text-center">Bonif.</TableHead>
                  <TableHead className="text-center">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => {
                  const balance = getBalance(p);
                  const margin = getMargin(p);
                  const status = getStatus(p);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>{p.size}</TableCell>
                      <TableCell>{p.color}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.cost_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.sale_price)}</TableCell>
                      <TableCell className="text-right">{margin.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">{p.qty_in}</TableCell>
                      <TableCell className="text-center">{p.qty_sold}</TableCell>
                      <TableCell className="text-center">{p.qty_gifted}</TableCell>
                      <TableCell className="text-center font-bold">{balance}</TableCell>
                      <TableCell>
                        <Badge variant={status === "Disponível" ? "default" : status === "Crítico" ? "secondary" : "destructive"}>
                          {status === "Crítico" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
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
