import React from 'react';

function BillDetailsForm({ billName, billCategory, billDescription, setBillName, setBillCategory, setBillDescription }) {
  return (
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
        <label className="block text-sm font-medium mb-2 w-full">Description</label>
        <textarea
          placeholder="Add any notes about this bill"
          className="w-full p-3 border rounded-lg"
          rows="2"
          value={billDescription}
          onChange={(e) => setBillDescription(e.target.value)}
        />
      </div>
    </div>
  );
}

export default BillDetailsForm;
