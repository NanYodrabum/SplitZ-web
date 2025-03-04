import React from 'react';

function EmptyBillState({ onCreateBill }) {
  return (
    <div className="text-center p-10 bg-gray-50 rounded-lg border">
      <p className="text-gray-600 mb-4">No bills found</p>
      <button
        onClick={onCreateBill}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        Create Your First Bill
      </button>
    </div>
  );
}

export default EmptyBillState;
