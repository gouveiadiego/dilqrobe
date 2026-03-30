import { useState } from "react";
import { useEcommerce } from "@/hooks/useEcommerce";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2,
  Edit,
  Mail,
  Instagram,
  Phone
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const EcommerceSuppliers = () => {
  const { suppliers, loadingSuppliers: isLoading, addSupplier, deleteSupplier } = useEcommerce();
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    whatsapp: "",
    instagram: "",
    email: "",
    discount_pct: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("O nome do fornecedor é obrigatório.");
      return;
    }

    try {
      await addSupplier.mutateAsync(formData);
      setIsOpen(false);
      setFormData({
        name: "",
        contact: "",
        whatsapp: "",
        instagram: "",
        email: "",
        discount_pct: 0
      });
    } catch (error) {
       console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Fornecedores</h3>
          <p className="text-gray-500">Gestão de contatos e parcerias com fabricantes.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#40657E] hover:bg-[#324f63] text-white shadow-lg gap-2">
              <Plus className="h-4 w-4" /> Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Novo Fornecedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome / Marca *</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Incita" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contato (Nome)</Label>
                  <Input 
                    id="contact" 
                    placeholder="Ex: João" 
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input 
                    id="whatsapp" 
                    placeholder="47 9999-9999" 
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input 
                    id="instagram" 
                    placeholder="@marca" 
                    value={formData.instagram}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="contato@marca.com.br" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto %</Label>
                  <Input 
                    id="discount" 
                    type="number" 
                    value={formData.discount_pct}
                    onChange={(e) => setFormData({...formData, discount_pct: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full bg-[#40657E] hover:bg-[#324f63]">Salvar</Button>
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
                <TableHead className="w-12 text-center text-[10px] uppercase font-bold text-gray-400">#</TableHead>
                <TableHead>Nome / Marca</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-center">Desconto %</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Nenhum fornecedor cadastrado.</TableCell></TableRow>
              ) : (
                suppliers.map((s: any, idx) => (
                  <TableRow key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="text-center text-xs text-gray-400">{idx + 1}</TableCell>
                    <TableCell className="font-bold">{s.name}</TableCell>
                    <TableCell className="text-sm">{s.contact || "-"}</TableCell>
                    <TableCell className="text-xs text-gray-500">{s.whatsapp || "-"}</TableCell>
                    <TableCell className="text-xs text-[#40657E]">
                      {s.instagram ? (
                        <div className="flex items-center gap-1"><Instagram className="h-3 w-3" /> {s.instagram}</div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {s.email ? (
                        <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center font-medium">{s.discount_pct}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteSupplier.mutate(s.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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
