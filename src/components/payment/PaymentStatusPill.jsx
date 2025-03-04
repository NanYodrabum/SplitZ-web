import React from 'react';
import { Check } from 'lucide-react';

function PaymentStatusPill({ status, onClick, onUndo, isProcessing, isCreator }) {
  // If this is a creator's payment, it's always paid and unchangeable
  if (isCreator) {
    return (
      <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
        <Check size={16} />
        Paid
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
        <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
        Updating...
      </div>
    );
  }

  // For completed payments, offer option to mark as unpaid
  if (status === 'completed') {
    return (
      <button
        onClick={onUndo}
        className="bg-green-100 hover:bg-green-200 px-4 py-1 rounded-full text-green-700 flex items-center gap-1 group"
      >
        <Check size={16} />
        <span>Paid</span>
        <span className="hidden group-hover:inline ml-1 text-xs">(Undo)</span>
      </button>
    );
  }

  // For pending payments, offer option to mark as paid
  return (
    <button
      onClick={onClick}
      className="bg-orange-100 hover:bg-orange-200 px-4 py-1 rounded-full text-orange-700 flex items-center gap-1"
    >
      Mark as Paid
    </button>
  );
}

export default PaymentStatusPill;