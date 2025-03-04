import React from 'react';
import { Plus } from 'lucide-react';

function BillListHeader({ onCreateBill }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">My Bills</h1>
      <button
        onClick={onCreateBill}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700"
      >
        <Plus size={16} />
        <span>Create New Bill</span>
      </button>
    </div>
  );
}

export default BillListHeader;