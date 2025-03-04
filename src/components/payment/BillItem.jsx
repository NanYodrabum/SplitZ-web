import React from 'react';
import { Receipt, User, Clock, ChevronDown, ChevronUp, DollarSign, Tag, ArrowLeftRight } from 'lucide-react';

function BillItem({ 
  bill, 
  isExpanded, 
  onToggleExpand, 
  formatDate, 
  getCategoryIcon, 
  getPaymentStatusBadge 
}) {
  return (
    <div
      className="p-4 bg-white flex justify-between items-center cursor-pointer hover:bg-gray-50"
      onClick={onToggleExpand}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          {getCategoryIcon(bill.category)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{bill.name}</h2>
            {bill.paymentSummary && getPaymentStatusBadge(bill)}
          </div>
          <p className="text-sm text-gray-500">
            {bill.description || `with ${bill.participants?.find(p => !p.isCreator)?.name || 'friends'}`}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{formatDate(bill.date || bill.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{bill.participants?.length || 0} participants</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="font-bold text-lg">${Math.round(bill.totalAmount || 0)}</p>

        {/* Payment summary */}
        {bill.paymentSummary && (
          <div className="flex flex-col items-end text-xs">
            {bill.paymentSummary.totalPaid > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <span>${bill.paymentSummary.totalPaid || 0} paid</span>
              </div>
            )}
            {bill.paymentSummary.totalPending > 0 && (
              <div className="flex items-center gap-1 text-orange-600">
                <span>${bill.paymentSummary.totalPending} pending</span>
              </div>
            )}
          </div>
        )}

        <div>
          {isExpanded ? (
            <ChevronUp size={20} className="ml-auto text-gray-400" />
          ) : (
            <ChevronDown size={20} className="ml-auto text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

export default BillItem;