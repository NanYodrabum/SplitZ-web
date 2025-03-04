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
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">Bill Summary</h3>

        {bill.paymentSummary?.items && (
          <div className="space-y-4 mb-4">
            {/* Items Summary */}
            <BillSummary 
              bill={bill} 
              calculateItemTotal={calculateItemTotal} 
            />

            {/* Each Person Pays Section */}
            <ParticipantsSummary 
              bill={bill}
              getParticipantSummary={getParticipantSummary}
            />
          </div>
        )}
    
        <h3 className="text-lg font-medium mb-4">Payment Details</h3>

        {bill.paymentSummary ? (
          <div className="space-y-4 mb-4">
            {bill.paymentSummary.participants?.map((participant) => {
              // Skip showing the creator if they are the current user
              if (participant.isCreator && participant.userId === bill.userId) {
                return null;
              }

              return (
                <PaymentDetail 
                  key={participant.id}
                  participant={participant}
                  bill={bill}
                  isProcessing={isProcessing}
                  updatePaymentStatus={updatePaymentStatus}
                />
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-center">Loading payment details...</p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onViewBillDetails}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            View Bill Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillDetails;