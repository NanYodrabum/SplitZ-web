import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

// Import Shared Components
import PageHeader from './bill/PageHeader';
import StatusMessage from './bill/StatusMessage';
import BillDetailsForm from './bill/BillDetailsForm';
import ParticipantsList from './bill/ParticipantsList';
import BillItemForm from './bill/BillItemForm';
import AddItemButton from './bill/AddItemButton';
import BillSummary from './bill/BillSummary';

const Bill = () => {
  // Get user data and token once and outside of render cycles
  const user = useUserStore(state => state.user);
  const token = useUserStore(state => state.token);

  // State for bill details
  const [billName, setBillName] = useState('');
  const [billCategory, setBillCategory] = useState('dining');
  const [billDescription, setBillDescription] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // const navigate = useNavigate();

  // State for participants - initialize after component mounts
  const [participants, setParticipants] = useState([]);

  // State for bill items
  const [billItems, setBillItems] = useState([]);

  // Initialize states that depend on user data after component mounts
  useEffect(() => {
    // Only set initial participants and bill items once
    if (participants.length === 0) {
      setParticipants([
        { id: 1, name: user?.name || 'You', userId: user?.id, isCreator: true }
      ]);
    }

    if (billItems.length === 0) {
      setBillItems([
        {
          id: 1,
          name: '',
          basePrice: '',
          taxPercent: 7,
          serviceChargePercent: 10,
          splitWith: [1] // Default to first participant (You)
        }
      ]);
    }
  }, [user]);

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
    return Math.round(total / item.splitWith.length);
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

  // Calculate summary of what each participant owes with rounding
  const getParticipantSummary = () => {
    const summary = {};

    // Initialize summary with zero for each participant
    participants.forEach(participant => {
      summary[participant.id] = {
        id: participant.id,
        name: participant.name || `Person ${participant.id}`,
        amount: 0,
        isCreator: participant.isCreator
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

  // Form submission handler
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      // Validate form
      if (!billName.trim()) {
        setError('Bill name is required');
        setIsSubmitting(false);
        return;
      }

      if (billItems.some(item => !item.name.trim() || !item.basePrice)) {
        setError('All bill items must have a name and price');
        setIsSubmitting(false);
        return;
      }

      // Calculate tax and service amounts for each item with rounding
      const processedItems = billItems.map(item => {
        const basePrice = parseFloat(item.basePrice) || 0;
        const taxPercent = parseFloat(item.taxPercent) || 0;
        const servicePercent = parseFloat(item.serviceChargePercent) || 0;

        const taxAmount = Math.round((basePrice * taxPercent) / 100);
        const serviceAmount = Math.round((basePrice * servicePercent) / 100);
        const totalAmount = Math.round(basePrice + taxAmount + serviceAmount);

        return {
          name: item.name,
          basePrice: Math.round(basePrice),
          taxPercent,
          taxAmount,
          servicePercent,
          serviceAmount,
          totalAmount,
          // Just pass the array of participant IDs
          splitWith: item.splitWith
        };
      });

      // Prepare data for API
      const billData = {
        name: billName,
        description: billDescription,
        category: billCategory,
        date: billDate,
        totalAmount: getGrandTotal(),
        participants: participants.map(p => ({
          id: p.id, // Frontend ID for mapping
          name: p.name || `Person ${p.id}`,
          userId: p.userId, // Can be null for non-registered users
          isCreator: p.id === 1 // Assuming first participant is creator
        })),
        items: processedItems
      };

      console.log('Sending bill data:', JSON.stringify(billData, null, 2));

      // Send data to backend
      const response = await axios.post('http://localhost:8800/bills', billData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Bill created:', response.data);
      setSuccess('Bill created successfully!');

      // Reset form after successful submission
      setBillName('');
      setBillDescription('');
      setBillCategory('dining');
      setBillDate(new Date().toISOString().split('T')[0]);
      setParticipants([{ id: 1, name: user?.name || 'You', userId: user?.id, isCreator: true }]);
      setBillItems([{
        id: 1,
        name: '',
        basePrice: '',
        taxPercent: 7,
        serviceChargePercent: 10,
        splitWith: [1]
      }]);

    } catch (err) {
      console.error('Error creating bill:', err);
      setError(err.response?.data?.error || 'Failed to create bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <PageHeader title="Create New Bill" />

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
              isSubmitting={isSubmitting}
              submitButtonText="Save Bill"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bill;
