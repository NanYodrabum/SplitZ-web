import React from 'react';
import { Trash2 } from 'lucide-react';

function BillItemForm({ 
  item, 
  participants,
  itemIndex,
  updateBillItem, 
  removeBillItem,
  toggleParticipantInSplit,
  getAmountPerParticipant,
  calculateTaxAmount,
  calculateServiceAmount,
  calculateItemTotal,
  disableRemove
}) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-medium">Item {itemIndex + 1}</h3>
        <button
          className="text-red-500 hover:text-red-700"
          onClick={() => removeBillItem(item.id)}
          disabled={disableRemove}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Item Name and Base Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Item Name</label>
            <input
              type="text"
              placeholder="What did you buy?"
              className="w-full p-3 border rounded-lg"
              value={item.name}
              onChange={(e) => updateBillItem(item.id, 'name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Base Price</label>
            <input
              type="number"
              placeholder="0.00"
              className="w-full p-3 border rounded-lg"
              value={item.basePrice}
              onChange={(e) => updateBillItem(item.id, 'basePrice', e.target.value)}
            />
          </div>
        </div>

        {/* Tax and Service Charge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tax (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full p-3 border rounded-lg"
                value={item.taxPercent}
                onChange={(e) => updateBillItem(item.id, 'taxPercent', e.target.value)}
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">
                (${calculateTaxAmount(item.basePrice, item.taxPercent)})
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Service Charge (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full p-3 border rounded-lg"
                value={item.serviceChargePercent}
                onChange={(e) => updateBillItem(item.id, 'serviceChargePercent', e.target.value)}
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">
                (${calculateServiceAmount(item.basePrice, item.serviceChargePercent)})
              </span>
            </div>
          </div>
        </div>

        {/* Split With */}
        <div>
          <label className="block text-sm font-medium mb-2">Split with</label>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex flex-wrap gap-2 mb-2">
              {participants.map(participant => (
                <button
                  key={participant.id}
                  className={`px-3 py-1 rounded-full text-sm ${
                    item.splitWith?.includes(participant.id)
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                    }`}
                  onClick={() => toggleParticipantInSplit(item.id, participant.id)}
                >
                  {participant.name || `Person ${participant.id}`}
                </button>
              ))}
            </div>
            
            {item.splitWith?.length > 0 && (
              <p className="text-sm text-gray-500">
                ${getAmountPerParticipant(item)} per person
              </p>
            )}
          </div>
        </div>

        {/* Item Total */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Item Total:</span>
            <span className="font-medium">${calculateItemTotal(item)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillItemForm;