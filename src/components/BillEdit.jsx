import React, { useState, useEffect } from 'react';
import { ArrowRight, Receipt, User, Trash2, Calculator, Plus, Save } from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

function BillEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useUserStore();
  
  // Bill details state
  const [billName, setBillName] = useState('');
  const [billCategory, setBillCategory] = useState('dining');
  const [billDescription, setBillDescription] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for participants - initialize after component mounts
  const [participants, setParticipants] = useState([]);
  
  // State for bill items
  const [billItems, setBillItems] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Define your API base URL
  const API_BASE_URL = 'http://localhost:8800';
  
  // Fetch bill details on component mount
  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get the bill details
        const response = await axios.get(`${API_BASE_URL}/bills/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data) {
          throw new Error('No bill data received');
        }
        
        const bill = response.data;
        
        // Check if user is the creator
        const isCreator = bill.creator?.id === user.id || bill.userId === user.id;
        if (!isCreator) {
          setError('You do not have permission to edit this bill');
          setLoading(false);
          return;
        }
        
        // Populate form with bill data
        setBillName(bill.name || '');
        setBillCategory(bill.category || 'dining');
        setBillDescription(bill.description || '');
        setBillDate(bill.date ? new Date(bill.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        
        // Set participants
        if (bill.participants && bill.participants.length > 0) {
          setParticipants(bill.participants.map(participant => ({
            id: participant.id,
            name: participant.name,
            userId: participant.userId,
            isCreator: participant.isCreator
          })));
        }
        
        // Set bill items
        if (bill.items && bill.items.length > 0) {
          setBillItems(bill.items.map(item => {
            // Get participant IDs who are part of this item's splits
            const splitParticipantIds = item.splits.map(split => split.participant.id);
            
            return {
              id: item.id,
              name: item.name,
              basePrice: item.basePrice,
              taxPercent: item.taxPercent,
              serviceChargePercent: item.servicePercent || 10,
              taxAmount: item.taxAmount,
              serviceAmount: item.serviceAmount,
              totalAmount: item.totalAmount,
              splitWith: splitParticipantIds
            };
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bill details:', err);
        setError(err.response?.data?.message || 'Failed to load bill details. Please try again.');
        setLoading(false);
      }
    };
    
    if (id && token) {
      fetchBillDetails();
    } else if (!id) {
      setError('Bill ID is missing. Please select a valid bill.');
      setLoading(false);
    }
  }, [id, token, user.id]);
  
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
    
    // Don't allow removing creator
    const participant = participants.find(p => p.id === id);
    if (participant && participant.isCreator) {
      setError("You cannot remove the bill creator");
      return;
    }
    
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
        splitWith: [participants[0]?.id] // Default to first participant
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
  
  // Calculate item total (base + tax + service) with rounding
  const calculateItemTotal = (item) => {
    const base = parseFloat(item.basePrice) || 0;
    const tax = (base * (parseFloat(item.taxPercent) || 0)) / 100;
    const serviceCharge = (base * (parseFloat(item.serviceChargePercent) || 0)) / 100;
    return Math.round(base + tax + serviceCharge);
  };
  
  // Calculate bill grand total with rounding
  const getGrandTotal = () => {
    return Math.round(billItems.reduce((sum, item) => sum + calculateItemTotal(item), 0));
  };
  
  // Calculate amount per participant for an item with rounding
  const getAmountPerParticipant = (item) => {
    const total = calculateItemTotal(item);
    return Math.round(total / (item.splitWith?.length || 1));
  };
  
  // Calculate tax amount for display with rounding
  const calculateTaxAmount = (basePrice, taxPercent) => {
    const base = parseFloat(basePrice) || 0;
    const taxRate = parseFloat(taxPercent) || 0;
    return Math.round((base * taxRate) / 100);
  };
  
  // Calculate service charge amount for display with rounding
  const calculateServiceAmount = (basePrice, servicePercent) => {
    const base = parseFloat(basePrice) || 0;
    const serviceRate = parseFloat(servicePercent) || 0;
    return Math.round((base * serviceRate) / 100);
  };
  
  // Calculate participant summary for "Each Person Pays" section
  const getParticipantSummary = () => {
    // Initialize summary for each participant
    const summary = {};
    
    participants.forEach(participant => {
      summary[participant.id] = {
        id: participant.id,
        name: participant.name || `Person ${participant.id}`,
        amount: 0,
        isCreator: participant.isCreator
      };
    });
    
    // Calculate each participant's share from all items
    billItems.forEach(item => {
      const amountPerPerson = getAmountPerParticipant(item);
      
      if (item.splitWith) {
        item.splitWith.forEach(participantId => {
          if (summary[participantId]) {
            summary[participantId].amount += amountPerPerson;
          }
        });
      }
    });
    
    return Object.values(summary);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Validate form
      if (!billName.trim()) {
        setError('Bill name is required');
        setSaving(false);
        return;
      }
      
      if (billItems.some(item => !item.name.trim() || !item.basePrice)) {
        setError('All bill items must have a name and price');
        setSaving(false);
        return;
      }
      
      // Calculate tax and service amounts for each item
      const processedItems = billItems.map(item => {
        const basePrice = parseFloat(item.basePrice) || 0;
        const taxPercent = parseFloat(item.taxPercent) || 0;
        const servicePercent = parseFloat(item.serviceChargePercent) || 0;
        
        const taxAmount = Math.round((basePrice * taxPercent) / 100);
        const serviceAmount = Math.round((basePrice * servicePercent) / 100);
        const totalAmount = Math.round(basePrice + taxAmount + serviceAmount);
        
        return {
          id: item.id,
          name: item.name,
          basePrice: Math.round(basePrice),
          taxPercent,
          taxAmount,
          servicePercent,
          serviceAmount,
          totalAmount,
          splitWith: item.splitWith // Pass the array of participant IDs
        };
      });
      
      // Prepare update data
      const updateData = {
        name: billName,
        description: billDescription,
        category: billCategory,
        date: billDate,
        totalAmount: getGrandTotal(),
        participants: participants.map(p => ({
          id: p.id,
          name: p.name || `Person ${p.id}`,
          userId: p.userId,
          isCreator: p.isCreator
        })),
        items: processedItems
      };
      
      // Send update to backend
      const response = await axios.patch(`${API_BASE_URL}/bills/${id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccess('Bill updated successfully!');
      
      // Navigate back to bill detail page after short delay
      setTimeout(() => {
        navigate(`/dashboard/bills/${id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating bill:', err);
      setError(err.response?.data?.error || 'Failed to update bill. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    navigate(`/dashboard/bills/${id}`);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (error && !billName) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => navigate('/dashboard/billlist')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Back to Bills
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b mb-6">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowRight className="rotate-180" size={20} />
            </button>
            <h1 className="text-xl font-semibold">Edit Bill</h1>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              disabled={saving}
            >
              {saving ? 'Saving...' : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6">
        {/* Display error if any */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {/* Display success message if any */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg text-green-700">
            {success}
          </div>
        )}
        
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
                    <option value="traveling">Travel</option>
                    <option value="hangout">Entertainment</option>
                    <option value="etc">Other</option>
                  </select>
                </div>
              </div>
              
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
                      disabled={participant.isCreator} // Creator can't be edited
                    />
                    <button
                      className={`text-red-500 hover:text-red-700 p-2 ${
                        participant.isCreator ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={() => removeParticipant(participant.id)}
                      disabled={participants.length <= 1 || participant.isCreator}
                      title={participant.isCreator ? "Can't remove creator" : "Remove participant"}
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
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
                disabled={saving}
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Calculator className="text-blue-600" />
                <p className="text-sm text-blue-600">
                  Tax and service charge are calculated per item for more accurate splitting. All values are rounded to the nearest whole number.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillEdit;

// import React, { useState, useEffect } from 'react';
// import { ArrowRight, Receipt, User, Trash2, Calculator, Plus, Save } from 'lucide-react';
// import axios from 'axios';
// import { useParams, useNavigate } from 'react-router';
// import useUserStore from '../stores/userStore';

// function BillEdit() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { token, user } = useUserStore();
  
//   // Bill details state
//   const [billName, setBillName] = useState('');
//   const [billCategory, setBillCategory] = useState('dining');
//   const [billDescription, setBillDescription] = useState('');
//   const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  
//   // State for participants - initialize after component mounts
//   const [participants, setParticipants] = useState([]);
  
//   // State for bill items
//   const [billItems, setBillItems] = useState([]);
  
//   // UI states
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
  
//   // Define your API base URL
//   const API_BASE_URL = 'http://localhost:8800';
  
//   // Fetch bill details on component mount
//   useEffect(() => {
//     const fetchBillDetails = async () => {
//       try {
//         setLoading(true);
//         setError('');
        
//         // Get the bill details
//         const response = await axios.get(`${API_BASE_URL}/bills/${id}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
        
//         if (!response.data) {
//           throw new Error('No bill data received');
//         }
        
//         const bill = response.data;
        
//         // Check if user is the creator
//         const isCreator = bill.creator?.id === user.id || bill.userId === user.id;
//         if (!isCreator) {
//           setError('You do not have permission to edit this bill');
//           setLoading(false);
//           return;
//         }
        
//         // Populate form with bill data
//         setBillName(bill.name || '');
//         setBillCategory(bill.category || 'dining');
//         setBillDescription(bill.description || '');
//         setBillDate(bill.date ? new Date(bill.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        
//         // Set participants
//         if (bill.participants && bill.participants.length > 0) {
//           setParticipants(bill.participants.map(participant => ({
//             id: participant.id,
//             name: participant.name,
//             userId: participant.userId,
//             isCreator: participant.isCreator
//           })));
//         }
        
//         // Set bill items
//         if (bill.items && bill.items.length > 0) {
//           setBillItems(bill.items.map(item => {
//             // Get participant IDs who are part of this item's splits
//             const splitParticipantIds = item.splits.map(split => split.participant.id);
            
//             return {
//               id: item.id,
//               name: item.name,
//               basePrice: item.basePrice,
//               taxPercent: item.taxPercent,
//               serviceChargePercent: item.servicePercent || 10,
//               taxAmount: item.taxAmount,
//               serviceAmount: item.serviceAmount,
//               totalAmount: item.totalAmount,
//               splitWith: splitParticipantIds
//             };
//           }));
//         }
        
//         setLoading(false);
//       } catch (err) {
//         console.error('Error fetching bill details:', err);
//         setError(err.response?.data?.message || 'Failed to load bill details. Please try again.');
//         setLoading(false);
//       }
//     };
    
//     if (id && token) {
//       fetchBillDetails();
//     } else if (!id) {
//       setError('Bill ID is missing. Please select a valid bill.');
//       setLoading(false);
//     }
//   }, [id, token, user.id]);
  
//   // Add a new participant
//   const addParticipant = () => {
//     const newId = participants.length > 0
//       ? Math.max(...participants.map(p => p.id)) + 1
//       : 1;
    
//     setParticipants([
//       ...participants,
//       { id: newId, name: '' }
//     ]);
//   };
  
//   // Remove a participant
//   const removeParticipant = (id) => {
//     // Don't allow removing all participants
//     if (participants.length <= 1) return;
    
//     // Don't allow removing creator
//     const participant = participants.find(p => p.id === id);
//     if (participant && participant.isCreator) {
//       setError("You cannot remove the bill creator");
//       return;
//     }
    
//     setParticipants(participants.filter(p => p.id !== id));
    
//     // Also remove this participant from all bill item splits
//     setBillItems(billItems.map(item => ({
//       ...item,
//       splitWith: item.splitWith.filter(participantId => participantId !== id)
//     })));
//   };
  
//   // Update participant name
//   const updateParticipantName = (id, name) => {
//     setParticipants(participants.map(p =>
//       p.id === id ? { ...p, name } : p
//     ));
//   };
  
//   // Add a new bill item
//   const addBillItem = () => {
//     const newId = billItems.length > 0
//       ? Math.max(...billItems.map(item => item.id)) + 1
//       : 1;
    
//     setBillItems([
//       ...billItems,
//       {
//         id: newId,
//         name: '',
//         basePrice: '',
//         taxPercent: 7,
//         serviceChargePercent: 10,
//         splitWith: [participants[0]?.id] // Default to first participant
//       }
//     ]);
//   };
  
//   // Remove a bill item
//   const removeBillItem = (id) => {
//     // Don't allow removing all items
//     if (billItems.length <= 1) return;
    
//     setBillItems(billItems.filter(item => item.id !== id));
//   };
  
//   // Update bill item field
//   const updateBillItem = (id, field, value) => {
//     setBillItems(billItems.map(item =>
//       item.id === id ? { ...item, [field]: value } : item
//     ));
//   };
  
//   // Toggle participant in item split
//   const toggleParticipantInSplit = (itemId, participantId) => {
//     setBillItems(billItems.map(item => {
//       if (item.id !== itemId) return item;
      
//       const newSplitWith = item.splitWith.includes(participantId)
//         ? item.splitWith.filter(id => id !== participantId)
//         : [...item.splitWith, participantId];
      
//       // Don't allow empty splits
//       if (newSplitWith.length === 0) {
//         return item;
//       }
      
//       return {
//         ...item,
//         splitWith: newSplitWith
//       };
//     }));
//   };
  
//   // Calculate item total (base + tax + service) with rounding
//   const calculateItemTotal = (item) => {
//     const base = parseFloat(item.basePrice) || 0;
//     const tax = (base * (parseFloat(item.taxPercent) || 0)) / 100;
//     const serviceCharge = (base * (parseFloat(item.serviceChargePercent) || 0)) / 100;
//     return Math.round(base + tax + serviceCharge);
//   };
  
//   // Calculate bill grand total with rounding
//   const getGrandTotal = () => {
//     return Math.round(billItems.reduce((sum, item) => sum + calculateItemTotal(item), 0));
//   };
  
//   // Calculate amount per participant for an item with rounding
//   const getAmountPerParticipant = (item) => {
//     const total = calculateItemTotal(item);
//     return Math.round(total / (item.splitWith?.length || 1));
//   };
  
//   // Calculate tax amount for display with rounding
//   const calculateTaxAmount = (basePrice, taxPercent) => {
//     const base = parseFloat(basePrice) || 0;
//     const taxRate = parseFloat(taxPercent) || 0;
//     return Math.round((base * taxRate) / 100);
//   };
  
//   // Calculate service charge amount for display with rounding
//   const calculateServiceAmount = (basePrice, servicePercent) => {
//     const base = parseFloat(basePrice) || 0;
//     const serviceRate = parseFloat(servicePercent) || 0;
//     return Math.round((base * serviceRate) / 100);
//   };
  
//   // Handle form submission
//   const handleSubmit = async () => {
//     try {
//       setSaving(true);
//       setError('');
//       setSuccess('');
      
//       // Validate form
//       if (!billName.trim()) {
//         setError('Bill name is required');
//         setSaving(false);
//         return;
//       }
      
//       if (billItems.some(item => !item.name.trim() || !item.basePrice)) {
//         setError('All bill items must have a name and price');
//         setSaving(false);
//         return;
//       }
      
//       // Calculate tax and service amounts for each item
//       const processedItems = billItems.map(item => {
//         const basePrice = parseFloat(item.basePrice) || 0;
//         const taxPercent = parseFloat(item.taxPercent) || 0;
//         const servicePercent = parseFloat(item.serviceChargePercent) || 0;
        
//         const taxAmount = Math.round((basePrice * taxPercent) / 100);
//         const serviceAmount = Math.round((basePrice * servicePercent) / 100);
//         const totalAmount = Math.round(basePrice + taxAmount + serviceAmount);
        
//         return {
//           id: item.id,
//           name: item.name,
//           basePrice: Math.round(basePrice),
//           taxPercent,
//           taxAmount,
//           servicePercent,
//           serviceAmount,
//           totalAmount,
//           splitWith: item.splitWith // Pass the array of participant IDs
//         };
//       });
      
//       // Prepare update data
//       const updateData = {
//         name: billName,
//         description: billDescription,
//         category: billCategory,
//         date: billDate,
//         totalAmount: getGrandTotal(),
//         participants: participants.map(p => ({
//           id: p.id,
//           name: p.name || `Person ${p.id}`,
//           userId: p.userId,
//           isCreator: p.isCreator
//         })),
//         items: processedItems
//       };
      
//       // Send update to backend
//       const response = await axios.patch(`${API_BASE_URL}/bills/${id}`, updateData, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       setSuccess('Bill updated successfully!');
      
//       // Navigate back to bill detail page after short delay
//       setTimeout(() => {
//         navigate(`/dashboard/bills/${id}`);
//       }, 1500);
      
//     } catch (err) {
//       console.error('Error updating bill:', err);
//       setError(err.response?.data?.error || 'Failed to update bill. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   };
  
//   const handleCancel = () => {
//     navigate(`/dashboard/bills/${id}`);
//   };
  
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }
  
//   if (error && !billName) {
//     return (
//       <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
//         <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
//         <p className="text-red-600">{error}</p>
//         <button 
//           onClick={() => navigate('/dashboard/billlist')}
//           className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//         >
//           Back to Bills
//         </button>
//       </div>
//     );
//   }
  
//   return (
//     <div className="min-h-screen bg-gray-50 pb-10">
//       {/* Header */}
//       <div className="bg-white border-b mb-6">
//         <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
//           <div className="flex items-center gap-2">
//             <button
//               onClick={handleCancel}
//               className="text-gray-600 hover:text-gray-900"
//             >
//               <ArrowRight className="rotate-180" size={20} />
//             </button>
//             <h1 className="text-xl font-semibold">Edit Bill</h1>
//           </div>
          
//           <div className="flex gap-3">
//             <button
//               onClick={handleCancel}
//               className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
//               disabled={saving}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
//               disabled={saving}
//             >
//               {saving ? 'Saving...' : (
//                 <>
//                   <Save size={16} />
//                   Save Changes
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
      
//       {/* Main Content */}
//       <div className="max-w-5xl mx-auto px-6">
//         {/* Display error if any */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
//             {error}
//           </div>
//         )}
        
//         {/* Display success message if any */}
//         {success && (
//           <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg text-green-700">
//             {success}
//           </div>
//         )}
        
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Bill Form */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Basic Info */}
//             <div className="bg-white rounded-xl border p-6">
//               <h2 className="text-lg font-semibold mb-4">Bill Details</h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Bill Name</label>
//                   <input
//                     type="text"
//                     placeholder="e.g., Dinner with friends"
//                     className="w-full p-3 border rounded-lg"
//                     value={billName}
//                     onChange={(e) => setBillName(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Category</label>
//                   <select
//                     className="w-full p-3 border rounded-lg"
//                     value={billCategory}
//                     onChange={(e) => setBillCategory(e.target.value)}
//                   >
//                     <option value="dining">Dining</option>
//                     <option value="shopping">Shopping</option>
//                     <option value="traveling">Travel</option>
//                     <option value="hangout">Entertainment</option>
//                     <option value="etc">Other</option>
//                   </select>
//                 </div>
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium mb-2">Description</label>
//                 <textarea
//                   placeholder="Add any notes about this bill"
//                   className="w-full p-3 border rounded-lg"
//                   rows="2"
//                   value={billDescription}
//                   onChange={(e) => setBillDescription(e.target.value)}
//                 />
//               </div>
//             </div>
            
//             {/* Participants */}
//             <div className="bg-white rounded-xl border p-6">
//               <h2 className="text-lg font-semibold mb-4">Participants</h2>
              
//               <div className="space-y-3 mb-4">
//                 {participants.map((participant) => (
//                   <div key={participant.id} className="flex items-center gap-2">
//                     <input
//                       type="text"
//                       placeholder={`Person ${participant.id}`}
//                       className="flex-1 p-3 border rounded-lg"
//                       value={participant.name}
//                       onChange={(e) => updateParticipantName(participant.id, e.target.value)}
//                       disabled={participant.isCreator} // Creator can't be edited
//                     />
//                     <button
//                       className={`text-red-500 hover:text-red-700 p-2 ${
//                         participant.isCreator ? 'opacity-50 cursor-not-allowed' : ''
//                       }`}
//                       onClick={() => removeParticipant(participant.id)}
//                       disabled={participants.length <= 1 || participant.isCreator}
//                       title={participant.isCreator ? "Can't remove creator" : "Remove participant"}
//                     >
//                       <Trash2 size={20} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
              
//               <button
//                 className="text-blue-600 flex items-center gap-1"
//                 onClick={addParticipant}
//               >
//                 <Plus size={18} /> Add Participant
//               </button>
//             </div>
            
//             {/* Bill Items */}
//             <div className="space-y-4">
//               <h2 className="text-lg font-semibold px-1">Bill Items</h2>
              
//               {billItems.map((item) => (
//                 <div key={item.id} className="bg-white rounded-xl border p-6">
//                   <div className="flex justify-between items-start mb-4">
//                     <h3 className="font-medium">Item {item.id}</h3>
//                     <button
//                       className="text-red-500 hover:text-red-700"
//                       onClick={() => removeBillItem(item.id)}
//                       disabled={billItems.length <= 1}
//                     >
//                       <Trash2 size={20} />
//                     </button>
//                   </div>
                  
//                   <div className="space-y-4">
//                     {/* Item Name and Base Price */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium mb-2">Item Name</label>
//                         <input
//                           type="text"
//                           placeholder="What did you buy?"
//                           className="w-full p-3 border rounded-lg"
//                           value={item.name}
//                           onChange={(e) => updateBillItem(item.id, 'name', e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium mb-2">Base Price</label>
//                         <input
//                           type="number"
//                           placeholder="0.00"
//                           className="w-full p-3 border rounded-lg"
//                           value={item.basePrice}
//                           onChange={(e) => updateBillItem(item.id, 'basePrice', e.target.value)}
//                         />
//                       </div>
//                     </div>
                    
//                     {/* Tax and Service Charge */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium mb-2">Tax (%)</label>
//                         <div className="flex items-center gap-2">
//                           <input
//                             type="number"
//                             className="w-full p-3 border rounded-lg"
//                             value={item.taxPercent}
//                             onChange={(e) => updateBillItem(item.id, 'taxPercent', e.target.value)}
//                           />
//                           <span className="text-sm text-gray-500 whitespace-nowrap">
//                             (${calculateTaxAmount(item.basePrice, item.taxPercent)})
//                           </span>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium mb-2">Service Charge (%)</label>
//                         <div className="flex items-center gap-2">
//                           <input
//                             type="number"
//                             className="w-full p-3 border rounded-lg"
//                             value={item.serviceChargePercent}
//                             onChange={(e) => updateBillItem(item.id, 'serviceChargePercent', e.target.value)}
//                           />
//                           <span className="text-sm text-gray-500 whitespace-nowrap">
//                             (${calculateServiceAmount(item.basePrice, item.serviceChargePercent)})
//                           </span>
//                         </div>
//                       </div>
//                     </div>
                    
//                     {/* Split With */}
//                     <div>
//                       <label className="block text-sm font-medium mb-2">Split with</label>
//                       <div className="bg-gray-50 p-4 rounded-lg">
//                         <div className="flex flex-wrap gap-2 mb-2">
//                           {participants.map(participant => (
//                             <button
//                               key={participant.id}
//                               className={`px-3 py-1 rounded-full text-sm ${
//                                 item.splitWith?.includes(participant.id)
//                                   ? 'bg-blue-100 text-blue-600'
//                                   : 'bg-gray-100 text-gray-600'
//                               }`}
//                               onClick={() => toggleParticipantInSplit(item.id, participant.id)}
//                             >
//                               {participant.name || `Person ${participant.id}`}
//                             </button>
//                           ))}
//                         </div>
                        
//                         {item.splitWith?.length > 0 && (
//                           <p className="text-sm text-gray-500">
//                             ${getAmountPerParticipant(item)} per person
//                           </p>
//                         )}
//                       </div>
//                     </div>
                    
//                     {/* Item Total */}
//                     <div className="pt-4 border-t">
//                       <div className="flex justify-between text-sm">
//                         <span className="font-medium">Item Total:</span>
//                         <span className="font-medium">${calculateItemTotal(item)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
              
//               <button
//                 className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2"
//                 onClick={addBillItem}
//               >
//                 <Plus size={20} />
//                 Add Another Item
//               </button>
//             </div>
//           </div>
          
//           {/* Summary Sidebar */}
//           <div className="space-y-6">
//             <div className="bg-white rounded-xl border p-6 lg:sticky lg:top-6">
//               <div className="flex items-center gap-2 mb-4">
//                 <Receipt size={20} className="text-blue-600" />
//                 <h2 className="text-lg font-semibold">Bill Summary</h2>
//               </div>
              
//               <div className="space-y-4">
//                 {billItems.map((item) => (
//                   <div key={item.id} className="flex justify-between text-sm">
//                     <span>{item.name || `Item ${item.id}`}</span>
//                     <span>${calculateItemTotal(item)}</span>
//                   </div>
//                 ))}
                
//                 <div className="pt-4 border-t">
//                   <div className="flex justify-between font-medium">
//                     <span>Total Amount</span>
//                     <span>${getGrandTotal()}</span>
//                   </div>
//                 </div>
//               </div>
              
//               <button
//                 onClick={handleSubmit}
//                 className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
//                 disabled={saving}
//               >
//                 {saving ? 'Saving...' : (
//                   <>
//                     <Save size={18} />
//                     Save Changes
//                   </>
//                 )}
//               </button>
//             </div>
            
//             <div className="bg-blue-50 rounded-xl p-4">
//               <div className="flex items-start gap-3">
//                 <Calculator className="text-blue-600" />
//                 <p className="text-sm text-blue-600">
//                   Tax and service charge are calculated per item for more accurate splitting. All values are rounded to the nearest whole number.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default BillEdit;


// import React, { useState, useEffect } from 'react';
// import { Receipt, User, Clock, ChevronDown, ChevronUp, Check, DollarSign, Tag, ArrowLeftRight } from 'lucide-react';
// import axios from 'axios';
// import { useNavigate } from 'react-router';
// import useUserStore from '../stores/userStore';

// function Payment() {
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [expandedBill, setExpandedBill] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [updatingPayment, setUpdatingPayment] = useState(null);
//   const [updatingSuccess, setUpdatingSuccess] = useState('');

//   const { token, user } = useUserStore();
//   const navigate = useNavigate();

//   const API_BASE_URL = 'http://localhost:8800';

//   // Fetch bills on component mount
//   useEffect(() => {
//     fetchBills();
//   }, [token]);

//   // Function to fetch bills (so we can call it after updates too)
//   const fetchBills = async () => {
//     if (!token) return;
    
//     try {
//       setLoading(true);
//       setError('');

//       // Get all bills
//       const billsResponse = await axios.get(`${API_BASE_URL}/bills`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       // Process bills data
//       let billsData = [];
//       if (billsResponse.data && billsResponse.data.data) {
//         billsData = billsResponse.data.data;
//       } else if (billsResponse.data) {
//         billsData = billsResponse.data;
//       }
      
//       setBills(billsData);
//       setLoading(false);
      
//       // If we had a success message, clear it after 3 seconds
//       if (updatingSuccess) {
//         setTimeout(() => {
//           setUpdatingSuccess('');
//         }, 3000);
//       }
//     } catch (err) {
//       console.error('Error fetching bills:', err);
//       setError(`Failed to load payment data: ${err.response?.data?.message || err.message}`);
//       setLoading(false);
//     }
//   };

//   // Load bill details when expanded
//   const toggleBillExpansion = async (billId) => {
//     if (expandedBill === billId) {
//       setExpandedBill(null);
//       return;
//     }

//     setExpandedBill(billId);
    
//     try {
//       // Get detailed bill information with participants and items
//       const response = await axios.get(`${API_BASE_URL}/bills/${billId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       if (response.data) {
//         // Update the bill with details
//         setBills(prevBills => 
//           prevBills.map(bill => 
//             bill.id === billId ? { ...bill, paymentSummary: {
//               participants: response.data.participants,
//               items: response.data.items
//             }} : bill
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error fetching bill details:', err);
//       setError(`Failed to load payment details: ${err.response?.data?.message || err.message}`);
//     }
//   };

//   // Update payment status
//   const updatePaymentStatus = async (splitIds, newStatus) => {
//     try {
//       if (!splitIds || splitIds.length === 0) {
//         console.error('No split IDs provided for payment update');
//         return;
//       }
      
//       setUpdatingPayment(splitIds);
      
//       await axios.patch(`${API_BASE_URL}/payment`, {
//         splitIds: splitIds,
//         paymentStatus: newStatus
//       }, {
//         headers: { 
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       // Show success indicator with appropriate message
//       setUpdatingSuccess(newStatus === 'completed' ? 'marked as paid' : 'marked as unpaid');
      
//       // Refresh bill data to show updated payment status
//       await fetchBills();
      
//       // If a bill is expanded, fetch its details again
//       if (expandedBill) {
//         await toggleBillExpansion(expandedBill);
//       }
      
//     } catch (err) {
//       console.error('Error updating payment status:', err);
//       setError(`Failed to update payment: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setUpdatingPayment(null);
//     }
//   };
  
//   // Navigate to bill details
//   const handleViewBillDetails = (billId) => {
//     navigate(`/dashboard/bills/${billId}`);
//   };

//   // Filter bills based on search term
//   const filteredBills = bills.filter(bill => {
//     // Filter by search term
//     if (searchTerm && !bill.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
//       return false;
//     }
//     return true;
//   });

//   // Format date string
//   const formatDate = (dateString) => {
//     if (!dateString) return '';
    
//     const date = new Date(dateString);
//     return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
//   };

//   // Get the appropriate icon for the bill category
//   const getCategoryIcon = (category) => {
//     switch (category) {
//       case 'dining':
//         return <Receipt className="text-orange-500" />;
//       case 'traveling':
//         return <ArrowLeftRight className="text-blue-500" />;
//       case 'shopping':
//         return <Tag className="text-green-500" />;
//       case 'hangout':
//         return <User className="text-purple-500" />;
//       default:
//         return <Receipt className="text-gray-500" />;
//     }
//   };

//   // Render payment status pill
//   const PaymentStatusPill = ({ status, onClick, onUndo, isProcessing, isCreator }) => {
//     // If this is a creator's payment, it's always paid and unchangeable
//     if (isCreator) {
//       return (
//         <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
//           <Check size={16} />
//           Paid
//         </div>
//       );
//     }
    
//     if (isProcessing) {
//       return (
//         <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
//           <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
//           Updating...
//         </div>
//       );
//     }
    
//     // For completed payments, offer option to mark as unpaid
//     if (status === 'completed') {
//       return (
//         <button
//           onClick={onUndo}
//           className="bg-green-100 hover:bg-green-200 px-4 py-1 rounded-full text-green-700 flex items-center gap-1 group"
//         >
//           <Check size={16} />
//           <span>Paid</span>
//           <span className="hidden group-hover:inline ml-1 text-xs">(Undo)</span>
//         </button>
//       );
//     }
    
//     // For pending payments, offer option to mark as paid
//     return (
//       <button
//         onClick={onClick}
//         className="bg-orange-100 hover:bg-orange-200 px-4 py-1 rounded-full text-orange-700 flex items-center gap-1"
//       >
//         Mark as Paid
//       </button>
//     );
//   };

//   // Calculate participant totals for bill summary
//   const getParticipantSummary = (bill) => {
//     if (!bill || !bill.paymentSummary || !bill.paymentSummary.participants) {
//       return [];
//     }
    
//     return bill.paymentSummary.participants.map(participant => {
//       return {
//         id: participant.id,
//         name: participant.name,
//         totalAmount: Math.round(participant.totalAmount || 0),
//         pendingAmount: Math.round(participant.pendingAmount || 0),
//         paidAmount: Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0)),
//         isCreator: participant.isCreator
//       };
//     });
//   };

//   if (loading && bills.length === 0) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto px-4 py-6">
//       <h1 className="text-2xl font-bold mb-6">Payment Management</h1>
      
//       {/* Success Message */}
//       {updatingSuccess && (
//         <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center">
//           <Check size={20} className="mr-2" />
//           Payment successfully {updatingSuccess}!
//         </div>
//       )}
      
//       {/* Search Input Only */}
//       <div className="bg-white rounded-lg border p-6 mb-6">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <input
//               type="text"
//               placeholder="Search bills..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-4 py-2 border rounded-lg"
//             />
//           </div>
//         </div>
//       </div>
      
//       {/* Error Message */}
//       {error && (
//         <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
//           {error}
//         </div>
//       )}
      
//       {/* Bills List */}
//       {filteredBills.length === 0 ? (
//         <div className="text-center p-10 bg-gray-50 rounded-lg border">
//           <p className="text-gray-600">No bills found</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {filteredBills.map((bill) => (
//             <div key={bill.id} className="border rounded-lg overflow-hidden">
//               {/* Bill Header */}
//               <div 
//                 className="p-4 bg-white flex justify-between items-center cursor-pointer hover:bg-gray-50"
//                 onClick={() => toggleBillExpansion(bill.id)}
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-gray-100 rounded-lg">
//                     {getCategoryIcon(bill.category)}
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <h2 className="font-semibold">{bill.name}</h2>
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       {bill.description || `with ${bill.participants?.find(p => p.userId !== user.id)?.name || 'Others'}`}
//                     </p>
//                     <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
//                       <div className="flex items-center gap-1">
//                         <Clock size={14} />
//                         <span>{formatDate(bill.date || bill.createdAt)}</span>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <User size={14} />
//                         <span>{bill.participants?.length || 0} participants</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <div className="text-right">
//                     <p className="font-bold text-lg">${Math.round(bill.totalAmount || 0)}</p>
//                     {expandedBill === bill.id ? (
//                       <ChevronUp size={20} className="ml-auto text-gray-400" />
//                     ) : (
//                       <ChevronDown size={20} className="ml-auto text-gray-400" />
//                     )}
//                   </div>
//                 </div>
//               </div>
              
//               {/* Expanded Bill Details */}
//               {expandedBill === bill.id && (
//                 <div className="border-t bg-white p-4">
//                   {/* Bill Summary Section */}
//                   <div className="mb-6">
//                     <h3 className="text-lg font-medium mb-4">Bill Summary</h3>
                    
//                     {bill.paymentSummary?.items && (
//                       <div className="space-y-4 mb-4">
//                         {/* Items Summary */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Items</h4>
//                           <div className="space-y-2 mb-4">
//                             {bill.paymentSummary.items.map((item) => (
//                               <div key={item.id} className="flex justify-between text-sm">
//                                 <span>{item.name}</span>
//                                 <span className="font-medium">${Math.round(item.totalAmount || 0)}</span>
//                               </div>
//                             ))}
//                           </div>
                          
//                           <div className="pt-4 border-t">
//                             <div className="flex justify-between font-medium">
//                               <span>Total Amount</span>
//                               <span>${Math.round(bill.totalAmount || 0)}</span>
//                             </div>
//                           </div>
//                         </div>
                        
//                         {/* Each Person Pays Section */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Each Person Pays</h4>
//                           <div className="space-y-3">
//                             {getParticipantSummary(bill).map((summary) => (
//                               <div key={summary.id} className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                   <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
//                                     <User size={16} className="text-gray-600" />
//                                   </div>
//                                   <div>
//                                     <span className="font-medium">{summary.name}</span>
//                                     {summary.isCreator && (
//                                       <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
//                                         Creator
//                                       </span>
//                                     )}
//                                   </div>
//                                 </div>
//                                 <div className="text-right">
//                                   <div className="font-medium">${summary.totalAmount}</div>
//                                   <div className="text-xs">
//                                     {summary.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">${summary.pendingAmount} pending</span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
                  
//                   <h3 className="text-lg font-medium mb-4">Payment Details</h3>
                  
//                   {bill.paymentSummary ? (
//                     <div className="space-y-4 mb-4">
//                       {bill.paymentSummary.participants?.map((participant) => {
//                         // Skip showing the creator if they are the current user
//                         if (participant.isCreator && participant.userId === user.id) {
//                           return null;
//                         }
                        
//                         // Determine if we're processing this participant's payment
//                         const isProcessing = participant.pendingAmount > 0 && 
//                           updatingPayment !== null;
                        
//                         // Get all pending split IDs for this participant
//                         const pendingSplitIds = [];
//                         bill.paymentSummary.items?.forEach(item => {
//                           item.splits?.forEach(split => {
//                             if (split.participant?.id === participant.id && 
//                                 split.paymentStatus === 'pending') {
//                               pendingSplitIds.push(split.id);
//                             }
//                           });
//                         });
                        
//                         return (
//                           <div 
//                             key={participant.id}
//                             className="border rounded-lg p-4"
//                           >
//                             <div className="flex justify-between items-center mb-3">
//                               <div className="flex items-center gap-3">
//                                 <User size={20} className="text-gray-600" />
//                                 <div>
//                                   <div className="flex items-center gap-2">
//                                     <span className="font-medium">{participant.name}</span>
//                                     {participant.isCreator && (
//                                       <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
                              
//                               <div className="flex items-center gap-3">
//                                 <div className="text-right mr-3">
//                                   <div className="font-medium">
//                                     ${Math.round(participant.totalAmount || 0)}
//                                   </div>
//                                   <div className="text-sm text-gray-500">
//                                     {participant.isCreator ? (
//                                       <span className="text-green-600">Fully paid</span>
//                                     ) : participant.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">
//                                         ${Math.round(participant.pendingAmount)} pending
//                                       </span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>
                                
//                                 {/* For creators, always show paid status */}
//                                 {participant.isCreator ? (
//                                   <PaymentStatusPill
//                                     status="completed"
//                                     isCreator={true}
//                                   />
//                                 ) : (
//                                   <PaymentStatusPill
//                                     status={participant.pendingAmount > 0 ? "pending" : "completed"}
//                                     isProcessing={isProcessing}
//                                     isCreator={participant.isCreator}
//                                     onClick={() => updatePaymentStatus(pendingSplitIds, 'completed')}
//                                     onUndo={() => {
//                                       // Find all completed split IDs for this participant
//                                       const completedSplitIds = [];
//                                       bill.paymentSummary.items?.forEach(item => {
//                                         item.splits?.forEach(split => {
//                                           if (split.participant?.id === participant.id && 
//                                               split.paymentStatus === 'completed') {
//                                             completedSplitIds.push(split.id);
//                                           }
//                                         });
//                                       });
//                                       // Mark them as pending
//                                       updatePaymentStatus(completedSplitIds, 'pending');
//                                     }}
//                                   />
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   ) : (
//                     <div className="p-4 bg-gray-50 rounded-lg">
//                       <p className="text-gray-600 text-center">Loading payment details...</p>
//                     </div>
//                   )}
                  
//                   <div className="flex justify-end mt-6">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleViewBillDetails(bill.id);
//                       }}
//                       className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//                     >
//                       View Bill Details
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default Payment;

// import React, { useState, useEffect } from 'react';
// import { ArrowRight, Receipt, User, Trash2, Calculator, Plus, Save } from 'lucide-react';
// import axios from 'axios';
// import { useParams, useNavigate } from 'react-router';
// import useUserStore from '../stores/userStore';

// function BillEdit() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { token, user } = useUserStore();
  
//   // Bill details state
//   const [billName, setBillName] = useState('');
//   const [billCategory, setBillCategory] = useState('dining');
//   const [billDescription, setBillDescription] = useState('');
//   const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  
//   // State for participants - initialize after component mounts
//   const [participants, setParticipants] = useState([]);
  
//   // State for bill items
//   const [billItems, setBillItems] = useState([]);
  
//   // UI states
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
  
//   // Define your API base URL
//   const API_BASE_URL = 'http://localhost:8800';
  
//   // Fetch bill details on component mount
//   useEffect(() => {
//     const fetchBillDetails = async () => {
//       try {
//         setLoading(true);
//         setError('');
        
//         // Get the bill details
//         const response = await axios.get(`${API_BASE_URL}/bills/${id}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
        
//         if (!response.data) {
//           throw new Error('No bill data received');
//         }
        
//         const bill = response.data;
        
//         // Check if user is the creator
//         const isCreator = bill.creator?.id === user.id || bill.userId === user.id;
//         if (!isCreator) {
//           setError('You do not have permission to edit this bill');
//           setLoading(false);
//           return;
//         }
        
//         // Populate form with bill data
//         setBillName(bill.name || '');
//         setBillCategory(bill.category || 'dining');
//         setBillDescription(bill.description || '');
//         setBillDate(bill.date ? new Date(bill.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        
//         // Set participants
//         if (bill.participants && bill.participants.length > 0) {
//           setParticipants(bill.participants.map(participant => ({
//             id: participant.id,
//             name: participant.name,
//             userId: participant.userId,
//             isCreator: participant.isCreator
//           })));
//         }
        
//         // Set bill items
//         if (bill.items && bill.items.length > 0) {
//           setBillItems(bill.items.map(item => {
//             // Get participant IDs who are part of this item's splits
//             const splitParticipantIds = item.splits.map(split => split.billParticipantId);
            
//             return {
//               id: item.id,
//               name: item.name,
//               basePrice: item.basePrice,
//               taxPercent: item.taxPercent,
//               serviceChargePercent: item.servicePercent || 10,
//               taxAmount: item.taxAmount,
//               serviceAmount: item.serviceAmount,
//               totalAmount: item.totalAmount,
//               splitWith: splitParticipantIds
//             };
//           }));
//         }
        
//         setLoading(false);
//       } catch (err) {
//         console.error('Error fetching bill details:', err);
//         setError(err.response?.data?.message || 'Failed to load bill details. Please try again.');
//         setLoading(false);
//       }
//     };
    
//     if (id && token) {
//       fetchBillDetails();
//     } else if (!id) {
//       setError('Bill ID is missing. Please select a valid bill.');
//       setLoading(false);
//     }
//   }, [id, token, user.id]);
  
//   // Add a new participant
//   const addParticipant = () => {
//     const newId = participants.length > 0
//       ? Math.max(...participants.map(p => p.id)) + 1
//       : 1;
    
//     setParticipants([
//       ...participants,
//       { id: newId, name: '' }
//     ]);
//   };
  
//   // Remove a participant
//   const removeParticipant = (id) => {
//     // Don't allow removing all participants
//     if (participants.length <= 1) return;
    
//     // Don't allow removing creator
//     const participant = participants.find(p => p.id === id);
//     if (participant && participant.isCreator) {
//       setError("You cannot remove the bill creator");
//       return;
//     }
    
//     setParticipants(participants.filter(p => p.id !== id));
    
//     // Also remove this participant from all bill item splits
//     setBillItems(billItems.map(item => ({
//       ...item,
//       splitWith: item.splitWith.filter(participantId => participantId !== id)
//     })));
//   };
  
//   // Update participant name
//   const updateParticipantName = (id, name) => {
//     setParticipants(participants.map(p =>
//       p.id === id ? { ...p, name } : p
//     ));
//   };
  
//   // Add a new bill item
//   const addBillItem = () => {
//     const newId = billItems.length > 0
//       ? Math.max(...billItems.map(item => item.id)) + 1
//       : 1;
    
//     setBillItems([
//       ...billItems,
//       {
//         id: newId,
//         name: '',
//         basePrice: '',
//         taxPercent: 7,
//         serviceChargePercent: 10,
//         splitWith: [participants[0]?.id] // Default to first participant
//       }
//     ]);
//   };
  
//   // Remove a bill item
//   const removeBillItem = (id) => {
//     // Don't allow removing all items
//     if (billItems.length <= 1) return;
    
//     setBillItems(billItems.filter(item => item.id !== id));
//   };
  
//   // Update bill item field
//   const updateBillItem = (id, field, value) => {
//     setBillItems(billItems.map(item =>
//       item.id === id ? { ...item, [field]: value } : item
//     ));
//   };
  
//   // Toggle participant in item split
//   const toggleParticipantInSplit = (itemId, participantId) => {
//     setBillItems(billItems.map(item => {
//       if (item.id !== itemId) return item;
      
//       const newSplitWith = item.splitWith.includes(participantId)
//         ? item.splitWith.filter(id => id !== participantId)
//         : [...item.splitWith, participantId];
      
//       // Don't allow empty splits
//       if (newSplitWith.length === 0) {
//         return item;
//       }
      
//       return {
//         ...item,
//         splitWith: newSplitWith
//       };
//     }));
//   };
  
//   // Calculate item total (base + tax + service) with rounding
//   const calculateItemTotal = (item) => {
//     const base = parseFloat(item.basePrice) || 0;
//     const tax = (base * (parseFloat(item.taxPercent) || 0)) / 100;
//     const serviceCharge = (base * (parseFloat(item.serviceChargePercent) || 0)) / 100;
//     return Math.round(base + tax + serviceCharge);
//   };
  
//   // Calculate bill grand total with rounding
//   const getGrandTotal = () => {
//     return Math.round(billItems.reduce((sum, item) => sum + calculateItemTotal(item), 0));
//   };
  
//   // Calculate amount per participant for an item with rounding
//   const getAmountPerParticipant = (item) => {
//     const total = calculateItemTotal(item);
//     return Math.round(total / (item.splitWith?.length || 1));
//   };
  
//   // Calculate tax amount for display with rounding
//   const calculateTaxAmount = (basePrice, taxPercent) => {
//     const base = parseFloat(basePrice) || 0;
//     const taxRate = parseFloat(taxPercent) || 0;
//     return Math.round((base * taxRate) / 100);
//   };
  
//   // Calculate service charge amount for display with rounding
//   const calculateServiceAmount = (basePrice, servicePercent) => {
//     const base = parseFloat(basePrice) || 0;
//     const serviceRate = parseFloat(servicePercent) || 0;
//     return Math.round((base * serviceRate) / 100);
//   };
  
//   // Handle form submission
//   const handleSubmit = async () => {
//     try {
//       setSaving(true);
//       setError('');
//       setSuccess('');
      
//       // Validate form
//       if (!billName.trim()) {
//         setError('Bill name is required');
//         setSaving(false);
//         return;
//       }
      
//       if (billItems.some(item => !item.name.trim() || !item.basePrice)) {
//         setError('All bill items must have a name and price');
//         setSaving(false);
//         return;
//       }
      
//       // Calculate tax and service amounts for each item
//       const processedItems = billItems.map(item => {
//         const basePrice = parseFloat(item.basePrice) || 0;
//         const taxPercent = parseFloat(item.taxPercent) || 0;
//         const servicePercent = parseFloat(item.serviceChargePercent) || 0;
        
//         const taxAmount = Math.round((basePrice * taxPercent) / 100);
//         const serviceAmount = Math.round((basePrice * servicePercent) / 100);
//         const totalAmount = Math.round(basePrice + taxAmount + serviceAmount);
        
//         return {
//           id: item.id,
//           name: item.name,
//           basePrice: Math.round(basePrice),
//           taxPercent,
//           taxAmount,
//           servicePercent,
//           serviceAmount,
//           totalAmount,
//           splitWith: item.splitWith // Pass the array of participant IDs
//         };
//       });
      
//       // Prepare update data
//       const updateData = {
//         name: billName,
//         description: billDescription,
//         category: billCategory,
//         date: billDate,
//         totalAmount: getGrandTotal(),
//         participants: participants.map(p => ({
//           id: p.id,
//           name: p.name || `Person ${p.id}`,
//           userId: p.userId,
//           isCreator: p.isCreator
//         })),
//         items: processedItems
//       };
      
//       // Send update to backend
//       const response = await axios.patch(`${API_BASE_URL}/bills/${id}`, updateData, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       setSuccess('Bill updated successfully!');
      
//       // Navigate back to bill detail page after short delay
//       setTimeout(() => {
//         navigate(`/dashboard/bills/${id}`);
//       }, 1500);
      
//     } catch (err) {
//       console.error('Error updating bill:', err);
//       setError(err.response?.data?.error || 'Failed to update bill. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   };
  
//   const handleCancel = () => {
//     navigate(`/dashboard/bills/${id}`);
//   };
  
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }
  
//   if (error && !billName) {
//     return (
//       <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
//         <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
//         <p className="text-red-600">{error}</p>
//         <button 
//           onClick={() => navigate('/dashboard/billlist')}
//           className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//         >
//           Back to Bills
//         </button>
//       </div>
//     );
//   }
  
//   return (
//     <div className="min-h-screen bg-gray-50 pb-10">
//       {/* Header */}
//       <div className="bg-white border-b mb-6">
//         <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
//           <div className="flex items-center gap-2">
//             <button
//               onClick={handleCancel}
//               className="text-gray-600 hover:text-gray-900"
//             >
//               <ArrowRight className="rotate-180" size={20} />
//             </button>
//             <h1 className="text-xl font-semibold">Edit Bill</h1>
//           </div>
          
//           <div className="flex gap-3">
//             <button
//               onClick={handleCancel}
//               className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
//               disabled={saving}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
//               disabled={saving}
//             >
//               {saving ? 'Saving...' : (
//                 <>
//                   <Save size={16} />
//                   Save Changes
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
      
//       {/* Main Content */}
//       <div className="max-w-5xl mx-auto px-6">
//         {/* Display error if any */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
//             {error}
//           </div>
//         )}
        
//         {/* Display success message if any */}
//         {success && (
//           <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg text-green-700">
//             {success}
//           </div>
//         )}
        
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Bill Form */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Basic Info */}
//             <div className="bg-white rounded-xl border p-6">
//               <h2 className="text-lg font-semibold mb-4">Bill Details</h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Bill Name</label>
//                   <input
//                     type="text"
//                     placeholder="e.g., Dinner with friends"
//                     className="w-full p-3 border rounded-lg"
//                     value={billName}
//                     onChange={(e) => setBillName(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Category</label>
//                   <select
//                     className="w-full p-3 border rounded-lg"
//                     value={billCategory}
//                     onChange={(e) => setBillCategory(e.target.value)}
//                   >
//                     <option value="dining">Dining</option>
//                     <option value="shopping">Shopping</option>
//                     <option value="traveling">Travel</option>
//                     <option value="hangout">Entertainment</option>
//                     <option value="etc">Other</option>
//                   </select>
//                 </div>
//               </div>
              
//               {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Description</label>
//                   <textarea
//                     placeholder="Add any notes about this bill"
//                     className="w-full p-3 border rounded-lg"
//                     rows="2"
//                     value={billDescription}
//                     onChange={(e) => setBillDescription(e.target.value)}
//                   />
//                 </div>
//                 {/* <div>
//                   <label className="block text-sm font-medium mb-2">Date</label>
//                   <input
//                     type="date"
//                     className="w-full p-3 border rounded-lg"
//                     value={billDate}
//                     onChange={(e) => setBillDate(e.target.value)}
//                   />
//                 </div> */}
//               </div>
//             {/* </div> */}
            
//             {/* Participants */}
//             <div className="bg-white rounded-xl border p-6">
//               <h2 className="text-lg font-semibold mb-4">Participants</h2>
              
//               <div className="space-y-3 mb-4">
//                 {participants.map((participant) => (
//                   <div key={participant.id} className="flex items-center gap-2">
//                     <input
//                       type="text"
//                       placeholder={`Person ${participant.id}`}
//                       className="flex-1 p-3 border rounded-lg"
//                       value={participant.name}
//                       onChange={(e) => updateParticipantName(participant.id, e.target.value)}
//                       disabled={participant.isCreator} // Creator can't be edited
//                     />
//                     <button
//                       className={`text-red-500 hover:text-red-700 p-2 ${
//                         participant.isCreator ? 'opacity-50 cursor-not-allowed' : ''
//                       }`}
//                       onClick={() => removeParticipant(participant.id)}
//                       disabled={participants.length <= 1 || participant.isCreator}
//                       title={participant.isCreator ? "Can't remove creator" : "Remove participant"}
//                     >
//                       <Trash2 size={20} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
              
//               <button
//                 className="text-blue-600 flex items-center gap-1"
//                 onClick={addParticipant}
//               >
//                 <Plus size={18} /> Add Participant
//               </button>
//             </div>
            
//             {/* Bill Items */}
//             <div className="space-y-4">
//               <h2 className="text-lg font-semibold px-1">Bill Items</h2>
              
//               {billItems.map((item) => (
//                 <div key={item.id} className="bg-white rounded-xl border p-6">
//                   <div className="flex justify-between items-start mb-4">
//                     <h3 className="font-medium">Item {item.id}</h3>
//                     <button
//                       className="text-red-500 hover:text-red-700"
//                       onClick={() => removeBillItem(item.id)}
//                       disabled={billItems.length <= 1}
//                     >
//                       <Trash2 size={20} />
//                     </button>
//                   </div>
                  
//                   <div className="space-y-4">
//                     {/* Item Name and Base Price */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium mb-2">Item Name</label>
//                         <input
//                           type="text"
//                           placeholder="What did you buy?"
//                           className="w-full p-3 border rounded-lg"
//                           value={item.name}
//                           onChange={(e) => updateBillItem(item.id, 'name', e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium mb-2">Base Price</label>
//                         <input
//                           type="number"
//                           placeholder="0.00"
//                           className="w-full p-3 border rounded-lg"
//                           value={item.basePrice}
//                           onChange={(e) => updateBillItem(item.id, 'basePrice', e.target.value)}
//                         />
//                       </div>
//                     </div>
                    
//                     {/* Tax and Service Charge */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium mb-2">Tax (%)</label>
//                         <div className="flex items-center gap-2">
//                           <input
//                             type="number"
//                             className="w-full p-3 border rounded-lg"
//                             value={item.taxPercent}
//                             onChange={(e) => updateBillItem(item.id, 'taxPercent', e.target.value)}
//                           />
//                           <span className="text-sm text-gray-500 whitespace-nowrap">
//                             (${calculateTaxAmount(item.basePrice, item.taxPercent)})
//                           </span>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium mb-2">Service Charge (%)</label>
//                         <div className="flex items-center gap-2">
//                           <input
//                             type="number"
//                             className="w-full p-3 border rounded-lg"
//                             value={item.serviceChargePercent}
//                             onChange={(e) => updateBillItem(item.id, 'serviceChargePercent', e.target.value)}
//                           />
//                           <span className="text-sm text-gray-500 whitespace-nowrap">
//                             (${calculateServiceAmount(item.basePrice, item.serviceChargePercent)})
//                           </span>
//                         </div>
//                       </div>
//                     </div>
                    
//                     {/* Split With */}
//                     <div>
//                       <label className="block text-sm font-medium mb-2">Split with</label>
//                       <div className="bg-gray-50 p-4 rounded-lg">
//                         <div className="flex flex-wrap gap-2 mb-2">
//                           {participants.map(participant => (
//                             <button
//                               key={participant.id}
//                               className={`px-3 py-1 rounded-full text-sm ${
//                                 item.splitWith?.includes(participant.id)
//                                   ? 'bg-blue-100 text-blue-600'
//                                   : 'bg-gray-100 text-gray-600'
//                               }`}
//                               onClick={() => toggleParticipantInSplit(item.id, participant.id)}
//                             >
//                               {participant.name || `Person ${participant.id}`}
//                             </button>
//                           ))}
//                         </div>
                        
//                         {item.splitWith?.length > 0 && (
//                           <p className="text-sm text-gray-500">
//                             ${getAmountPerParticipant(item)} per person
//                           </p>
//                         )}
//                       </div>
//                     </div>
                    
//                     {/* Item Total */}
//                     <div className="pt-4 border-t">
//                       <div className="flex justify-between text-sm">
//                         <span className="font-medium">Item Total:</span>
//                         <span className="font-medium">${calculateItemTotal(item)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
              
//               <button
//                 className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2"
//                 onClick={addBillItem}
//               >
//                 <Plus size={20} />
//                 Add Another Item
//               </button>
//             </div>
//           </div>
          
//           {/* Summary Sidebar */}
//           <div className="space-y-6">
//             <div className="bg-white rounded-xl border p-6 lg:sticky lg:top-6">
//               <div className="flex items-center gap-2 mb-4">
//                 <Receipt size={20} className="text-blue-600" />
//                 <h2 className="text-lg font-semibold">Bill Summary</h2>
//               </div>
              
//               <div className="space-y-4">
//                 {billItems.map((item) => (
//                   <div key={item.id} className="flex justify-between text-sm">
//                     <span>{item.name || `Item ${item.id}`}</span>
//                     <span>${calculateItemTotal(item)}</span>
//                   </div>
//                 ))}
                
//                 <div className="pt-4 border-t">
//                   <div className="flex justify-between font-medium">
//                     <span>Total Amount</span>
//                     <span>${getGrandTotal()}</span>
//                   </div>
//                 </div>
//               </div>
              
//               <button
//                 onClick={handleSubmit}
//                 className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
//                 disabled={saving}
//               >
//                 {saving ? 'Saving...' : (
//                   <>
//                     <Save size={18} />
//                     Save Changes
//                   </>
//                 )}
//               </button>
//             </div>
            
//             <div className="bg-blue-50 rounded-xl p-4">
//               <div className="flex items-start gap-3">
//                 <Calculator className="text-blue-600" />
//                 <p className="text-sm text-blue-600">
//                   Tax and service charge are calculated per item for more accurate splitting. All values are rounded to the nearest whole number.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default BillEdit;