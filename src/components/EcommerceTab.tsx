import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEcommerce } from "@/hooks/useEcommerce";
import { SuppliersManager } from "./ecommerce/SuppliersManager";
import { InventoryManager } from "./ecommerce/InventoryManager";
import { SalesManager } from "./ecommerce/SalesManager";
import { BonificationsManager } from "./ecommerce/BonificationsManager";
import { EcommerceDashboard } from "./ecommerce/EcommerceDashboard";
import { Truck, Package, ShoppingCart, Gift, BarChart3 } from "lucide-react";

export function EcommerceTab() {
  const {
    suppliers, suppliersLoading, addSupplier, updateSupplier, deleteSupplier,
    products, productsLoading, addProduct, updateProduct, deleteProduct,
    sales, salesLoading, addSale, deleteSale,
    bonifications, bonificationsLoading, addBonification, deleteBonification,
  } = useEcommerce();

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent">
          Ecommerce
        </h2>
        <div className="h-1 flex-grow ml-4 bg-gradient-to-r from-dilq-accent to-dilq-teal rounded-full opacity-50" />
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs md:text-sm">
            <BarChart3 className="h-4 w-4" /> <span className="hidden md:inline">Painel</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-1 text-xs md:text-sm">
            <Package className="h-4 w-4" /> <span className="hidden md:inline">Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-1 text-xs md:text-sm">
            <ShoppingCart className="h-4 w-4" /> <span className="hidden md:inline">Vendas</span>
          </TabsTrigger>
          <TabsTrigger value="bonifications" className="flex items-center gap-1 text-xs md:text-sm">
            <Gift className="h-4 w-4" /> <span className="hidden md:inline">Bonificações</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-1 text-xs md:text-sm">
            <Truck className="h-4 w-4" /> <span className="hidden md:inline">Fornecedores</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <EcommerceDashboard products={products} sales={sales} bonifications={bonifications} />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryManager
            products={products} suppliers={suppliers} loading={productsLoading}
            onAdd={(p) => addProduct.mutate(p)} onUpdate={(p) => updateProduct.mutate(p)}
            onDelete={(id) => deleteProduct.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="sales">
          <SalesManager
            sales={sales} products={products} loading={salesLoading}
            onAdd={(s) => addSale.mutate(s)} onDelete={(id) => deleteSale.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="bonifications">
          <BonificationsManager
            bonifications={bonifications} products={products} loading={bonificationsLoading}
            onAdd={(b) => addBonification.mutate(b)} onDelete={(id) => deleteBonification.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="suppliers">
          <SuppliersManager
            suppliers={suppliers} loading={suppliersLoading}
            onAdd={(s) => addSupplier.mutate(s)} onUpdate={(s) => updateSupplier.mutate(s)}
            onDelete={(id) => deleteSupplier.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
