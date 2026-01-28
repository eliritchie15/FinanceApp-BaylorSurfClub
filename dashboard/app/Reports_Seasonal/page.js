'use client';
import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/components/Toast';

export default function Reports() {
  const { addToast } = useToast();
  const { totalCapital, members, totalIncome, totalExpenses } = useFinance();
  
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEndSeasonModal, setShowEndSeasonModal] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEndingSeason, setIsEndingSeason] = useState(false);

  // Fetch past seasons on mount
  useEffect(() => {
    fetchSeasons();
  }, []);

  async function fetchSeasons() {
    try {
      const response = await fetch('/api/seasons');
      const data = await response.json();
      setSeasons(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      addToast('Failed to load seasons', 'error');
      setLoading(false);
    }
  }

  async function handleEndSeason() {
    if (!seasonName.trim()) {
      addToast('Please enter a season name', 'error');
      return;
    }

    setIsEndingSeason(true);
    
    try {
      const response = await fetch('/api/seasons/end-season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonName: seasonName.trim(),
          endDate: endDate
        })
      });

      const data = await response.json();

      if (response.ok) {
        addToast('Season ended successfully!', 'success');
        setShowEndSeasonModal(false);
        setSeasonName('');
        
        // Refresh page to show cleared data
        window.location.reload();
      } else {
        addToast(data.error || 'Failed to end season', 'error');
      }
    } catch (error) {
      console.error('Error ending season:', error);
      addToast('Failed to end season', 'error');
    } finally {
      setIsEndingSeason(false);
    }
  }

  async function downloadSeasonData(seasonId, seasonName, type) {
    try {
      addToast('Generating Excel file...', 'info');
      
      const response = await fetch(`/api/seasons/${seasonId}/export?type=${type}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${seasonName.replace(/\s+/g, '_')}_${type}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast('Download complete!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      addToast(`Download failed: ${error.message}`, 'error');
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Reports & Season Management</h1>

      {/* Current Season Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Current Season</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded">
            <p className="text-sm text-gray-600">Total Capital</p>
            <p className="text-2xl font-bold text-green-600">${totalCapital.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600">Total Members</p>
            <p className="text-2xl font-bold text-blue-600">{members.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <p className="text-sm text-gray-600">Total Income</p>
            <p className="text-2xl font-bold text-purple-600">${totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 p-4 rounded">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
          </div>
        </div>

        <button
          onClick={() => setShowEndSeasonModal(true)}
          disabled={members.length === 0}
          className={`w-full py-3 rounded-lg font-bold text-white text-lg transition-colors ${
            members.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          🚨 END CURRENT SEASON
        </button>
        
        {members.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-2">
            No active data to archive. Add transactions first.
          </p>
        )}
      </div>

      {/* Past Seasons Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Past Seasons</h2>
        
        {seasons.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No past seasons yet. End the current season to create your first archive.
          </p>
        ) : (
          <div className="space-y-4">
            {seasons.map(season => (
              <div key={season.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">📊 {season.name}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Ending Capital</p>
                    <p className="text-xl font-bold text-green-600">${parseFloat(season.ending_capital).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600">Members:</span>
                    <span className="font-semibold ml-1">{season.total_members}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Income:</span>
                    <span className="font-semibold ml-1 text-green-600">${parseFloat(season.total_income).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expenses:</span>
                    <span className="font-semibold ml-1 text-red-600">${parseFloat(season.total_expenses).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => downloadSeasonData(season.id, season.name, 'members')}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    📥 Members.xlsx
                  </button>
                  <button
                    onClick={() => downloadSeasonData(season.id, season.name, 'income')}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    📥 Income.xlsx
                  </button>
                  <button
                    onClick={() => downloadSeasonData(season.id, season.name, 'expenditures')}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    📥 Expenditures.xlsx
                  </button>
                  <button
                    onClick={() => downloadSeasonData(season.id, season.name, 'other-income')}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    📥 OtherIncome.xlsx
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* End Season Modal */}
      {showEndSeasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ END CURRENT SEASON?</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">Season Name:</label>
              <input
                type="text"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="e.g. Fall 2025"
                className="w-full border border-gray-300 p-2 rounded"
                disabled={isEndingSeason}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                disabled={isEndingSeason}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="font-semibold text-yellow-800 mb-2">This will:</p>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>✓ Archive all current data</li>
                <li>✓ Generate downloadable Excel files</li>
                <li>✓ Clear all members and transactions</li>
                <li>✓ Keep capital: ${totalCapital.toLocaleString()}</li>
              </ul>
              <p className="text-red-600 font-bold mt-3">⚠️ This cannot be undone!</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndSeasonModal(false)}
                disabled={isEndingSeason}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSeason}
                disabled={isEndingSeason}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-semibold disabled:bg-red-400"
              >
                {isEndingSeason ? 'Processing...' : 'CONFIRM END SEASON'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}