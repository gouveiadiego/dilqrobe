export interface ParsedProduct {
  code: string;
  name: string;
  category: string;
  size: string;
  color: string;
  cost_price: number;
  sale_price: number;
  qty_in: number;
}

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const parseCartPandaCSV = (csvText: string): ParsedProduct[] => {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  
  const getIdx = (aliases: string[]) => {
    return headers.findIndex(h => 
      aliases.some(a => h.toLowerCase().trim() === a.toLowerCase().trim())
    );
  };

  const titleIdx = getIdx(['Title']);
  const handleIdx = getIdx(['Handle']);
  const typeIdx = getIdx(['Type']);
  const opt1NameIdx = getIdx(['Option1 Name']);
  const opt1ValIdx = getIdx(['Option1 Value']);
  const opt2NameIdx = getIdx(['Option2 Name']);
  const opt2ValIdx = getIdx(['Option2 Value']);
  const skuIdx = getIdx(['Variant SKU']);
  const qtyIdx = getIdx(['Variant Inventory Qty']);
  const priceIdx = getIdx(['Variant Price']);
  const costIdx = getIdx(['Cost per item']);

  const products: ParsedProduct[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const title = cols[titleIdx] || '';
    if (!title) continue;

    let size = '';
    let color = '';
    
    const opt1Name = (cols[opt1NameIdx] || '').toLowerCase();
    const opt2Name = (cols[opt2NameIdx] || '').toLowerCase();
    
    if (opt1Name.includes('tamanho') || opt1Name.includes('size')) {
      size = cols[opt1ValIdx] || '';
    }
    if (opt2Name.includes('cor') || opt2Name.includes('color')) {
      color = cols[opt2ValIdx] || '';
    }
    if (opt1Name.includes('cor') || opt1Name.includes('color')) {
      color = cols[opt1ValIdx] || '';
    }
    if (opt2Name.includes('tamanho') || opt2Name.includes('size')) {
      size = cols[opt2ValIdx] || '';
    }

    if (!size && !color) continue; // skip variant rows without size/color

    const handle = cols[handleIdx] || '';
    const sku = cols[skuIdx] || '';
    const code = sku || `${handle}-${size}`.toUpperCase();
    
    if (seen.has(code)) continue;
    seen.add(code);

    const rawPrice = parseFloat(cols[priceIdx] || '0');
    const rawCost = parseFloat(cols[costIdx] || '0');
    // CartPanda exports price in cents (19990 = R$199.90)
    const salePrice = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
    const costPrice = rawCost > 1000 ? rawCost / 100 : rawCost;

    const qty = parseInt(cols[qtyIdx] || '0') || 0;
    const category = cols[typeIdx] || '';

    products.push({
      code,
      name: title,
      category: category === 'undefined' ? '' : category,
      size,
      color,
      cost_price: costPrice,
      sale_price: salePrice,
      qty_in: qty,
    });
  }

  return products;
};
