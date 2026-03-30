import { useState } from "react";
import { 
  Package, 
  ShoppingCart, 
  Gift, 
  Users, 
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  TrendingDown,
  BarChart3,
  BarChart2,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProducts } from "@/hooks/useProducts";
import { useEcommerce } from "@/hooks/useEcommerce";
import { EcommerceInventory } from "./ecommerce/EcommerceInventory";
import { EcommerceSales } from "./ecommerce/EcommerceSales";
import { EcommerceBonuses } from "./ecommerce/EcommerceBonuses";
import { EcommerceSuppliers } from "./ecommerce/EcommerceSuppliers";
import { useMemo } from "react";

export const EcommerceTab = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#40657E] to-dilq-teal bg-clip-text text-transparent">
          Ecommerce
        </h2>
        <div className="h-1 flex-grow bg-gradient-to-r from-[#40657E]/30 to-dilq-teal/30 rounded-full" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/70 border border-gray-100 shadow-sm p-1 h-auto flex flex-wrap gap-1 rounded-xl">
          <TabsTrigger value="dashboard" className="gap-2 py-2 px-4 border-none data-[state=active]:bg-[#40657E]/10 data-[state=active]:text-[#40657E] transition-all rounded-lg">
            <LayoutDashboard className="h-4 w-4" /> Painel
          </TabsTrigger>
          <TabsTrigger value="estoque" className="gap-2 py-2 px-4 border-none data-[state=active]:bg-[#40657E]/10 data-[state=active]:text-[#40657E] transition-all rounded-lg">
            <Package className="h-4 w-4" /> Estoque
          </TabsTrigger>
          <TabsTrigger value="vendas" className="gap-2 py-2 px-4 border-none data-[state=active]:bg-[#40657E]/10 data-[state=active]:text-[#40657E] transition-all rounded-lg">
            <ShoppingCart className="h-4 w-4" /> Vendas
          </TabsTrigger>
          <TabsTrigger value="bonificacoes" className="gap-2 py-2 px-4 border-none data-[state=active]:bg-[#40657E]/10 data-[state=active]:text-[#40657E] transition-all rounded-lg">
            <Gift className="h-4 w-4" /> Bonificações
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="gap-2 py-2 px-4 border-none data-[state=active]:bg-[#40657E]/10 data-[state=active]:text-[#40657E] transition-all rounded-lg">
            <Users className="h-4 w-4" /> Fornecedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <EcommerceDashboard />
        </TabsContent>

        <TabsContent value="estoque">
          <EcommerceInventory />
        </TabsContent>

        <TabsContent value="vendas">
          <EcommerceSales />
        </TabsContent>

        <TabsContent value="bonificacoes">
          <EcommerceBonuses />
        </TabsContent>

        <TabsContent value="fornecedores">
          <EcommerceSuppliers />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EcommerceDashboard = () => {
  const { products } = useProducts();
  const { sales, bonuses } = useEcommerce();
  
  const stats = useMemo(() => {
    const totalSalesQuantity = sales.reduce((acc: number, s: any) => acc + s.quantity, 0);
    const totalSalesValue = sales.reduce((acc: number, s: any) => acc + s.total_amount, 0);
    const totalBonusesQuantity = bonuses.reduce((acc: number, b: any) => acc + b.quantity, 0);
    const totalBonusesValue = bonuses.reduce((acc: number, b: any) => acc + b.bonus_value, 0);
    const totalStock = products.reduce((acc, p) => acc + p.stock_quantity, 0);
    const ticketMedio = sales.length > 0 ? totalSalesValue / sales.length : 0;
    
    // Margem bruta = Receita - Custo
    // Since we don't have cost in sales easily without a join, we can mock or estimate if needed.
    // For now based on screenshot UI, we keep the label and will sum cost later.
    const totalCost = 0; 
    
    return { 
      totalSalesValue, 
      totalSalesQuantity,
      totalBonusesValue, 
      totalBonusesQuantity,
      totalStock, 
      ticketMedio,
      totalCost
    };
  }, [sales, bonuses, products]);

  const fmtr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  // 8 Metrics Cards as per screenshot
  const metrics = [
    { label: "Receita Bruta", value: fmtr.format(stats.totalSalesValue), color: "text-blue-500", icon: DollarSign },
    { label: "Receita Líquida", value: fmtr.format(stats.totalSalesValue), color: "text-green-500", icon: TrendingUp },
    { label: "Margem Bruta", value: fmtr.format(stats.totalSalesValue - stats.totalCost), color: "text-green-500", icon: TrendingUp },
    { label: "Itens Vendidos", value: stats.totalSalesQuantity.toString(), color: "text-purple-500", icon: ShoppingCart },
    { label: "Itens Bonificados", value: stats.totalBonusesQuantity.toString(), color: "text-orange-500", icon: Gift },
    { label: "Estoque Total", value: stats.totalStock.toString(), color: "text-teal-500", icon: Package },
    { label: "Ticket Médio", value: fmtr.format(stats.ticketMedio), color: "text-purple-600", icon: BarChart2 },
    { label: "Invest. Bonificações", value: fmtr.format(stats.totalBonusesValue), color: "text-red-500", icon: Gift },
  ];

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="glass-card hover:shadow-md transition-shadow border-none shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-gray-50`}>
                   <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <p className="text-xs font-medium text-gray-500">{m.label}</p>
              </div>
              <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card overflow-hidden border-none shadow-sm">
        <CardHeader className="bg-white/50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <BarChart3 className="h-6 w-6 text-[#40657E]" />
            Painel Financeiro — Demonstrativo Mensal 2026
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-48 font-bold text-gray-700">INDICADOR</TableHead>
                {months.map(m => <TableHead key={m} className="text-center text-[11px] font-semibold">{m}</TableHead>)}
                <TableHead className="text-right font-bold bg-gray-100/30">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px]">
              {/* RECEITAS SECTION */}
              <TableRow className="bg-gray-50/10 border-none">
                <TableCell className="font-bold py-2 uppercase text-[10px] text-gray-500" colSpan={14}>RECEITAS</TableCell>
              </TableRow>
              <TableRow className="border-none">
                <TableCell className="pl-6 py-3">Receita Líquida</TableCell>
                {months.map(m => <TableCell key={m} className="text-center text-gray-400">R$ 0,00</TableCell>)}
                <TableCell className="text-right font-bold">{fmtr.format(stats.totalSalesValue)}</TableCell>
              </TableRow>

              {/* CUSTOS SECTION */}
              <TableRow className="bg-gray-50/10 border-none">
                <TableCell className="font-bold py-2 uppercase text-[10px] text-gray-500" colSpan={14}>CUSTOS</TableCell>
              </TableRow>
              <TableRow className="border-none">
                <TableCell className="pl-6 py-3">Custo das Peças</TableCell>
                {months.map(m => <TableCell key={m} className="text-center text-gray-400">R$ 0,00</TableCell>)}
                <TableCell className="text-right font-bold">{fmtr.format(stats.totalCost)}</TableCell>
              </TableRow>
              <TableRow className="border-none">
                <TableCell className="pl-6 py-3">Invest. Bonificações</TableCell>
                {months.map(m => <TableCell key={m} className="text-center text-gray-400">R$ 0,00</TableCell>)}
                <TableCell className="text-right font-bold">{fmtr.format(stats.totalBonusesValue)}</TableCell>
              </TableRow>

              {/* LUCRO ESTIMADO */}
              <TableRow className="bg-green-50/20 font-bold border-none border-t border-gray-100">
                <TableCell className="uppercase text-[11px] text-gray-800 py-4">LUCRO ESTIMADO</TableCell>
                {months.map((m, i) => (
                  <TableCell key={m} className="text-center text-green-600">R$ 0,00</TableCell>
                ))}
                <TableCell className="text-right text-green-700">{fmtr.format(stats.totalSalesValue - stats.totalBonusesValue - stats.totalCost)}</TableCell>
              </TableRow>

              {/* ITENS VENDIDOS */}
              <TableRow className="border-none">
                <TableCell className="uppercase text-[11px] font-bold text-gray-800 py-4">ITENS VENDIDOS</TableCell>
                {months.map(m => <TableCell key={m} className="text-center text-gray-600">0</TableCell>)}
                <TableCell className="text-right font-bold text-gray-800">{stats.totalSalesQuantity}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
