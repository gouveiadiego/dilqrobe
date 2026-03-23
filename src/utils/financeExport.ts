import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  received_from: string;
  category: string;
  amount: number;
  payment_type: string;
  is_paid: boolean;
}

export interface ExportOptions {
  transactions: Transaction[];
  periodLabel: string;
  startDate: Date;
  endDate: Date;
  appliedFilter?: string; // "all" | "receitas" | "despesas"
  searchQuery?: string;
  summaries: {
    income: number;
    expenses: number;
    balance: number;
    pending: number;
  };
  companyName?: string | null;
  companyLogoBase64?: string | null;
  totalBalance?: number;
  companyCnpj?: string;
  companyAddress?: string;
}

export async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to load image as base64:", e);
    return null;
  }
}

// ─── Colors ────────────────────────────────────────────────────────────────────
const C = {
  primary: [15, 23, 42] as [number, number, number],   // Slate 900 (Deep Navy)
  secondary: [51, 65, 85] as [number, number, number], // Slate 700
  accent: [79, 70, 229] as [number, number, number],   // Indigo 600
  muted: [148, 163, 184] as [number, number, number],  // Slate 400
  
  income: [5, 150, 105] as [number, number, number],   // Emerald 600
  incomeBg: [240, 253, 244] as [number, number, number], // Emerald 50
  
  expense: [225, 29, 72] as [number, number, number],  // Rose 600
  expenseBg: [255, 241, 242] as [number, number, number], // Rose 50
  
  balance: [37, 99, 235] as [number, number, number],  // Blue 600
  balanceBg: [241, 245, 249] as [number, number, number], // Slate 50 for neutral balance
  
  total: [67, 56, 202] as [number, number, number],    // Indigo 700
  totalBg: [238, 242, 255] as [number, number, number], // Indigo 50
  
  pending: [217, 119, 6] as [number, number, number],  // Amber 600
  pendingBg: [255, 251, 235] as [number, number, number], // Amber 50
  
  white: [255, 255, 255] as [number, number, number],
  border: [226, 232, 240] as [number, number, number], // Slate 200
  bg: [248, 250, 252] as [number, number, number],    // Slate 50
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(v));

const categoryLabel: Record<string, string> = {
  fixed: "Despesa Fixa", variable: "Despesa Variável",
  people: "Pessoas", taxes: "Impostos",
  transfer: "Transferência", income: "Receita", "": "--",
};

function filterLabel(f = "all") {
  if (f === "receitas") return "Somente Receitas";
  if (f === "despesas") return "Somente Despesas";
  return "Todas as transações";
}

