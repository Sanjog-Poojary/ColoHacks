import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, Printer } from 'lucide-react';

interface MonthlyExportButtonProps {
  monthName: string;
  entries: any[];
  shopName: string;
}

export default function MonthlyExportButton({ monthName, entries, shopName }: MonthlyExportButtonProps) {
  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Branding & Header
    doc.setFillColor(0, 128, 128); // Teal
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 240); // Ivory
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VyapaarVaani', 14, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Monthly Financial Statement', 14, 25);
    doc.text(monthName.toUpperCase(), 14, 32);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(shopName, pageWidth - 14, 25, { align: 'right' });
    doc.setFontSize(8);
    doc.text('Generated on ' + new Date().toLocaleDateString(), pageWidth - 14, 32, { align: 'right' });

    // 2. Summary Stats
    let totalSales = 0;
    let totalItems = 0;
    
    entries.forEach(e => {
        totalSales += (e.ledger_entry?.earnings || 0);
        totalItems += (e.ledger_entry?.items_sold?.length || 0);
    });

    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Summary', 14, 55);
    
    doc.setDrawColor(0, 128, 128);
    doc.setLineWidth(0.5);
    doc.line(14, 58, 40, 58);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Revenue: Rs. ${totalSales.toLocaleString('en-IN')}`, 14, 68);
    doc.text(`Total Transactions: ${entries.length}`, 14, 75);
    doc.text(`Total Items Handled: ${totalItems}`, 14, 82);

    // 3. Detailed Transaction Table
    const tableData: any[] = [];
    
    // Sort entries by date ascending for the report
    const sortedEntries = [...entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sortedEntries.forEach(entry => {
        const date = new Date(entry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const items = entry.ledger_entry?.items_sold?.map((it: any) => it.name).join(', ') || 'No items';
        const revenue = entry.ledger_entry?.earnings || 0;
        
        tableData.push([
            date,
            items.length > 50 ? items.substring(0, 47) + '...' : items,
            `Rs. ${revenue.toLocaleString('en-IN')}`
        ]);
    });

    autoTable(doc, {
      startY: 95,
      head: [['Date', 'Description / Items', 'Revenue']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [0, 128, 128],
        fontSize: 10,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25 },
        2: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    // 4. Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('This is a computer-generated statement compatible with PM SVANidhi loan applications.', 14, finalY + 20);
    doc.text('Thank you for using VyapaarVaani for your business growth.', 14, finalY + 25);

    doc.save(`VyapaarVaani_${shopName.replace(/\s+/g, '_')}_${monthName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); exportPDF(); }}
      className='flex items-center gap-2 bg-white/80 hover:bg-[#008080] hover:text-white px-4 py-2 rounded-xl text-[#008080] font-black transition-all border border-[#008080]/20 shadow-sm text-xs uppercase tracking-tighter'
    >
      <Printer size={14} />
      <span>Export {monthName} PDF</span>
    </button>
  );
}
