function BillItems({ bill }) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Bill Items</h2>
        
        <div className="space-y-6">
          {bill.items?.map(item => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <div className="flex gap-3 text-sm text-gray-500 mt-1">
                    <span>Base: ${item.basePrice?.toFixed(2) || '0.00'}</span>
                    <span>•</span>
                    <span>Tax: {item.taxPercent || 0}% (${Math.round(parseFloat(item.taxAmount || 0))})</span>
                    <span>•</span>
                    <span>Service: {item.servicePercent || 0}% (${Math.round(parseFloat(item.serviceAmount || 0))})</span>
                  </div>
                </div>
                <span className="font-bold">${Math.round(parseFloat(item.totalAmount || 0))}</span>
              </div>
              
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-2">Split Between: ({item.splits?.length || 0} participants)</p>
                <div className="flex flex-wrap gap-2">
                  {item.splits?.map((split, index) => {
                    // Find participant using various possible ID structures
                    let participantId = split.billParticipantId;
                    
                    // Try different properties if billParticipantId is undefined
                    if (participantId === undefined && split.participant) {
                      participantId = split.participant.id;
                    }
                    if (participantId === undefined && split.participantId) {
                      participantId = split.participantId;
                    }
                    
                    const participant = bill.participants?.find(p => p.id === participantId);
                    
                    // Determine if this participant is the creator
                    const isCreator = participant && participant.isCreator;
                    
                    // Override payment status to "completed" if participant is the bill creator
                    const displayStatus = isCreator ? "completed" : split.paymentStatus;
                    
                    return (
                      <div 
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                          displayStatus === "completed"
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        <span>{participant?.name || 'Unknown'}</span>
                        <span>${Math.round(parseFloat(split.shareAmount || 0))}</span>
                        {displayStatus === "completed" && (
                          <span className="text-xs ml-1">(Paid)</span>
                        )}
                        {displayStatus === "pending" && (
                          <span className="text-xs ml-1">(Pending)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  export default BillItems;
  