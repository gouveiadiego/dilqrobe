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
    const margin = 15;
    
    // Elegant color palette
    const primaryColor: [number, number, number] = [79, 70, 229];
    const secondaryColor: [number, number, number] = [71, 85, 105];
    const lightGray: [number, number, number] = [248, 250, 252];
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', pageWidth / 2, 20, { align: 'center' });
    
    let yPosition = 40;
    
    // Budget info
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const budgetNumber = `Nº ${budget.id.substring(0, 8).toUpperCase()}`;
    const createdDate = format(new Date(budget.created_at), "dd/MM/yyyy", { locale: ptBR });
    doc.text(budgetNumber, margin, yPosition);
    doc.text(`Data: ${createdDate}`, pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 10;
    
    // Company Information (compact)
    if (budget.company_name) {
      doc.setFillColor(...lightGray);
      doc.rect(margin, yPosition - 3, pageWidth - margin * 2, 22, 'F');
      
      doc.setTextColor(...primaryColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPRESA', margin + 3, yPosition + 4);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      let companyInfo = budget.company_name;
      if (budget.company_document) companyInfo += ` | CNPJ: ${budget.company_document}`;
      doc.text(companyInfo, margin + 3, yPosition + 12);
      
      if (budget.company_phone || budget.company_address) {
        let contactInfo = '';
        if (budget.company_phone) contactInfo += budget.company_phone;
        if (budget.company_address) contactInfo += (contactInfo ? ' | ' : '') + budget.company_address;
        doc.text(contactInfo.substring(0, 100), margin + 3, yPosition + 18);
      }
      
      yPosition += 28;
    }
    
    // Client Information (compact)
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPosition - 3, pageWidth - margin * 2, 22, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', margin + 3, yPosition + 4);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    let clientInfo = budget.client_name;
    if (budget.client_document) clientInfo += ` | Doc: ${budget.client_document}`;
    doc.text(clientInfo, margin + 3, yPosition + 12);
    
    let clientContact = '';
    if (budget.client_email) clientContact += budget.client_email;
    if (budget.client_phone) clientContact += (clientContact ? ' | ' : '') + budget.client_phone;
    if (clientContact) doc.text(clientContact.substring(0, 100), margin + 3, yPosition + 18);
    
    yPosition += 30;
    
    // Items section
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ITENS DO ORÇAMENTO', margin, yPosition);
    yPosition += 5;
    
    // Table with items
    const tableData = budget.items.map(item => [
      item.description.substring(0, 50) + (item.description.length > 50 ? '...' : ''),
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
        fontSize: 9,
        halign: 'center',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 51, 51],
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 85, halign: 'left' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      styles: {
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        overflow: 'linebreak'
      },
      didDrawPage: function(data: any) {
        // Footer on each page
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });
    
    let finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
    
    // Check if we need a new page for totals and conditions
    const remainingSpace = pageHeight - finalY;
    const neededSpace = 80; // Space needed for total + conditions
    
    if (remainingSpace < neededSpace) {
      doc.addPage();
      finalY = 20;
    }
    
    // Total box
    finalY += 8;
    doc.setFillColor(...primaryColor);
    doc.roundedRect(pageWidth - margin - 70, finalY, 70, 20, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR TOTAL', pageWidth - margin - 35, finalY + 8, { align: 'center' });
    doc.setFontSize(12);
    doc.text(formatCurrency(budget.total_amount), pageWidth - margin - 35, finalY + 16, { align: 'center' });
    
    finalY += 28;
    
    // Commercial conditions (compact)
    if (budget.delivery_time || budget.payment_terms || budget.valid_until) {
      doc.setFillColor(...lightGray);
      doc.rect(margin, finalY, pageWidth - margin * 2, 25, 'F');
      
      doc.setTextColor(...primaryColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CONDIÇÕES', margin + 3, finalY + 6);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      let condY = finalY + 13;
      const conditions: string[] = [];
      
      if (budget.delivery_time) conditions.push(`Prazo: ${budget.delivery_time}`);
      if (budget.payment_terms) conditions.push(`Pagamento: ${budget.payment_terms}`);
      if (budget.valid_until) {
        const validDate = format(new Date(budget.valid_until), "dd/MM/yyyy", { locale: ptBR });
        conditions.push(`Válido até: ${validDate}`);
      }
      
      doc.text(conditions.join('  |  '), margin + 3, condY);
      
      finalY += 30;
    }
    
    // Notes (compact)
    if (budget.notes) {
      doc.setTextColor(...primaryColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES', margin, finalY);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      const noteLines = doc.splitTextToSize(budget.notes, pageWidth - margin * 2);
      doc.text(noteLines.slice(0, 3), margin, finalY + 7);
    }
    
    // Footer
    doc.setFillColor(...primaryColor);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
    
    // Save
    const fileName = `orcamento-${budget.client_name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'ddMMyyyy')}.pdf`;
    doc.save(fileName);
    
    toast.success('PDF gerado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    toast.error('Erro ao gerar PDF. Tente novamente.');
  }
}