function paymentBadge(type: string) {
  const map: Record<string, string> = {
    pix: "PIX", credit_card: "Cartão Crédito", debit_card: "Cartão Débito",
    cash: "Dinheiro", transfer: "Transferência", boleto: "Boleto", other: "Outro",
  };
  return map[type] ?? type;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export const exportFinancePDF = (opts: ExportOptions) => {
  const { transactions, periodLabel, startDate, endDate, summaries, appliedFilter, searchQuery } = opts;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 14; // left margin
  const MR = PW - 14; // right boundary
  const CW = MR - ML; // content width
  let y = 0;

  // ── HEADER GRADIENT BLOCK ───────────────────────────────────────────────────
  // Main bar
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, PW, 44, "F");
  
  // Subtle top highlight
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PW, 0.5, "F");

  // Logo / brand
  let titleX = ML + 4;
  if (opts.companyLogoBase64) {
    try {
      doc.addImage(opts.companyLogoBase64, "PNG", ML + 4, 10, 16, 16);
      titleX += 20;
    } catch (e) {
      console.warn("Failed to add image to PDF", e);
    }
  }

  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  // Company Name with dynamic font size to prevent overlap
  let nameFontSize = 22;
  doc.setFontSize(nameFontSize);
  
  // Set a much safer width limit (leaving 75mm for period and margins on right)
  const maxNameWidth = PW - titleX - 75;
  const nameWidth = doc.getTextWidth(opts.companyName || "DILQ ORBE");
  
  // Scale down even more if it's too wide
  if (nameWidth > maxNameWidth) {
    nameFontSize = Math.max(10, Math.floor(22 * (maxNameWidth / nameWidth)));
    doc.setFontSize(nameFontSize);
  }
  
  // If still very long, split into multiple lines and shift next items
  const splitTitle = doc.splitTextToSize(opts.companyName || "DILQ ORBE", maxNameWidth);
  doc.text(splitTitle, titleX, 18);
  
  const titleLinesCount = Array.isArray(splitTitle) ? splitTitle.length : 1;
  const titleBottomY = 18 + (titleLinesCount - 1) * (nameFontSize / 2.8); // Adjust based on lines

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 230); // Very light slate/blue
  let headerY = Math.max(25, titleBottomY + 6);
  doc.text("Gestão Financeira · Relatório Executivo", titleX, headerY);

  if (opts.companyCnpj || opts.companyAddress) {
    doc.setFontSize(7);
    headerY += 5;
    const details = [
      opts.companyCnpj ? `CNPJ: ${opts.companyCnpj}` : null,
      opts.companyAddress ? `Endereço: ${opts.companyAddress}` : null,
    ]
      .filter(Boolean)
      .join("  •  ");
    doc.text(details, titleX, headerY);
  }

  // Period on right
  const capitalPeriod = periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(capitalPeriod, MR, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  const dateRange = `${format(startDate, "dd/MM/yyyy")} — ${format(endDate, "dd/MM/yyyy")}`;
  doc.text(dateRange, MR, 24, { align: "right" });

  // Generation timestamp
  const genStr = `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
  doc.setFontSize(7);
  doc.text(genStr, MR, 32, { align: "right" });

  y = 52;

  // ── FILTER INFO BAR ─────────────────────────────────────────────────────────
  doc.setFillColor(...C.bg);
  doc.roundedRect(ML, y - 4, CW, 10, 2, 2, "F");
  doc.setDrawColor(...C.border);
  doc.roundedRect(ML, y - 4, CW, 10, 2, 2, "D");
  
  doc.setTextColor(...C.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const filterInfo = `Filtro aplicado: ${filterLabel(appliedFilter)}${searchQuery ? `  |  Busca: "${searchQuery}"` : ""}  |  Total: ${transactions.length} transações`;
  doc.text(filterInfo, ML + 4, y + 2.5);
  y += 14;

  // ── SUMMARY CARDS ───────────────────────────────────────────────────────────
  const cards = [
    { label: "RECEITAS",   val: summaries.income,   sign: "+", accentC: C.income,   bgC: C.white, txtC: C.income },
    { label: "DESPESAS",   val: summaries.expenses, sign: "-", accentC: C.expense,  bgC: C.white, txtC: C.expense },
    { label: "BALANÇO MENSAL", val: summaries.balance,  sign: summaries.balance >= 0 ? "+" : "-", accentC: summaries.balance >= 0 ? C.income : C.expense, bgC: C.white, txtC: summaries.balance >= 0 ? C.income : C.expense },
    { label: "SALDO EM CONTA", val: opts.totalBalance ?? 0, sign: (opts.totalBalance ?? 0) >= 0 ? "" : "-", accentC: (opts.totalBalance ?? 0) >= 0 ? C.total : C.expense, bgC: C.white, txtC: (opts.totalBalance ?? 0) >= 0 ? C.total : C.expense },
    { label: "PENDENTES",  val: summaries.pending,  sign: "",  accentC: C.pending,  bgC: C.white, txtC: C.pending },
  ];

  const cGap = 3;
  const cW = (CW - cGap * 4) / 5;
  const cH = 22;

  cards.forEach((card, i) => {
    const cx = ML + i * (cW + cGap);

    // Card shadow/border
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.1);
    doc.roundedRect(cx, y, cW, cH, 1.5, 1.5, "D");
    
    // Card bg
    doc.setFillColor(...card.bgC);
    doc.roundedRect(cx, y, cW, cH, 1.5, 1.5, "F");

    // Top border accent
    doc.setFillColor(...card.accentC);
    doc.rect(cx, y, cW, 1.5, "F");

    // Label
    doc.setTextColor(...C.secondary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(card.label, cx + cW / 2, y + 8, { align: "center" });

    // Value
    doc.setTextColor(...card.txtC);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const valTxt = `${card.sign}${fmt(card.val)}`;
    doc.text(valTxt, cx + cW / 2, y + 16, { align: "center", maxWidth: cW - 4 });
  });

  y += cH + 12;

  // ── SECTION DIVIDER ─────────────────────────────────────────────────────────
  doc.setTextColor(...C.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Transações do Período", ML, y);

  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.6);
  doc.line(ML, y + 2, ML + 52, y + 2);
  doc.setLineWidth(0.2);
  doc.setDrawColor(...C.border);
  doc.line(ML + 54, y + 2, MR, y + 2);

  y += 8;

  // ── TRANSACTIONS TABLE ───────────────────────────────────────────────────────
  const headers = ["Data", "Descrição / Contraparte", "Categoria", "Forma Pgto.", "Status", "Valor"];
  const colWidths = [18, 64, 26, 25, 20, 26];

  const rowH = 7;
  const headerH = 8;
  const tableLeft = ML;

  // ─ Header row ─
  let cx = tableLeft;
  doc.setFillColor(...C.primary);
  doc.roundedRect(tableLeft, y, CW, headerH, 2, 2, "F");

  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  headers.forEach((h, i) => {
    const align = i === 5 ? "right" : "left";
    const tx = align === "right" ? cx + colWidths[i] - 3 : cx + 3;
    doc.text(h, tx, y + 5.5, { align });
    cx += colWidths[i];
  });

  y += headerH;

  // ─ Data rows ─
  transactions.forEach((t, rowIdx) => {
    // Page break check
    if (y + rowH + 18 > PH) {
      doc.addPage();
      drawPageHeader(doc, PW, PH, ML, CW, capitalPeriod, dateRange, genStr);
      y = 20;

      // Repeat column headers on new page
      let cx2 = tableLeft;
      doc.setFillColor(...C.purpleDark);
      doc.roundedRect(tableLeft, y, CW, headerH, 1, 1, "F");
      doc.setTextColor(...C.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      headers.forEach((h, i) => {
        const align = i === 5 ? "right" : "left";
        const tx = align === "right" ? cx2 + colWidths[i] - 3 : cx2 + 3;
        doc.text(h, tx, y + 5.5, { align });
        cx2 += colWidths[i];
      });
      y += headerH;
    }

    // Alternating row background
    if (rowIdx % 2 === 0) {
      doc.setFillColor(...C.bg);
    } else {
      doc.setFillColor(...C.white);
    }
    doc.rect(tableLeft, y, CW, rowH, "F");

    // Bottom divider
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.15);
    doc.line(tableLeft, y + rowH, tableLeft + CW, y + rowH);

    // Row data
    const isIncome = t.amount > 0;
    const isPaid = t.is_paid;
    const dateStr = format(new Date(t.date + "T12:00:00"), "dd/MM/yy");
    const catLabel = categoryLabel[t.category] ?? t.category;
    const payLabel = paymentBadge(t.payment_type);
    const valTxt = `${isIncome ? "+" : "-"}${fmt(t.amount)}`;
    const statusTxt = isPaid ? "Pago" : "Pendente";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    let cx3 = tableLeft;

    // Date
    doc.setTextColor(...C.secondary);
    doc.text(dateStr, cx3 + 3, y + 4.8);
    cx3 += colWidths[0];

    // Description + sub (received_from)
    doc.setTextColor(...C.primary);
    doc.setFont("helvetica", "bold");
    const descTrunc = t.description.length > 32 ? t.description.slice(0, 31) + "…" : t.description;
    doc.text(descTrunc, cx3 + 3, y + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...C.muted);
    const fromTrunc = t.received_from.length > 38 ? t.received_from.slice(0, 37) + "…" : t.received_from;
    doc.text(fromTrunc, cx3 + 3, y + 6.3);
    cx3 += colWidths[1];

    // Category badge
    doc.setFontSize(6.5);
    doc.setTextColor(...C.secondary);
    doc.text(catLabel, cx3 + 3, y + 4.8);
    cx3 += colWidths[2];

    // Payment type
    doc.text(payLabel, cx3 + 3, y + 4.8);
    cx3 += colWidths[3];

    // Status
    if (isPaid) {
      doc.setFillColor(...C.incomeBg);
      doc.setTextColor(...C.income);
    } else {
      doc.setFillColor(...C.pendingBg);
      doc.setTextColor(...C.pending);
    }
    doc.roundedRect(cx3 + 1, y + 1.5, colWidths[4] - 2, 4, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.text(statusTxt, cx3 + colWidths[4] / 2, y + 4.5, { align: "center" });
    cx3 += colWidths[4];

    // Amount
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    if (isIncome) { doc.setTextColor(...C.income); } else { doc.setTextColor(...C.expense); }
    doc.text(valTxt, cx3 + colWidths[5] - 3, y + 4.8, { align: "right" });

    y += rowH;
  });

  // ── TOTALS ROW ───────────────────────────────────────────────────────────────
  // Make sure there is room; add page if needed
  if (y + 14 > PH - 12) {
    doc.addPage();
    drawPageHeader(doc, PW, PH, ML, CW, capitalPeriod, dateRange, genStr);
    y = 20;
  }

  y += 3;
  doc.setFillColor(...C.totalBg);
  doc.roundedRect(tableLeft, y, CW, 10, 2, 2, "F");
  doc.setDrawColor(...C.total);
  doc.setLineWidth(0.1);
  doc.roundedRect(tableLeft, y, CW, 10, 2, 2, "D");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  // Label (left)
  doc.setTextColor(...C.total);
  doc.text("Totais do periodo:", tableLeft + 3, y + 7);

  // Three right-aligned blocks from the right edge
  const rxBase = MR - 3;

  // Saldo (rightmost)
  const balSign = summaries.balance >= 0 ? "+" : "-";
  if (summaries.balance >= 0) { doc.setTextColor(...C.income); } else { doc.setTextColor(...C.expense); }
  doc.text(`Balanço: ${balSign}${fmt(summaries.balance)}`, rxBase, y + 7, { align: "right" });

  // Despesas (52mm to the left of saldo)
  doc.setTextColor(...C.expense);
  doc.text(`Despesas: -${fmt(summaries.expenses)}`, rxBase - 54, y + 7, { align: "right" });

  // Receitas (52mm further left)
  doc.setTextColor(...C.income);
  doc.text(`Receitas: +${fmt(summaries.income)}`, rxBase - 108, y + 7, { align: "right" });


  // ── FOOTER (all pages) ───────────────────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const fy = PH - 9;
    doc.setFillColor(...C.primary);
    doc.rect(0, fy, PW, 9, "F");
    doc.setFillColor(...C.accent);
    doc.rect(0, fy, PW, 0.4, "F");
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("DILQ ORBE · Relatório Financeiro Confidencial", ML + 4, fy + 5.5);
    doc.text(`Página ${p} de ${pageCount}`, MR, fy + 5.5, { align: "right" });
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────────
  const safePeriod = capitalPeriod
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  doc.save(`relatorio_financeiro_${safePeriod}.pdf`);
};

// Helper: light header for continuation pages
function drawPageHeader(
  doc: jsPDF, PW: number, _PH: number, ML: number, CW: number,
  period: string, dateRange: string, _genStr: string
) {
  const MR = ML + CW;
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, PW, 14, "F");
  
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PW, 0.4, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DILQ ORBE · Relatório Financeiro (cont.)", ML + 4, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 210, 230);
  doc.text(`${period}  ·  ${dateRange}`, MR, 9, { align: "right" });
}

// ── Convenience: export a specific month from a full transaction list ─────────
export const exportMonthPDF = (
  allTransactions: Transaction[],
  year: number,
  month: number, // 0-indexed
  appliedFilter?: string,
  searchQuery?: string,
) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const periodLabel = format(startDate, "MMMM 'de' yyyy", { locale: ptBR });

  const monthTxns = allTransactions.filter((t) => {
    const d = new Date(t.date + "T12:00:00");
    return d >= startDate && d <= endDate;
  });

  const income   = monthTxns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  exportFinancePDF({
    transactions: monthTxns,
    periodLabel,
    startDate,
    endDate,
    appliedFilter,
    searchQuery,
    summaries: {
      income,
      expenses,
      balance: income - expenses,
      pending: monthTxns.filter((t) => !t.is_paid).reduce((s, t) => s + Math.abs(t.amount), 0),
    },
  });
};
