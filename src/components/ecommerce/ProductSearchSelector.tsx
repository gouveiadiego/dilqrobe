import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ProductSearchSelectorProps {
  products: any[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function ProductSearchSelector({ 
  products, 
  value, 
  onValueChange, 
  placeholder = "Selecionar produto..." 
}: ProductSearchSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedProduct = products.find((p) => p.id === value)

  // Ultra-safe filtering logic: ensures that if any field is null/undefined, it doesn't crash the entire list.
  const filteredProducts = products.filter((p) => {
    if (!p || !p.name) return false;
    
    const searchLower = (search || "").toLowerCase();
    const nameMatch = String(p.name).toLowerCase().includes(searchLower);
    const skuMatch = p.sku ? String(p.sku).toLowerCase().includes(searchLower) : false;
    const sizeMatch = p.size ? String(p.size).toLowerCase().includes(searchLower) : false;
    const colorMatch = p.color ? String(p.color).toLowerCase().includes(searchLower) : false;
    
    return nameMatch || skuMatch || sizeMatch || colorMatch;
  });

  // Simple diagnostic for terminal/console (invisible to user unless they check)
  if (open) {
    console.log(`[ProductSearchSelector] Total products: ${products?.length}, Filtered: ${filteredProducts?.length}, Search: "${search}"`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white text-left font-normal py-2 h-auto"
        >
          {selectedProduct ? (
            <div className="flex flex-col items-start overflow-hidden">
              <span className="truncate w-full font-medium">{selectedProduct.name}</span>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="font-bold text-gray-600 uppercase bg-gray-100 px-1 rounded">
                  {selectedProduct.size || "-"}
                </span>
                <span className="truncate">{selectedProduct.color || "-"} • SKU: {selectedProduct.sku}</span>
              </div>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Buscar por nome, SKU, tamanho ou cor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandEmpty className="flex flex-col gap-2 py-6 text-center text-sm">
              <span className="text-gray-500 font-medium">Nenhum produto encontrado.</span>
              <span className="text-[10px] text-gray-400 font-mono">
                (Total no sistema: {products?.length || 0})
              </span>
            </CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => {
                    onValueChange(p.id)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="flex flex-col items-start py-2.5 px-3"
                >
                  <div className="flex items-center w-full justify-between">
                    <span className="font-semibold text-sm">{p.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === p.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold bg-[#40657E]/10 px-1.5 py-0.5 rounded text-[#40657E] uppercase">
                      {p.size || "-"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {p.color || "-"} • SKU: {p.sku} • R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
