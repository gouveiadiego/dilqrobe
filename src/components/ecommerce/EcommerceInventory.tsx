import { useState, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useEcommerce } from "@/hooks/useEcommerce";
import { 
  Package, 
  Plus, 
  Search, 
  Trash2,
  Pencil,
  FileDown,
  FileUp,
  Download,
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
import { downloadTemplate, exportToExcel, parseExcelFile } from "@/utils/excelUtils";

export const EcommerceInventory = () => {
  const { products, isLoading, addProduct, updateProduct, deleteProduct, bulkUpsert } = useProducts();
  const { suppliers } = useEcommerce();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    size: "",
    color: "",
    supplier_id: "",
    cost_price: 0,
    price: 0,
    stock_quantity: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      toast.error("Preencha os campos obrigatórios (*)");
      return;
    }

    try {
      const submissionData = {
        ...formData,
        supplier_id: formData.supplier_id || null
      };

      if (isEditing && editingId) {
        await updateProduct.mutateAsync({ id: editingId, updates: submissionData as any });
      } else {
        await addProduct.mutateAsync(submissionData as any);
      }
      
      handleClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      sku: "",
      name: "",
      category: "",
      size: "",
      color: "",
      supplier_id: "",
      cost_price: 0,
      price: 0,
      stock_quantity: 0
    });
  };

  const handleEdit = (p: any) => {
    setFormData({
      sku: p.sku || "",
      name: p.name || "",
      category: p.category || "",
      size: p.size || "",
      color: p.color || "",
      supplier_id: p.supplier_id || "",
      cost_price: p.cost_price || 0,
      price: p.price || 0,
      stock_quantity: p.stock_quantity || 0
    });
    setEditingId(p.id);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await parseExcelFile(file);
      await bulkUpsert.mutateAsync(data);
    } catch (error: any) {
      console.error("Import error detail:", error);
      const errorMessage = error?.message || "Erro de formato ou dados inválidos.";
      toast.error(`Erro ao importar: ${errorMessage}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fmtr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Gestão de Estoque</h3>
          <p className="text-gray-500">Controle suas peças fitness por tamanho e cor.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Buscar SKU ou Produto..." 
              className="pl-9 bg-white/50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-dashed border-gray-300 hover:bg-gray-50"
                onClick={downloadTemplate}
            >
                <Download className="h-4 w-4" /> Modelo
            </Button>

            <Button 
                variant="outline" 
                size="sm" 
                className="gap-2" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
            >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                Importar
            </Button>

            <Button 
                variant="outline" 
                size="sm" 
                className="gap-2" 
                onClick={() => exportToExcel(products)}
            >
                <FileDown className="h-4 w-4" /> Exportar
            </Button>

            <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept=".xlsx, .xls" 
                onChange={handleImport} 
            />

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                <Button className="bg-[#40657E] hover:bg-[#324f63] text-white shadow-lg gap-2">
                    <Plus className="h-4 w-4" /> Novo
                </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="sku">Código *</Label>
                        <Input 
                        id="sku" 
                        placeholder="FIT001" 
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Produto *</Label>
                        <Input 
                        id="name" 
                        placeholder="Ex: Legging Cirrê" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(val) => setFormData({...formData, category: val})}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Legging">Legging</SelectItem>
                            <SelectItem value="Top">Top</SelectItem>
                            <SelectItem value="Short">Short</SelectItem>
                            <SelectItem value="Conjunto">Conjunto</SelectItem>
                            <SelectItem value="Body">Body</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Tamanho</Label>
                        <Select 
                          value={formData.size} 
                          onValueChange={(val) => setFormData({...formData, size: val})}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="P">P</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="G">G</SelectItem>
                            <SelectItem value="GG">GG</SelectItem>
                            <SelectItem value="Único">Único</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="color">Cor</Label>
                        <Input 
                        id="color" 
                        placeholder="Ex: Preto" 
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Fornecedor</Label>
                        <Select 
                          value={formData.supplier_id} 
                          onValueChange={(val) => setFormData({...formData, supplier_id: val})}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name || "Sem Nome"}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="cost">Custo (R$)</Label>
                        <Input 
                        id="cost" 
                        type="number" 
                        step="0.01" 
                        value={formData.cost_price}
                        onChange={(e) => setFormData({...formData, cost_price: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Preço Venda (R$)</Label>
                        <Input 
                        id="price" 
                        type="number" 
                        step="0.01" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                        />
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="qty">Qtd Entrada</Label>
                    <Input 
                        id="qty" 
                        type="number" 
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
                    />
                    </div>

                    <DialogFooter>
                    <Button type="submit" className="w-full bg-[#40657E] hover:bg-[#324f63]">
                      {isEditing ? "Salvar Alterações" : "Adicionar"}
                    </Button>
                    </DialogFooter>
                </form>
                </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Card className="glass-card shadow-lg border-none">
        <CardContent className="p-0 overflow-hidden rounded-xl">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-12 text-center text-[10px] uppercase font-bold text-gray-400">#</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Nenhum produto em estoque.</TableCell></TableRow>
              ) : (
                filteredProducts.map((p, idx) => (
                  <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="text-center text-xs text-gray-400">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[10px] text-gray-400">{(p as any).category} • {(p as any).size || "-"} / {(p as any).color || "-"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{p.sku}</TableCell>
                    <TableCell className="text-gray-500 text-xs">{fmtr.format(p.cost_price || 0)}</TableCell>
                    <TableCell className="font-bold text-[#40657E] text-xs">{fmtr.format(p.price)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-100">
                        {fmtr.format(p.price - (p.cost_price || 0))}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{p.stock_quantity}</TableCell>
                    <TableCell>
                      {p.stock_quantity <= 0 ? (
                        <Badge variant="destructive" className="text-[10px]">Esgotado</Badge>
                      ) : p.stock_quantity < 5 ? (
                        <Badge variant="outline" className="text-[10px] border-orange-500 text-orange-600">Baixo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">Disp.</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(p)}>
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteProduct.mutate(p.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
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
