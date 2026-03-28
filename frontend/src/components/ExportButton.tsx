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
      it.name, it.qty, '₹' + it.price, '₹' + (it.qty * it.price)
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(14);
    doc.text('Total Earnings: ₹' + data.ledger_entry.earnings, 14, finalY + 15);

    doc.save('VyapaarVaani_Ledger_' + new Date().getTime() + '.pdf');
  };

  return (
    <button 
      onClick={exportPDF} 
      className='flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-lg shadow-blue-500/20'
    >
      <FileDown size={18} /> Export PDF
    </button>
  );
}
