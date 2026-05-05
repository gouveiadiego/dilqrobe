import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { Budget } from "./types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Helper: load image URL into a base64 data URL for jsPDF
async function loadImageAsDataURL(url: string): Promise<{ dataUrl: string; format: string } | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    let fmt = 'PNG';
    if (blob.type.includes('jpeg') || blob.type.includes('jpg')) fmt = 'JPEG';
    else if (blob.type.includes('webp')) fmt = 'WEBP';
    return { dataUrl, format: fmt };
  } catch (e) {
    console.error('Erro ao carregar logo:', e);
    return null;
  }
}

export async function generateBudgetPDF(budget: Budget) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 18;

    // Minimalist premium palette
    const gold: [number, number, number] = [180, 142, 73];        // discreet gold
    const goldLight: [number, number, number] = [212, 184, 124];
    const dark: [number, number, number] = [28, 28, 30];
    const muted: [number, number, number] = [110, 110, 115];
    const softLine: [number, number, number] = [225, 220, 210];

    // Try to get company logo from profile
    let logoData: { dataUrl: string; format: string } | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_logo')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile?.company_logo) {
          logoData = await loadImageAsDataURL(profile.company_logo);
        }
      }
    } catch (e) {
      console.warn('Não foi possível carregar a logo do perfil:', e);
    }

    let y = margin + 4;

    // ===== HEADER =====
    // Logo (left) — preserve aspect ratio
    if (logoData) {
      try {
        const props = (doc as any).getImageProperties(logoData.dataUrl);
        const maxW = 32;
        const maxH = 22;
        const ratio = props.width / props.height;
        let w = maxW;
        let h = maxW / ratio;
        if (h > maxH) {
          h = maxH;
          w = maxH * ratio;
        }
        doc.addImage(logoData.dataUrl, logoData.format, margin, y, w, h, undefined, 'FAST');
      } catch (e) {
        console.warn('Falha ao inserir logo:', e);
      }
    }

    // Title (right)
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('ORÇAMENTO', pageWidth - margin, y + 8, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    const budgetNumber = `Nº ${budget.id.substring(0, 8).toUpperCase()}`;
    const createdDate = format(new Date(budget.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    doc.text(budgetNumber, pageWidth - margin, y + 14, { align: 'right' });
    doc.text(createdDate, pageWidth - margin, y + 19, { align: 'right' });

    y += 28;

    // Gold divider line
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(...goldLight);
    doc.line(margin, y + 1.2, pageWidth - margin, y + 1.2);

    y += 10;

    // ===== TWO-COLUMN INFO: EMPRESA / CLIENTE =====
    const colWidth = (pageWidth - margin * 2 - 8) / 2;

    const drawSection = (title: string, lines: string[], x: number, startY: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text(title, x, startY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      let ly = startY + 5;
      lines.filter(Boolean).forEach((line) => {
        const wrapped = doc.splitTextToSize(line, colWidth);
        wrapped.forEach((w: string) => {
          doc.text(w, x, ly);
          ly += 4.5;
        });
      });
      return ly;
    };

    const empresaLines = [
      budget.company_name || '—',
      budget.company_document ? `CNPJ: ${budget.company_document}` : '',
      budget.company_phone || '',
      budget.company_address || '',
    ];

    const clienteLines = [
      budget.client_name || '—',
      budget.client_document ? `Doc: ${budget.client_document}` : '',
      budget.client_email || '',
      budget.client_phone || '',
      budget.client_address || '',
    ];

    const yLeft = drawSection('EMPRESA', empresaLines, margin, y);
    const yRight = drawSection('CLIENTE', clienteLines, margin + colWidth + 8, y);
    y = Math.max(yLeft, yRight) + 6;

    // Subtle separator
    doc.setDrawColor(...softLine);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ===== ITEMS =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.text('ITENS DO ORÇAMENTO', margin, y);
    y += 3;

    const tableData = budget.items.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total)
    ]);

    (doc as any).autoTable({
      startY: y + 2,
      head: [['Descrição', 'Qtd', 'Valor Unit.', 'Total']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        textColor: dark,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        lineColor: gold,
        lineWidth: { bottom: 0.5 },
      },
      bodyStyles: {
        fontSize: 9,
        textColor: dark,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        lineColor: softLine,
        lineWidth: { bottom: 0.1 },
      },
      columnStyles: {
        0: { cellWidth: 95, halign: 'left' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      styles: {
        overflow: 'linebreak',
        font: 'helvetica',
      },
      didDrawPage: () => {
        // Footer
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...muted);
        doc.text(
          `${budget.company_name || ''}`.trim(),
          margin,
          pageHeight - 10
        );
        doc.text(
          `Página ${doc.getNumberOfPages()}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' }
        );
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY || y + 50;

    if (pageHeight - finalY < 70) {
      doc.addPage();
      finalY = margin;
    }

    finalY += 10;

    // ===== TOTAL (minimalist with gold accent) =====
    const totalBoxW = 80;
    const totalBoxX = pageWidth - margin - totalBoxW;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(totalBoxX, finalY, totalBoxX + totalBoxW, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text('VALOR TOTAL', totalBoxX, finalY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...dark);
    doc.text(formatCurrency(budget.total_amount), totalBoxX + totalBoxW, finalY + 13, { align: 'right' });

    doc.setDrawColor(...goldLight);
    doc.setLineWidth(0.2);
    doc.line(totalBoxX, finalY + 17, totalBoxX + totalBoxW, finalY + 17);

    finalY += 26;

    // ===== CONDITIONS =====
    if (budget.delivery_time || budget.payment_terms || budget.valid_until) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text('CONDIÇÕES', margin, finalY);
      finalY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...dark);

      const cond: string[] = [];
      if (budget.delivery_time) cond.push(`Prazo de entrega:  ${budget.delivery_time}`);
      if (budget.payment_terms) cond.push(`Pagamento:  ${budget.payment_terms}`);
      if (budget.valid_until) {
        cond.push(`Válido até:  ${format(new Date(budget.valid_until), "dd/MM/yyyy", { locale: ptBR })}`);
      }
      cond.forEach((c) => {
        doc.text(c, margin, finalY);
        finalY += 5;
      });
      finalY += 4;
    }

    // ===== NOTES =====
    if (budget.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text('OBSERVAÇÕES', margin, finalY);
      finalY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      const noteLines = doc.splitTextToSize(budget.notes, pageWidth - margin * 2);
      doc.text(noteLines, margin, finalY);
    }

    // Save
    const fileName = `orcamento-${(budget.client_name || 'cliente').replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'ddMMyyyy')}.pdf`;
    doc.save(fileName);

    toast.success('PDF gerado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    toast.error('Erro ao gerar PDF. Tente novamente.');
  }
}
