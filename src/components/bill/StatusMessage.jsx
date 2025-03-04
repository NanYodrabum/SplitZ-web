function StatusMessage({ error, success }) {
    return (
      <>
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
      </>
    );
  }
  
  export default StatusMessage;
  