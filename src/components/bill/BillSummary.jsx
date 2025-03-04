import React from 'react';
import { Receipt, User, Calculator, Save } from 'lucide-react';

function BillSummary({ 
  billItems, 
  calculateItemTotal, 
  getGrandTotal, 
  getParticipantSummary,
  onSave,
  isSubmitting,
  submitButtonText = "Save Bill",
  showCalculationNote = true
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6 lg:sticky lg:top-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold">Bill Summary</h2>
        </div>

        <div className="space-y-4">
          {billItems.map((item, index) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name || `Item ${index + 1}`}</span>
              <span>${calculateItemTotal(item)}</span>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <div className="flex justify-between font-medium">
              <span>Total Amount</span>
              <span>${getGrandTotal()}</span>
            </div>
          </div>
        </div>
        
        {/* Each Person Pays Section */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-medium mb-3">Each Person Pays</h3>
          <div className="space-y-3">
            {getParticipantSummary().map((summary) => (
              <div key={summary.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <span className="font-medium">{summary.name}</span>
                      {summary.isCreator && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                          Creator
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold">${summary.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={onSave}
          className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (
            <>
              <Save size={18} />
              {submitButtonText}
            </>
          )}
        </button>
      </div>

      {showCalculationNote && (
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Calculator className="text-blue-600" />
            <p className="text-sm text-blue-600">
              Tax and service charge are calculated per item for more accurate splitting. All values are rounded to the nearest whole number.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillSummary;