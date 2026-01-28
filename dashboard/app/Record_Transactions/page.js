'use client';
import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/components/Toast';

export default function RecordTransactions() {
  const { addToast } = useToast();
  
  // Get shared data and functions from context
  const {
    incomeTransactions,
    expenditures,
    members,
    otherIncome,
    totalIncome,
    totalExpenses,
    totalCapital,
    seasonLength,
    loading,
    addMember,
    updateMember,
    deleteMember,
    addIncome,
    addExpenditure,
    addOtherIncome
  } = useFinance();

  // Form selection state
  const [selectedForm, setSelectedForm] = useState(null);

  // Expenditure form state
  const [expPayee, setExpPayee] = useState('');
  const [expReason, setExpReason] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // Income form state
  const [paymentType, setPaymentType] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sessionQuantity, setSessionQuantity] = useState(1);
  const [otherAmount, setOtherAmount] = useState('');

  // Remove member form state
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Return sessions form state
  const [returnMemberId, setReturnMemberId] = useState('');
  const [sessionsToReturn, setSessionsToReturn] = useState(1);

  // Handle income submission
  async function handleIncomeSubmit(e) {
    e.preventDefault();
    
    // Determine amount based on payment type
    let amount;
    if (paymentType === 'full-season') amount = 425;
    else if (paymentType === 'beach-pass') amount = 35;
    else if (paymentType === 'extra-sessions') amount = sessionQuantity * 80;
    else if (paymentType === 'other') amount = parseFloat(otherAmount);

    const fullName = `${firstName} ${lastName}`;

    // Handle "other" payments separately
    if (paymentType === 'other') {
      try {
        await addOtherIncome({
          name: fullName,
          amount: amount,
          date: new Date().toISOString().split('T')[0]
        });
        
        clearIncomeForm();
        addToast('Other income added!', 'success');
      } catch (error) {
        addToast('Failed to add other income', 'error');
      }
      return;
    }

    // Check if member already exists
    const existingMember = members.find(
      m => m.firstName.toLowerCase() === firstName.toLowerCase() && 
           m.lastName.toLowerCase() === lastName.toLowerCase()
    );

    try {
      if (paymentType === 'full-season') {
        // Full season creates new member
        if (existingMember) {
          addToast('Member already exists! Full season members cannot purchase again.', 'error');
          return;
        }

        const newMember = await addMember({
          firstName: firstName,
          lastName: lastName,
          sessions: seasonLength,
          totalPaid: 425,
          memberType: 'full-season'
        });

        await addIncome({
          firstName: firstName,
          lastName: lastName,
          paymentType: paymentType,
          quantity: null,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          memberId: newMember.id
        });
        
      } else if (paymentType === 'beach-pass') {
        // Beach pass creates new member
        if (existingMember) {
          addToast('Member already exists!', 'error');
          return;
        }

        const newMember = await addMember({
          firstName: firstName,
          lastName: lastName,
          sessions: 0,
          totalPaid: 35,
          memberType: 'beach-pass'
        });

        await addIncome({
          firstName: firstName,
          lastName: lastName,
          paymentType: paymentType,
          quantity: null,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          memberId: newMember.id
        });
        
      } else if (paymentType === 'extra-sessions') {
        // Extra sessions requires existing member
        if (!existingMember) {
          addToast('Member not found! Add them first.', 'error');
          return;
        }

        // Check if they're full season (can't buy extra)
        if (existingMember.memberType === 'full-season') {
          addToast('Full season members already have max sessions!', 'error');
          return;
        }

        // Calculate new session total (capped at season length)
        const newSessionTotal = Math.min(existingMember.sessions + sessionQuantity, seasonLength);
        const actualSessionsAdded = newSessionTotal - existingMember.sessions;

        // Update member
        await updateMember(existingMember.id, {
          sessions: newSessionTotal,
          totalPaid: existingMember.totalPaid + amount
        });

        await addIncome({
          firstName: firstName,
          lastName: lastName,
          paymentType: paymentType,
          quantity: sessionQuantity,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          memberId: existingMember.id
        });

        if (actualSessionsAdded < sessionQuantity) {
          addToast(`Only ${actualSessionsAdded} sessions added (capped)`, 'warning');
        }
      }

      clearIncomeForm();
      addToast('Income added successfully!', 'success');
    } catch (error) {
      addToast('Failed to add income', 'error');
      console.error(error);
    }
  }

  function clearIncomeForm() {
    setPaymentType('');
    setFirstName('');
    setLastName('');
    setSessionQuantity(1);
    setOtherAmount('');
  }
  
  // Handle expenditure submission
  async function handleExpenditureSubmit(e) {
    e.preventDefault();
    
    try {
      await addExpenditure({
        payee: expPayee,
        reason: expReason,
        amount: parseFloat(expAmount),
        date: new Date().toISOString().split('T')[0]
      });
      
      // Check if payee is a member and update their totalPaid and sessions
      const payeeNameLower = expPayee.toLowerCase().trim();
      const member = members.find(m => 
        `${m.firstName} ${m.lastName}`.toLowerCase() === payeeNameLower
      );
      
      if (member) {
        const refundAmount = parseFloat(expAmount);
        const sessionsReturned = Math.floor(refundAmount / 80);
        const newSessionCount = Math.max(0, member.sessions - sessionsReturned);
        const newTotalPaid = member.totalPaid - refundAmount;
        
        await updateMember(member.id, {
          sessions: newSessionCount,
          totalPaid: newTotalPaid
        });
        
        addToast(`${expPayee}'s payment updated!`, 'success');
      } else {
        addToast('Expenditure added!', 'success');
      }
      
      // Clear form
      setExpPayee('');
      setExpReason('');
      setExpAmount('');
    } catch (error) {
      addToast('Failed to add expenditure', 'error');
      console.error(error);
    }
  }

  // Handle member removal (resignation)
  async function handleRemoveMember(e) {
    e.preventDefault();
    
    if (!selectedMemberId) {
      addToast('Please select a member', 'error');
      return;
    }
    
    const member = members.find(m => m.id === parseInt(selectedMemberId));
    if (!member) {
      addToast('Member not found', 'error');
      return;
    }
    
    const fullName = `${member.firstName} ${member.lastName}`;
    
    try {
      // Create expenditure for full refund
      await addExpenditure({
        payee: fullName,
        reason: 'Member Resignation - Full Refund',
        amount: member.totalPaid,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Remove member from database
      await deleteMember(member.id);
      
      // Clear form
      setSelectedMemberId('');
      
      addToast(`${fullName} removed and refunded`, 'info');
    } catch (error) {
      addToast('Failed to remove member', 'error');
      console.error(error);
    }
  }

  // Handle return sessions
  async function handleReturnSessions(e) {
    e.preventDefault();
    
    if (!returnMemberId) {
      addToast('Please select a member', 'error');
      return;
    }
    
    const member = members.find(m => m.id === parseInt(returnMemberId));
    if (!member) {
      addToast('Member not found', 'error');
      return;
    }
    
    const sessionsReturning = parseInt(sessionsToReturn);
    
    if (sessionsReturning < 1) {
      addToast('Must return at least 1 session', 'error');
      return;
    }
    
    if (sessionsReturning > member.sessions) {
      addToast(`Cannot return more than ${member.sessions} sessions`, 'error');
      return;
    }
    
    const refundAmount = sessionsReturning * 80;
    const fullName = `${member.firstName} ${member.lastName}`;
    
    try {
      // Create expenditure for refund
      await addExpenditure({
        payee: fullName,
        reason: `Session Return - ${sessionsReturning} session(s)`,
        amount: refundAmount,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Update member
      await updateMember(member.id, {
        sessions: member.sessions - sessionsReturning,
        totalPaid: member.totalPaid - refundAmount
      });
      
      // Clear form
      setReturnMemberId('');
      setSessionsToReturn(1);
      
      addToast(`${sessionsReturning} sessions returned for ${fullName}`, 'info');
    } catch (error) {
      addToast('Failed to return sessions', 'error');
      console.error(error);
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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Record Transactions</h1>
      
      {/* Display current capital and season info */}
      <div className="bg-blue-100 p-4 rounded mb-6">
        <p className="text-lg"><strong>Total Capital:</strong> ${totalCapital.toFixed(2)}</p>
        <p className="text-lg"><strong>Season Length:</strong> {seasonLength} sessions</p>
      </div>

      {/* Form selector buttons */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setSelectedForm('income')}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
        >
          Add Income
        </button>
        <button 
          onClick={() => setSelectedForm('expenditure')}
          className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
        >
          Add Expenditure
        </button>
        <button 
          onClick={() => setSelectedForm('remove-member')}
          className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
        >
          Remove Member
        </button>
        <button 
          onClick={() => setSelectedForm('return-sessions')}
          className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
        >
          Return Sessions
        </button>
      </div>

      {/* Expenditure Form */}
      {selectedForm === 'expenditure' && (
        <form onSubmit={handleExpenditureSubmit} className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Add Expenditure</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Payee Name:</label>
            <input 
              type="text"
              value={expPayee}
              onChange={(e) => setExpPayee(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Reason:</label>
            <input 
              type="text"
              value={expReason}
              onChange={(e) => setExpReason(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Amount ($):</label>
            <input 
              type="number"
              step="0.01"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <button 
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Submit Expenditure
          </button>
        </form>
      )}

      {/* Income Form */}
      {selectedForm === 'income' && (
        <form onSubmit={handleIncomeSubmit} className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Add Income</h2>
          
          {/* Payment Type Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-bold">Payment Type:</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input 
                  type="radio"
                  name="paymentType"
                  value="full-season"
                  checked={paymentType === 'full-season'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  required
                  className="mr-2"
                />
                Full Season ($425) - {seasonLength} sessions
              </label>
              
              <label className="flex items-center">
                <input 
                  type="radio"
                  name="paymentType"
                  value="beach-pass"
                  checked={paymentType === 'beach-pass'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="mr-2"
                />
                Beach Pass ($35) - 0 sessions
              </label>
              
              <label className="flex items-center">
                <input 
                  type="radio"
                  name="paymentType"
                  value="extra-sessions"
                  checked={paymentType === 'extra-sessions'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="mr-2"
                />
                Extra Sessions ($80 each)
              </label>
              
              <label className="flex items-center">
                <input 
                  type="radio"
                  name="paymentType"
                  value="other"
                  checked={paymentType === 'other'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="mr-2"
                />
                Other (custom amount)
              </label>
            </div>
          </div>

          {/* Name Inputs */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">First Name:</label>
            <input 
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Last Name:</label>
            <input 
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          {/* Extra Sessions Quantity */}
          {paymentType === 'extra-sessions' && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Number of Sessions:</label>
              <input 
                type="number"
                min="1"
                max={seasonLength}
                value={sessionQuantity}
                onChange={(e) => setSessionQuantity(parseInt(e.target.value) || 1)}
                required
                className="w-full border border-gray-300 p-2 rounded"
              />
              <p className="text-sm text-gray-500 mt-1">
                Amount: ${(sessionQuantity * 80).toFixed(2)}
              </p>
            </div>
          )}

          {/* Other Amount Input */}
          {paymentType === 'other' && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Amount ($):</label>
              <input 
                type="number"
                step="0.01"
                value={otherAmount}
                onChange={(e) => setOtherAmount(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
          )}

          {/* Display Amount for Fixed-Price Items */}
          {(paymentType === 'full-season' || paymentType === 'beach-pass') && (
            <div className="mb-4 bg-gray-100 p-3 rounded">
              <p className="text-lg font-bold">
                Amount: ${paymentType === 'full-season' ? '425.00' : '35.00'}
              </p>
            </div>
          )}

          <button 
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Submit Income
          </button>
        </form>
      )}

      {/* Remove Member Form */}
      {selectedForm === 'remove-member' && (
        <form onSubmit={handleRemoveMember} className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Remove Member (Full Resignation)</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-bold">Select Member:</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="">-- Choose a member --</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} - {member.sessions} sessions, ${member.totalPaid.toFixed(2)} paid
                </option>
              ))}
            </select>
          </div>
          
          {selectedMemberId && (
            <div className="mb-4 bg-yellow-100 p-4 rounded border border-yellow-400">
              <p className="font-bold text-yellow-800">⚠️ Warning:</p>
              <p className="text-yellow-800">
                This will:
              </p>
              <ul className="list-disc ml-6 text-yellow-800">
                <li>Remove the member from the members table</li>
                <li>Create a refund expenditure for ${members.find(m => m.id === parseInt(selectedMemberId))?.totalPaid.toFixed(2)}</li>
                <li>Reduce total capital</li>
              </ul>
            </div>
          )}
          
          <button 
            type="submit"
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Remove Member & Process Refund
          </button>
        </form>
      )}

      {/* Return Sessions Form */}
      {selectedForm === 'return-sessions' && (
        <form onSubmit={handleReturnSessions} className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Return Sessions</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-bold">Select Member:</label>
            <select
              value={returnMemberId}
              onChange={(e) => setReturnMemberId(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="">-- Choose a member --</option>
              {members.filter(m => m.sessions > 0).map(member => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} - {member.sessions} sessions available
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Only members with sessions can return them
            </p>
          </div>
          
          {returnMemberId && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-bold">Number of Sessions to Return:</label>
                <input 
                  type="number"
                  min="1"
                  max={members.find(m => m.id === parseInt(returnMemberId))?.sessions || 1}
                  value={sessionsToReturn}
                  onChange={(e) => setSessionsToReturn(parseInt(e.target.value) || 1)}
                  required
                  className="w-full border border-gray-300 p-2 rounded"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Max: {members.find(m => m.id === parseInt(returnMemberId))?.sessions} sessions
                </p>
              </div>
              
              <div className="mb-4 bg-blue-100 p-4 rounded border border-blue-400">
                <p className="font-bold text-blue-800">📋 Summary:</p>
                <ul className="mt-2 text-blue-800">
                  <li>Sessions returning: {sessionsToReturn}</li>
                  <li>Refund amount: ${(sessionsToReturn * 80).toFixed(2)}</li>
                  <li>
                    New session count: {
                      (members.find(m => m.id === parseInt(returnMemberId))?.sessions || 0) - sessionsToReturn
                    }
                  </li>
                  <li>
                    New total paid: ${
                      ((members.find(m => m.id === parseInt(returnMemberId))?.totalPaid || 0) - (sessionsToReturn * 80)).toFixed(2)
                    }
                  </li>
                </ul>
              </div>
            </>
          )}
          
          <button 
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
          >
            Process Session Return
          </button>
        </form>
      )}

      {/* Display Expenditures Table */}
      {expenditures.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Expenditures</h2>
          <table className="w-full bg-white shadow rounded">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Payee</th>
                <th className="p-3 text-left">Reason</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenditures.map(exp => (
                <tr key={`exp-${exp.id}`} className="border-t">
                  <td className="p-3">{exp.date}</td>
                  <td className="p-3">{exp.payee}</td>
                  <td className="p-3">{exp.reason}</td>
                  <td className="p-3 text-right">${exp.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Display Members Table */}
      {members.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Members</h2>
          <table className="w-full bg-white shadow rounded">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-center">Sessions</th>
                <th className="p-3 text-right">Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={`member-${member.id}`} className="border-t">
                  <td className="p-3">{member.firstName} {member.lastName}</td>
                  <td className="p-3">{member.memberType}</td>
                  <td className="p-3 text-center">{member.sessions}</td>
                  <td className="p-3 text-right">${member.totalPaid.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Display Income Transactions Table */}
      {incomeTransactions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Income Transactions</h2>
          <table className="w-full bg-white shadow rounded">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-center">Quantity</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {incomeTransactions.map(income => (
                <tr key={`income-${income.id}`} className="border-t">
                  <td className="p-3">{income.date}</td>
                  <td className="p-3">{income.firstName} {income.lastName}</td>
                  <td className="p-3">{income.paymentType}</td>
                  <td className="p-3 text-center">{income.quantity || '-'}</td>
                  <td className="p-3 text-right">${income.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Display Other Income Table */}
      {otherIncome.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Other Income</h2>
          <table className="w-full bg-white shadow rounded">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {otherIncome.map(income => (
                <tr key={`othinc-${income.id}`} className="border-t">
                  <td className="p-3">{income.date}</td>
                  <td className="p-3">{income.name}</td>
                  <td className="p-3 text-right">${income.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}