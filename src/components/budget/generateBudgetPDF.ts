import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { Budget } from "./types";
import { toast } from "sonner";

export function generateBudgetPDF(budget: Budget) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Elegant color palette
    const primaryColor = [79, 70, 229]; // Indigo
    const secondaryColor = [71, 85, 105]; // Slate
    const accentColor = [236, 254, 255]; // Light cyan
    const lightGray = [248, 250, 252];
    
    // Professional header with subtle gradient effect
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', pageWidth / 2, 25, { align: 'center' });
    
    // Elegant accent line
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 40, pageWidth, 1, 'F');
    
    let yPosition = 55;
    
    // Budget info header
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const budgetNumber = `Nº ${budget.id.substring(0, 8).toUpperCase()}`;
    const createdDate = format(new Date(budget.created_at), "dd/MM/yyyy", { locale: ptBR });
    doc.text(budgetNumber, 20, yPosition);
    doc.text(`Data: ${createdDate}`, pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 15;
    
    // Company Information Section (if exists)
    if (budget.company_name || budget.company_document || budget.company_address || budget.company_phone) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      const companyBoxHeight = 45;
      doc.rect(20, yPosition - 5, pageWidth - 40, companyBoxHeight, 'F');
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DA EMPRESA', 25, yPosition + 5);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let companyY = yPosition + 15;
      
      if (budget.company_name) {
        doc.setFont('helvetica', 'bold');
        doc.text(budget.company_name, 25, companyY);
        companyY += 6;
        doc.setFont('helvetica', 'normal');
      }
      
      if (budget.company_document) {
        doc.text(`CNPJ: ${budget.company_document}`, 25, companyY);
        companyY += 5;
      }
      
      if (budget.company_address) {
        doc.text(`Endereço: ${budget.company_address}`, 25, companyY);
        companyY += 5;
      }
      
      if (budget.company_phone) {
        doc.text(`Telefone: ${budget.company_phone}`, 25, companyY);
      }
      
      yPosition += companyBoxHeight + 10;
    }
    
    // Client Information Section
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    const clientBoxHeight = 50;
    doc.rect(20, yPosition - 5, pageWidth - 40, clientBoxHeight, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', 25, yPosition + 5);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let clientY = yPosition + 15;
    
    doc.setFont('helvetica', 'bold');
    doc.text(budget.client_name, 25, clientY);
    clientY += 6;
    doc.setFont('helvetica', 'normal');
    
    if (budget.client_document) {
      doc.text(`Documento: ${budget.client_document}`, 25, clientY);
      clientY += 5;
    }
    
    if (budget.client_email) {
      doc.text(`Email: ${budget.client_email}`, 25, clientY);
      clientY += 5;
    }
    
    if (budget.client_phone) {
      doc.text(`Telefone: ${budget.client_phone}`, 25, clientY);
      clientY += 5;
    }
    
    if (budget.client_address) {
      doc.text(`Endereço: ${budget.client_address}`, 25, clientY);
    }
    
    yPosition += clientBoxHeight + 15;
    
    // Items section header
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ITENS DO ORÇAMENTO', 25, yPosition);
    yPosition += 10;
    
    // Professional table
    const tableData = budget.items.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total)
    ]);
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [['Descrição', 'Qtd', 'Valor Unit.', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 51, 51]
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 90, halign: 'left' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 },
      styles: {
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
    
    // Total section with elegant styling
    const totalBoxY = finalY + 15;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(pageWidth - 90, totalBoxY, 70, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR TOTAL', pageWidth - 55, totalBoxY + 10, { align: 'center' });
    doc.setFontSize(16);
    doc.text(formatCurrency(budget.total_amount), pageWidth - 55, totalBoxY + 20, { align: 'center' });
    
    let infoY = totalBoxY + 40;
    
    // Terms and conditions section
    if (budget.delivery_time || budget.payment_terms || budget.valid_until) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      const termsHeight = 35;
      doc.rect(20, infoY - 5, pageWidth - 40, termsHeight, 'F');
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CONDIÇÕES COMERCIAIS', 25, infoY + 5);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      let conditionY = infoY + 15;
      
      if (budget.delivery_time) {
        doc.text(`• Prazo de Entrega: ${budget.delivery_time}`, 25, conditionY);
        conditionY += 6;
      }
      
      if (budget.payment_terms) {
        doc.text(`• Condições de Pagamento: ${budget.payment_terms}`, 25, conditionY);
        conditionY += 6;
      }
      
      if (budget.valid_until) {
        const validDate = format(new Date(budget.valid_until), "dd/MM/yyyy", { locale: ptBR });
        doc.text(`• Proposta válida até: ${validDate}`, 25, conditionY);
      }
      
      infoY += termsHeight + 10;
    }
    
    // Notes section
    if (budget.notes) {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES', 25, infoY);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const noteLines = doc.splitTextToSize(budget.notes, pageWidth - 50);
      doc.text(noteLines, 25, infoY + 10);
      infoY += noteLines.length * 4 + 20;
    }
    
    // Professional footer
    if (infoY < pageHeight - 40) {
      const footerY = pageHeight - 25;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, footerY, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Orçamento gerado automaticamente', pageWidth / 2, footerY + 10, { align: 'center' });
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, footerY + 17, { align: 'center' });
    }
    
    // Save with professional filename
    const fileName = `orcamento-${budget.client_name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'ddMMyyyy')}.pdf`;
    doc.save(fileName);
    
    toast.success('PDF gerado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    toast.error('Erro ao gerar PDF. Tente novamente.');
  }
}
