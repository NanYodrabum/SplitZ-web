import React from 'react';
import BillItem from './BillItem';
import BillDetails from './BillDetails';

function BillListItem({ 
  bill, 
  expandedBill, 
  onToggleExpand, 
  formatDate, 
  getCategoryIcon, 
  getPaymentStatusBadge,
  calculateItemTotal,
  getParticipantSummary,
  isProcessing,
  updatePaymentStatus,
  onViewBillDetails
}) {
  return (
    <div className="border rounded-xl overflow-hidden" id={`bill-${bill.id}`}>
      {/* Bill Header */}
      <BillItem 
        bill={bill} 
        isExpanded={expandedBill === bill.id}
        onToggleExpand={() => onToggleExpand(bill.id)}
        formatDate={formatDate}
        getCategoryIcon={getCategoryIcon}
        getPaymentStatusBadge={getPaymentStatusBadge}
      />

      {/* Expanded Bill Details */}
      {expandedBill === bill.id && (
        <BillDetails 
          bill={bill}
          calculateItemTotal={calculateItemTotal}
          getParticipantSummary={getParticipantSummary}
          isProcessing={isProcessing}
          updatePaymentStatus={updatePaymentStatus}
          onViewBillDetails={() => onViewBillDetails(bill.id)}
        />
      )}
    </div>
  );
}

export default BillListItem;