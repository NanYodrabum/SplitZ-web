import React from 'react';
import { Clock, User, Edit, Trash2 } from 'lucide-react';

function BillHeader({ bill, formatDate, getCategoryIcon, isCreator, onEditBill, onDeleteBill }) {
  return (
    <div className="bg-white rounded-xl border p-6 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {getCategoryIcon(bill.category)}
            <h1 className="text-2xl font-bold">{bill.name}</h1>
          </div>
          {bill.description && (
            <p className="text-gray-600 mb-3">{bill.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{formatDate(bill.date || bill.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <User size={16} />
              <span>Created by {bill.creator?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm">Total Amount</p>
          <p className="text-3xl font-bold">${Math.round(parseFloat(bill.totalAmount || 0))}</p>
        </div>
      </div>

      {/* Action buttons - Only show if user is creator */}
      {isCreator && (
        <div className="flex gap-3 mt-4 justify-end">
          <button
            onClick={onEditBill}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit size={16} />
            Edit Bill
          </button>
          <button
            onClick={onDeleteBill}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 size={16} />
            Delete Bill
          </button>
        </div>
      )}
    </div>
  );
}

export default BillHeader;
