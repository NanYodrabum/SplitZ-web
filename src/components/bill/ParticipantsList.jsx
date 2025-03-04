import React from 'react';
import { Trash2, Plus } from 'lucide-react';

function ParticipantsList({ participants, addParticipant, removeParticipant, updateParticipantName }) {
  return (
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
  );
}

export default ParticipantsList;