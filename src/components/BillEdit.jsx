import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

// Import Shared Components
import PageHeader from './bill/PageHeader';
import StatusMessage from './bill/StatusMessage';
import BillDetailsForm from './bill/BillDetailsForm';
import ParticipantsList from './bill/ParticipantsList';
import BillItemForm from './bill/BillItemForm';
import AddItemButton from './bill/AddItemButton';
import BillSummary from './bill/BillSummary';

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
            const splitParticipantIds = item.splits.map(split => {
              if (split.billParticipantId) return split.billParticipantId;
              if (split.participant && split.participant.id) return split.participant.id;
              if (split.participantId) return split.participantId;
              return null;
            }).filter(id => id !== null);
            
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
      <PageHeader 
        title="Edit Bill" 
        onCancel={handleCancel} 
        onSave={handleSubmit} 
        isSaving={saving}
        showActions={true}
      />
      
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6">
        {/* Status Messages */}
        <StatusMessage error={error} success={success} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bill Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <BillDetailsForm 
              billName={billName}
              billCategory={billCategory}
              billDescription={billDescription}
              setBillName={setBillName}
              setBillCategory={setBillCategory}
              setBillDescription={setBillDescription}
            />
            
            {/* Participants */}
            <ParticipantsList 
              participants={participants}
              addParticipant={addParticipant}
              removeParticipant={removeParticipant}
              updateParticipantName={updateParticipantName}
            />
            
            {/* Bill Items */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold px-1">Bill Items</h2>
              
              {billItems.map((item, index) => (
                <BillItemForm
                  key={item.id}
                  item={item}
                  participants={participants}
                  itemIndex={index}
                  updateBillItem={updateBillItem}
                  removeBillItem={removeBillItem}
                  toggleParticipantInSplit={toggleParticipantInSplit}
                  getAmountPerParticipant={getAmountPerParticipant}
                  calculateTaxAmount={calculateTaxAmount}
                  calculateServiceAmount={calculateServiceAmount}
                  calculateItemTotal={calculateItemTotal}
                  disableRemove={billItems.length <= 1}
                />
              ))}
              
              <AddItemButton onAddItem={addBillItem} />
            </div>
          </div>
          
          {/* Summary Sidebar */}
          <div className="space-y-6">
            <BillSummary
              billItems={billItems}
              calculateItemTotal={calculateItemTotal}
              getGrandTotal={getGrandTotal}
              getParticipantSummary={getParticipantSummary}
              onSave={handleSubmit}
              isSubmitting={saving}
              submitButtonText="Save Changes"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillEdit;