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
  purple:      [79,  48, 191] as [number, number, number],   // #4F30BF
  purpleDark:  [55,  30, 155] as [number, number, number],   // #371E9B
  purpleLight: [237, 233, 254] as [number, number, number],  // #EDE9FE
  accent:      [139, 92,  246] as [number, number, number],  // #8B5CF6
  green:       [22,  163, 74]  as [number, number, number],
  greenLight:  [220, 252, 231] as [number, number, number],
  red:         [220, 38,  38]  as [number, number, number],
  redLight:    [254, 226, 226] as [number, number, number],
  amber:       [217, 119, 6]   as [number, number, number],
  amberLight:  [254, 243, 199] as [number, number, number],
  gray900:     [17,  24,  39]  as [number, number, number],
  gray700:     [55,  65,  81]  as [number, number, number],
  gray500:     [107, 114, 128] as [number, number, number],
  gray200:     [229, 231, 235] as [number, number, number],
  gray50:      [249, 250, 251] as [number, number, number],
  white:       [255, 255, 255] as [number, number, number],
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
  doc.setFillColor(...C.purple);
  doc.rect(0, 0, PW, 44, "F");

  // Accent stripe
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, 4, 44, "F");

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
  doc.setFontSize(22);
  doc.text(opts.companyName || "DILQ ORBE", titleX, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 210, 255);
  doc.text("Gestão Financeira · Relatório Executivo", titleX, 26);

  // Period on right
  const capitalPeriod = periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(capitalPeriod, MR, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 210, 255);
  const dateRange = `${format(startDate, "dd/MM/yyyy")} — ${format(endDate, "dd/MM/yyyy")}`;
  doc.text(dateRange, MR, 24, { align: "right" });

  // Generation timestamp
  const genStr = `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
  doc.setFontSize(7);
  doc.text(genStr, MR, 32, { align: "right" });

  y = 52;

  // ── FILTER INFO BAR ─────────────────────────────────────────────────────────
  doc.setFillColor(...C.purpleLight);
  doc.roundedRect(ML, y - 4, CW, 10, 2, 2, "F");
  doc.setTextColor(...C.purple);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const filterInfo = `Filtro aplicado: ${filterLabel(appliedFilter)}${searchQuery ? `  |  Busca: "${searchQuery}"` : ""}  |  Total: ${transactions.length} transações`;
  doc.text(filterInfo, ML + 4, y + 2.5);
  y += 14;

  // ── SUMMARY CARDS ───────────────────────────────────────────────────────────
  const cards = [
    { label: "RECEITAS",   val: summaries.income,   sign: "+", bgC: C.greenLight, txtC: C.green,   borderC: C.green },
    { label: "DESPESAS",   val: summaries.expenses, sign: "-", bgC: C.redLight,   txtC: C.red,     borderC: C.red },
    { label: "SALDO",      val: summaries.balance,  sign: summaries.balance >= 0 ? "+" : "-", bgC: summaries.balance >= 0 ? C.greenLight : C.redLight, txtC: summaries.balance >= 0 ? C.green : C.red, borderC: summaries.balance >= 0 ? C.green : C.red },
    { label: "PENDENTES",  val: summaries.pending,  sign: "",  bgC: C.amberLight, txtC: C.amber,   borderC: C.amber },
  ];

  const cGap = 4;
  const cW = (CW - cGap * 3) / 4;
  const cH = 22;

  cards.forEach((card, i) => {
    const cx = ML + i * (cW + cGap);

    // Card bg
    doc.setFillColor(...card.bgC);
    doc.roundedRect(cx, y, cW, cH, 2, 2, "F");

    // Top border accent
    doc.setFillColor(...card.borderC);
    doc.roundedRect(cx, y, cW, 2.5, 1, 1, "F");

    // Label
    doc.setTextColor(...card.txtC);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(card.label, cx + cW / 2, y + 8, { align: "center" });

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const valTxt = `${card.sign}${fmt(card.val)}`;
    doc.text(valTxt, cx + cW / 2, y + 17, { align: "center", maxWidth: cW - 4 });
  });

  y += cH + 12;

  // ── SECTION DIVIDER ─────────────────────────────────────────────────────────
  doc.setTextColor(...C.gray900);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Transações do Período", ML, y);

  doc.setDrawColor(...C.purple);
  doc.setLineWidth(0.6);
  doc.line(ML, y + 2, ML + 52, y + 2);
  doc.setLineWidth(0.2);
  doc.setDrawColor(...C.gray200);
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
  doc.setFillColor(...C.purpleDark);
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
      doc.setFillColor(...C.gray50);
    } else {
      doc.setFillColor(...C.white);
    }
    doc.rect(tableLeft, y, CW, rowH, "F");

    // Bottom divider
    doc.setDrawColor(...C.gray200);
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
    doc.setTextColor(...C.gray700);
    doc.text(dateStr, cx3 + 3, y + 4.8);
    cx3 += colWidths[0];

    // Description + sub (received_from)
    doc.setTextColor(...C.gray900);
    doc.setFont("helvetica", "bold");
    const descTrunc = t.description.length > 32 ? t.description.slice(0, 31) + "…" : t.description;
    doc.text(descTrunc, cx3 + 3, y + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...C.gray500);
    const fromTrunc = t.received_from.length > 38 ? t.received_from.slice(0, 37) + "…" : t.received_from;
    doc.text(fromTrunc, cx3 + 3, y + 6.3);
    cx3 += colWidths[1];

    // Category badge
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray700);
    doc.text(catLabel, cx3 + 3, y + 4.8);
    cx3 += colWidths[2];

    // Payment type
    doc.text(payLabel, cx3 + 3, y + 4.8);
    cx3 += colWidths[3];

    // Status
    if (isPaid) {
      doc.setFillColor(...C.greenLight);
      doc.setTextColor(...C.green);
    } else {
      doc.setFillColor(...C.amberLight);
      doc.setTextColor(...C.amber);
    }
    doc.roundedRect(cx3 + 1, y + 1.5, colWidths[4] - 2, 4, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.text(statusTxt, cx3 + colWidths[4] / 2, y + 4.5, { align: "center" });
    cx3 += colWidths[4];

    // Amount
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    if (isIncome) { doc.setTextColor(...C.green); } else { doc.setTextColor(...C.red); }
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
  doc.setFillColor(...C.purpleLight);
  doc.roundedRect(tableLeft, y, CW, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  // Label (left)
  doc.setTextColor(...C.purple);
  doc.text("Totais do periodo:", tableLeft + 3, y + 7);

  // Three right-aligned blocks from the right edge
  const rxBase = MR - 3;

  // Saldo (rightmost, ~52mm wide)
  const balSign = summaries.balance >= 0 ? "+" : "-";
  if (summaries.balance >= 0) { doc.setTextColor(...C.green); } else { doc.setTextColor(...C.red); }
  doc.text(`Saldo: ${balSign}${fmt(summaries.balance)}`, rxBase, y + 7, { align: "right" });

  // Despesas (52mm to the left of saldo)
  doc.setTextColor(...C.red);
  doc.text(`Despesas: -${fmt(summaries.expenses)}`, rxBase - 54, y + 7, { align: "right" });

  // Receitas (52mm further left)
  doc.setTextColor(...C.green);
  doc.text(`Receitas: +${fmt(summaries.income)}`, rxBase - 108, y + 7, { align: "right" });


  // ── FOOTER (all pages) ───────────────────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const fy = PH - 9;
    doc.setFillColor(...C.purple);
    doc.rect(0, fy, PW, 9, "F");
    doc.setFillColor(...C.accent);
    doc.rect(0, fy, 4, 9, "F");
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
  doc.setFillColor(79, 48, 191);
  doc.rect(0, 0, PW, 14, "F");
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 0, 4, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DILQ ORBE · Relatório Financeiro (cont.)", ML + 4, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(220, 210, 255);
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
