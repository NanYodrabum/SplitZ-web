import React from 'react';
import BillSummary from './BillSummary';
import ParticipantsSummary from './ParticipantsSummary';
import PaymentDetail from './PaymentDetail';

function BillDetails({ 
  bill, 
  calculateItemTotal, 
  getParticipantSummary, 
  isProcessing, 
  updatePaymentStatus, 
  onViewBillDetails 
}) {
  return (
    <div className="border-t bg-white">
      {/* Bill Summary Section */}
      <BillSummary 
        bill={bill} 
        calculateItemTotal={calculateItemTotal} 
      />
    
      <h3 className="text-lg font-medium mb-4 px-4">Payment Details</h3>

      {bill.paymentSummary ? (
        <div className="space-y-4 px-4 mb-4">
          {bill.paymentSummary.participants?.map((participant) => (
            <PaymentDetail 
              key={participant.id}
              participant={participant}
              bill={bill}
              isProcessing={isProcessing}
              updatePaymentStatus={updatePaymentStatus}
            />
          ))}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-center">Loading payment details...</p>
        </div>
      )}

      <div className="flex justify-end mt-6 mb-6 px-4">
        <button
          onClick={onViewBillDetails}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          View Bill Details
        </button>
      </div>
    </div>
  );
}

export default BillDetails;