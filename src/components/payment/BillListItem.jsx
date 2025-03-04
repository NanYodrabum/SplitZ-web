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
      <div className="border rounded-lg overflow-hidden" id={`bill-${bill.id}`}>
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