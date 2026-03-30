import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Package, ShoppingCart, Gift, DollarSign } from "lucide-react";

interface Props {
  products: any[];
  sales: any[];
  bonifications: any[];
}

export function EcommerceDashboard({ products, sales, bonifications }: Props) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const stats = useMemo(() => {
    // Revenue
    const grossRevenue = sales.reduce((sum, s) => {
      return sum + ((s.unit_price || 0) * (s.quantity || 1));
    }, 0);
    const totalDiscounts = sales.reduce((sum, s) => sum + (s.discount_amount || 0), 0);
    const netRevenue = grossRevenue - totalDiscounts;

    // Costs
    const costOfGoods = sales.reduce((sum, s) => {
      return sum + ((s.unit_cost || 0) * (s.quantity || 1));
    }, 0);
    const bonifInvestment = bonifications.reduce((sum, b) => {
      return sum + ((b.unit_cost || 0) * (b.quantity || 1));
    }, 0);
    const grossMargin = netRevenue - costOfGoods - bonifInvestment;

    // Quantities
    const totalSold = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalGifted = bonifications.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const totalStock = products.reduce((sum, p) => {
      return sum + ((p.qty_in || 0) - (p.qty_sold || 0) - (p.qty_gifted || 0));
    }, 0);
    const lowStockCount = products.filter(p => {
      const bal = (p.qty_in || 0) - (p.qty_sold || 0) - (p.qty_gifted || 0);
      return bal <= 2 && bal > 0;
    }).length;
    const outOfStockCount = products.filter(p => {
      const bal = (p.qty_in || 0) - (p.qty_sold || 0) - (p.qty_gifted || 0);
      return bal <= 0;
    }).length;

    // Ticket médio
    const avgTicket = totalSold > 0 ? netRevenue / totalSold : 0;

    // Bonification ROI
    const bonifSalesGenerated = bonifications.reduce((sum, b) => sum + (b.sales_generated || 0), 0);

    // Monthly breakdown (current year)
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthSales = sales.filter(s => {
        const d = new Date(s.sale_date);
        return d.getMonth() === i && d.getFullYear() === new Date().getFullYear();
      });
      const revenue = monthSales.reduce((sum, s) => {
        const total = (s.unit_price || 0) * (s.quantity || 1);
        const disc = s.discount_amount || 0;
        return sum + total - disc;
      }, 0);
      const cost = monthSales.reduce((sum, s) => sum + ((s.unit_cost || 0) * (s.quantity || 1)), 0);
      const monthBonifs = bonifications.filter(b => {
        const d = new Date(b.bonification_date);
        return d.getMonth() === i && d.getFullYear() === new Date().getFullYear();
      });
      const bonifCost = monthBonifs.reduce((sum, b) => sum + ((b.unit_cost || 0) * (b.quantity || 1)), 0);
      return {
        month: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][i],
        revenue,
        cost,
        bonifCost,
        profit: revenue - cost - bonifCost,
        itemsSold: monthSales.reduce((sum, s) => sum + (s.quantity || 0), 0),
      };
    });

    return {
      grossRevenue, totalDiscounts, netRevenue, costOfGoods, bonifInvestment,
      grossMargin, totalSold, totalGifted, totalStock, lowStockCount,
      outOfStockCount, avgTicket, bonifSalesGenerated, months,
    };
  }, [products, sales, bonifications]);

  const kpiCards = [
    { label: "Receita Bruta", value: formatCurrency(stats.grossRevenue), icon: DollarSign, color: "text-blue-600" },
    { label: "Receita Líquida", value: formatCurrency(stats.netRevenue), icon: TrendingUp, color: "text-green-600" },
    { label: "Margem Bruta", value: formatCurrency(stats.grossMargin), icon: stats.grossMargin >= 0 ? TrendingUp : TrendingDown, color: stats.grossMargin >= 0 ? "text-green-600" : "text-red-600" },
    { label: "Itens Vendidos", value: stats.totalSold.toString(), icon: ShoppingCart, color: "text-purple-600" },
    { label: "Itens Bonificados", value: stats.totalGifted.toString(), icon: Gift, color: "text-orange-600" },
    { label: "Estoque Total", value: stats.totalStock.toString(), icon: Package, color: "text-cyan-600" },
    { label: "Ticket Médio", value: formatCurrency(stats.avgTicket), icon: BarChart3, color: "text-indigo-600" },
    { label: "Invest. Bonificações", value: formatCurrency(stats.bonifInvestment), icon: Gift, color: "text-red-500" },
  ];

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-orange-800">
              ⚠️ {stats.outOfStockCount > 0 && `${stats.outOfStockCount} produto(s) esgotado(s). `}
              {stats.lowStockCount > 0 && `${stats.lowStockCount} produto(s) com estoque crítico.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Monthly DRE Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Painel Financeiro — Demonstrativo Mensal {new Date().getFullYear()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-bold bg-muted">INDICADOR</th>
                  {monthNames.map(m => (
                    <th key={m} className="text-right p-2 font-bold bg-muted">{m}</th>
                  ))}
                  <th className="text-right p-2 font-bold bg-muted">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {/* RECEITAS */}
                <tr className="bg-muted/50">
                  <td className="p-2 font-bold" colSpan={14}>RECEITAS</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 pl-4">Receita Líquida</td>
                  {stats.months.map((m, i) => (
                    <td key={i} className="p-2 text-right">{formatCurrency(m.revenue)}</td>
                  ))}
                  <td className="p-2 text-right font-bold">{formatCurrency(stats.netRevenue)}</td>
                </tr>

                {/* CUSTOS */}
                <tr className="bg-muted/50">
                  <td className="p-2 font-bold" colSpan={14}>CUSTOS</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 pl-4">Custo das Peças</td>
                  {stats.months.map((m, i) => (
                    <td key={i} className="p-2 text-right">{formatCurrency(m.cost)}</td>
                  ))}
                  <td className="p-2 text-right font-bold">{formatCurrency(stats.costOfGoods)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 pl-4">Invest. Bonificações</td>
                  {stats.months.map((m, i) => (
                    <td key={i} className="p-2 text-right">{formatCurrency(m.bonifCost)}</td>
                  ))}
                  <td className="p-2 text-right font-bold">{formatCurrency(stats.bonifInvestment)}</td>
                </tr>

                {/* LUCRO */}
                <tr className="bg-muted/50 font-bold border-t-2">
                  <td className="p-2">LUCRO ESTIMADO</td>
                  {stats.months.map((m, i) => (
                    <td key={i} className={`p-2 text-right ${m.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(m.profit)}
                    </td>
                  ))}
                  <td className={`p-2 text-right ${stats.grossMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(stats.grossMargin)}
                  </td>
                </tr>

                {/* KPIs */}
                <tr className="border-t">
                  <td className="p-2 font-medium">ITENS VENDIDOS</td>
                  {stats.months.map((m, i) => (
                    <td key={i} className="p-2 text-right">{m.itemsSold}</td>
                  ))}
                  <td className="p-2 text-right font-bold">{stats.totalSold}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
