import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, Truck } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";

interface Props {
  suppliers: any[];
  loading: boolean;
  onAdd: (s: any) => void;
  onUpdate: (s: any) => void;
  onDelete: (id: string) => void;
}

const emptyForm = {
  name: "", contact_person: "", whatsapp: "", instagram: "",
  email: "", website: "", delivery_time: "", payment_method: "",
  discount_percent: 0, notes: "",
};

export function SuppliersManager({ suppliers, loading, onAdd, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editing) {
      onUpdate({ id: editing.id, ...form });
    } else {
      onAdd(form);
    }
    setForm(emptyForm);
    setEditing(null);
    setOpen(false);
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name || "", contact_person: s.contact_person || "",
      whatsapp: s.whatsapp || "", instagram: s.instagram || "",
      email: s.email || "", website: s.website || "",
      delivery_time: s.delivery_time || "", payment_method: s.payment_method || "",
      discount_percent: s.discount_percent || 0, notes: s.notes || "",
    });
    setOpen(true);
  };

  if (loading) return <LoadingSpinner text="Carregando fornecedores..." />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Fornecedores
        </CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nome / Marca *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Contato</Label>
                <Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Site / Catálogo</Label>
                <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
              </div>
              <div>
                <Label>Prazo Entrega</Label>
                <Input value={form.delivery_time} onChange={e => setForm({ ...form, delivery_time: e.target.value })} />
              </div>
              <div>
                <Label>Forma Pgto</Label>
                <Input value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} />
              </div>
              <div>
                <Label>Desconto %</Label>
                <Input type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full mt-2">{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {suppliers.length === 0 ? (
          <EmptyState title="Nenhum fornecedor" description="Cadastre seus fornecedores para gerenciar suas compras." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nome / Marca</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Desconto %</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.contact_person}</TableCell>
                    <TableCell>{s.whatsapp}</TableCell>
                    <TableCell>{s.instagram}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.discount_percent}%</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
