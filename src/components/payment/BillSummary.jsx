import React from 'react';
import { Receipt } from 'lucide-react';

function BillSummary({ bill, calculateItemTotal }) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Bill Summary</h3>

      {bill.paymentSummary?.items && (
        <div className="space-y-4 mb-4">
          {/* Items Summary */}
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium mb-3">Items</h4>
            <div className="space-y-2 mb-4">
              {bill.paymentSummary.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-medium">${Math.round(item.totalAmount || 0)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Amount</span>
                <span>${Math.round(bill.totalAmount || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillSummary;