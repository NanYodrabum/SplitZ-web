import React, { useState } from 'react';
import { Plus, Trash2, Calculator, Receipt } from 'lucide-react';

const Bill = () => {
  // State for bill details
  const [billName, setBillName] = useState('');
  const [billCategory, setBillCategory] = useState('dining');
  const [billDescription, setBillDescription] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for participants
  const [participants, setParticipants] = useState([
    { id: 1, name: 'You' }
  ]);
  
  // State for bill items
  const [billItems, setBillItems] = useState([
    {
      id: 1,
      name: '',
      basePrice: '',
      taxPercent: 7,
      serviceChargePercent: 10,
      splitWith: [1] // Default to first participant (You)
    }
  ]);

  // Add a new participant
  const addParticipant = () => {
    const newId = participants.length > 0 
      ? Math.max(...participants.map(p => p.id)) + 1 
      : 1;
    
    setParticipants([
      ...participants,
      { id: newId, name: '' }
    ]);
  };

  // Remove a participant
  const removeParticipant = (id) => {
    // Don't allow removing all participants
    if (participants.length <= 1) return;
    
    setParticipants(participants.filter(p => p.id !== id));
    
    // Also remove this participant from all bill item splits
    setBillItems(billItems.map(item => ({
      ...item,
      splitWith: item.splitWith.filter(participantId => participantId !== id)
    })));
  };

  // Update participant name
  const updateParticipantName = (id, name) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, name } : p
    ));
  };

  // Add a new bill item
  const addBillItem = () => {
    const newId = billItems.length > 0 
      ? Math.max(...billItems.map(item => item.id)) + 1 
      : 1;
    
    setBillItems([
      ...billItems,
      {
        id: newId,
        name: '',
        basePrice: '',
        taxPercent: 7,
        serviceChargePercent: 10,
        splitWith: [1] // Default to first participant (You)
      }
    ]);
  };

  // Remove a bill item
  const removeBillItem = (id) => {
    // Don't allow removing all items
    if (billItems.length <= 1) return;
    
    setBillItems(billItems.filter(item => item.id !== id));
  };

  // Update bill item field
  const updateBillItem = (id, field, value) => {
    setBillItems(billItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Toggle participant in item split
  const toggleParticipantInSplit = (itemId, participantId) => {
    setBillItems(billItems.map(item => {
      if (item.id !== itemId) return item;
      
      const newSplitWith = item.splitWith.includes(participantId)
        ? item.splitWith.filter(id => id !== participantId)
        : [...item.splitWith, participantId];
      
      // Don't allow empty splits
      if (newSplitWith.length === 0) {
        return item;
      }
      
      return {
        ...item,
        splitWith: newSplitWith
      };
    }));
  };

  // Calculate item total (base + tax + service)
  const calculateItemTotal = (item) => {
    const base = parseFloat(item.basePrice) || 0;
    const tax = (base * (parseFloat(item.taxPercent) || 0)) / 100;
    const serviceCharge = (base * (parseFloat(item.serviceChargePercent) || 0)) / 100;
    return base + tax + serviceCharge;
  };

  // Calculate bill grand total
  const getGrandTotal = () => {
    return billItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // Calculate amount per participant for an item
  const getAmountPerParticipant = (item) => {
    const total = calculateItemTotal(item);
    return total / item.splitWith.length;
  };

  // Calculate summary of what each participant owes
  const getParticipantSummary = () => {
    const summary = {};
    
    // Initialize summary with zero for each participant
    participants.forEach(participant => {
      summary[participant.id] = {
        name: participant.name || `Person ${participant.id}`,
        amount: 0
      };
    });
    
    // Add up each participant's share from all items
    billItems.forEach(item => {
      const amountPerPerson = getAmountPerParticipant(item);
      
      item.splitWith.forEach(participantId => {
        if (summary[participantId]) {
          summary[participantId].amount += amountPerPerson;
        }
      });
    });
    
    return Object.values(summary);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b mb-6">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold">Create New Bill</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bill Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Bill Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bill Name</label>
                  <input 
                    type="text"
                    placeholder="e.g., Dinner with friends"
                    className="w-full p-3 border rounded-lg"
                    value={billName}
                    onChange={(e) => setBillName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={billCategory}
                    onChange={(e) => setBillCategory(e.target.value)}
                  >
                    <option value="dining">Dining</option>
                    <option value="shopping">Shopping</option>
                    <option value="travel">Travel</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="utilities">Utilities</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Add any notes about this bill"
                    className="w-full p-3 border rounded-lg"
                    rows="2"
                    value={billDescription}
                    onChange={(e) => setBillDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input 
                    type="date"
                    className="w-full p-3 border rounded-lg"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Participants</h2>
              
              <div className="space-y-3 mb-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Person ${participant.id}`}
                      className="flex-1 p-3 border rounded-lg"
                      value={participant.name}
                      onChange={(e) => updateParticipantName(participant.id, e.target.value)}
                    />
                    <button 
                      className="text-red-500 hover:text-red-700 p-2"
                      onClick={() => removeParticipant(participant.id)}
                      disabled={participants.length <= 1}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
              
              <button 
                className="text-blue-600 flex items-center gap-1"
                onClick={addParticipant}
              >
                <Plus size={18} /> Add Participant
              </button>
            </div>

            {/* Bill Items */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold px-1">Bill Items</h2>
              
              {billItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium">Item {item.id}</h3>
                    <button 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeBillItem(item.id)}
                      disabled={billItems.length <= 1}
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
                            (${((parseFloat(item.basePrice) || 0) * (parseFloat(item.taxPercent) || 0) / 100).toFixed(2)})
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
                            (${((parseFloat(item.basePrice) || 0) * (parseFloat(item.serviceChargePercent) || 0) / 100).toFixed(2)})
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
                                item.splitWith.includes(participant.id)
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                              onClick={() => toggleParticipantInSplit(item.id, participant.id)}
                            >
                              {participant.name || `Person ${participant.id}`}
                            </button>
                          ))}
                        </div>
                        
                        {item.splitWith.length > 0 && (
                          <p className="text-sm text-gray-500">
                            ${getAmountPerParticipant(item).toFixed(2)} per person
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Item Total:</span>
                        <span className="font-medium">${calculateItemTotal(item).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2"
                onClick={addBillItem}
              >
                <Plus size={20} />
                Add Another Item
              </button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6 lg:sticky lg:top-6">
              <div className="flex items-center gap-2 mb-4">
                <Receipt size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold">Bill Summary</h2>
              </div>
              
              <div className="space-y-4">
                {billItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name || `Item ${item.id}`}</span>
                    <span>${calculateItemTotal(item).toFixed(2)}</span>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total Amount</span>
                    <span>${getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Each Person Pays</h3>
                <div className="space-y-2">
                  {getParticipantSummary().map((summary) => (
                    <div key={summary.name} className="flex justify-between text-sm">
                      <span>{summary.name}</span>
                      <span className="font-medium">${summary.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700">
                Save Bill
              </button>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Calculator className="text-blue-600" />
                <p className="text-sm text-blue-600">
                  Tax and service charge are calculated per item for more accurate splitting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bill;