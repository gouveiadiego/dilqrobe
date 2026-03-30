import * as XLSX from 'xlsx';

export interface ProductExcelData {
  Nome: string;
  SKU: string;
  Categoria: string;
  Tamanho: string;
  Cor: string;
  'Preço de Custo': number;
  'Preço de Venda': number;
  Estoque: number;
}

const parseNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  try {
    const cleaned = String(value)
      .replace(/R\$\s?/g, '')
      .replace(/\./g, '') 
      .replace(',', '.')
      .trim();
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  } catch (err) {
    return 0;
  }
};

// Helper to find a value in an object using multiple possible key aliases (case-insensitive)
const getVal = (obj: any, aliases: string[]) => {
  const keys = Object.keys(obj);
  const normalizedAliases = aliases.map(a => a.toLowerCase().trim());
  
  const foundKey = keys.find(k => normalizedAliases.includes(k.toLowerCase().trim()));
  return foundKey ? obj[foundKey] : undefined;
};

export const downloadTemplate = () => {
  const templateData: ProductExcelData[] = [
    {
      Nome: 'Legging Cirrê',
      SKU: 'FIT001',
      Categoria: 'Legging',
      Tamanho: 'M',
      Cor: 'Preto',
      'Preço de Custo': 45.00,
      'Preço de Venda': 89.90,
      Estoque: 20
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

  const wscols = [
    { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, 
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, 'modelo_importacao_fitness.xlsx');
};

export const exportToExcel = (products: any[]) => {
  const exportData = products.map(p => ({
    Nome: p.name,
    SKU: p.sku || '',
    Categoria: p.category || '',
    Tamanho: p.size || '',
    Cor: p.color || '',
    'Preço de Custo': p.cost_price || 0,
    'Preço de Venda': p.price || 0,
    Estoque: p.stock_quantity || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

  XLSX.writeFile(workbook, 'produtos_fitness_exportados.xlsx');
};

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log("Raw JSON Data from Excel:", jsonData);

        const mappedData = jsonData.map((item: any) => {
          const name = getVal(item, ['Nome', 'Product', 'PRODUTO', 'Produto', 'Designação']);
          const sku = getVal(item, ['SKU', 'CÓDIGO', 'Código', 'Ref', 'Referência']);
          const category = getVal(item, ['Categoria', 'Category', 'TIPO']);
          const size = getVal(item, ['Tamanho', 'Size', 'TAM']);
          const color = getVal(item, ['Cor', 'Color', 'COR']);
          const cost = getVal(item, ['Preço de Custo', 'Custo', 'Cost', 'Preço Custo']);
          const price = getVal(item, ['Preço de Venda', 'Preço', 'Venda', 'Price', 'Sale Price']);
          const stock = getVal(item, ['Estoque', 'Quantidade', 'Stock', 'Qtd', 'QTD']);

          return {
            name: name,
            sku: sku || `AUTO-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            category: category,
            size: size,
            color: color,
            cost_price: parseNumber(cost),
            price: parseNumber(price),
            stock_quantity: parseInt(stock || 0),
          };
        }).filter((item: any) => item.name);

        console.log("Mapped Data for import:", mappedData);

        // Deduplicate by SKU
        const dedupedMap = new Map();
        mappedData.forEach(item => {
          if (item.sku) {
            dedupedMap.set(item.sku, item);
          }
        });

        const finalData = Array.from(dedupedMap.values());
        resolve(finalData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
