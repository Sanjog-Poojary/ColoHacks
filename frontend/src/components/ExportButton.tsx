import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown } from 'lucide-react';

export default function ExportButton({ data }: { data: any }) {
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(26);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('VyapaarVaani Income Statement', 14, 22);
    doc.setFontSize(10);
    doc.text('Date: ' + new Date().toLocaleDateString(), 14, 30);
    
    const tableData = data.ledger_entry.items_sold.map((it: any) => [
      it.name, it.qty, 'Rs. ' + it.price, 'Rs. ' + (it.qty * it.price)
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 128, 128] } // Teal signature
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(14);
    doc.text('Total Earnings: Rs. ' + data.ledger_entry.earnings, 14, finalY + 15);

    doc.save('VyapaarVaani_Ledger_' + new Date().getTime() + '.pdf');
  };

  return (
    <button 
      onClick={exportPDF} 
      className='flex items-center gap-2 bg-[#008080] hover:bg-[#006666] px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[#FFFFF0] font-bold transition-all shadow-lg shadow-[#008080]/20 text-xs md:text-sm'
    >
      <FileDown size={18} /> <span className='hidden sm:inline'>Export PDF</span>
    </button>
  );
}
