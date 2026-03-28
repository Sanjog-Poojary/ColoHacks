import React from 'react';
import { Tag, DollarSign, AlertCircle } from 'lucide-react';

export default function LedgerCard({ data }: { data: any }) {
  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border border-gray-100 max-w-md w-full'>
      <h3 className='text-xl font-bold mb-4 flex items-center gap-2'>
        <Tag className='text-blue-500' /> Ledger Entry
      </h3>
      <div className='space-y-4'>
        <div>
          <p className='text-sm text-gray-500'>Earnings</p>
          <p className='text-2xl font-bold text-green-600 font-mono'>₹{data.ledger_entry.earnings || 0}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-2'>Items Sold</p>
          {data.ledger_entry.items_sold.map((item: any, i: number) => (
            <div key={i} className='flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-1'>
              <span>{item.name}</span>
              <span className='font-mono'>{item.qty} x ₹{item.price}</span>
            </div>
          ))}
        </div>
        {data.ledger_entry.flags.length > 0 && (
          <div className='bg-amber-50 p-3 rounded-xl border border-amber-100'>
            <p className='text-amber-700 text-sm font-bold flex items-center gap-1 mb-2'>
              <AlertCircle size={16} /> Data Flags
            </p>
            {data.ledger_entry.flags.map((flag: any, i: number) => (
              <p key={i} className='text-xs text-amber-800'>• {flag.reason} ({flag.field})</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}