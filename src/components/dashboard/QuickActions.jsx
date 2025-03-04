import React from 'react';
import { Plus, Receipt } from 'lucide-react';

function QuickActions({ onAddBill, onManageBills }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <button 
        onClick={onAddBill}
        className="flex items-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        <Plus size={24} />
        <span>Add New Bill</span>
      </button>
      <button 
        onClick={onManageBills}
        className="flex items-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        <Receipt size={24} />
        <span>Manage Bills</span>
      </button>
    </div>
  );
}

export default QuickActions;