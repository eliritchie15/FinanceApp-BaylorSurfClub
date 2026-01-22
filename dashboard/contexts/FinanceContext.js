'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  // State for all data
  const [incomeTransactions, setIncomeTransactions] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [members, setMembers] = useState([]);
  const [otherIncome, setOtherIncome] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data from database on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [membersRes, incomeRes, expendituresRes, otherIncomeRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/income'),
        fetch('/api/expenditures'),
        fetch('/api/other-income')
      ]);

      // Check if responses are ok
      if (!membersRes.ok) {
        console.error('Members API error:', await membersRes.text());
        throw new Error('Failed to fetch members');
      }
      if (!incomeRes.ok) {
        console.error('Income API error:', await incomeRes.text());
        throw new Error('Failed to fetch income');
      }
      if (!expendituresRes.ok) {
        console.error('Expenditures API error:', await expendituresRes.text());
        throw new Error('Failed to fetch expenditures');
      }
      if (!otherIncomeRes.ok) {
        console.error('Other income API error:', await otherIncomeRes.text());
        throw new Error('Failed to fetch other income');
      }

      const membersData = await membersRes.json();
      const incomeData = await incomeRes.json();
      const expendituresData = await expendituresRes.json();
      const otherIncomeData = await otherIncomeRes.json();

      // Convert snake_case from database to camelCase for frontend
      setMembers(membersData.map(m => ({
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        sessions: m.sessions,
        totalPaid: parseFloat(m.total_paid),
        memberType: m.member_type
      })));

      setIncomeTransactions(incomeData.map(i => ({
        id: i.id,
        firstName: i.first_name,
        lastName: i.last_name,
        paymentType: i.payment_type,
        quantity: i.quantity,
        amount: parseFloat(i.amount),
        date: i.date,
        memberId: i.member_id
      })));

      setExpenditures(expendituresData.map(e => ({
        id: e.id,
        payee: e.payee,
        reason: e.reason,
        amount: parseFloat(e.amount),
        date: e.date
      })));

      setOtherIncome(otherIncomeData.map(o => ({
        id: o.id,
        name: o.name,
        amount: parseFloat(o.amount),
        date: o.date
      })));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }

  // Helper functions to save to database
  async function addMember(member) {
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      const newMember = await response.json();
      
      // Convert to camelCase and add to state
      const formattedMember = {
        id: newMember.id,
        firstName: newMember.first_name,
        lastName: newMember.last_name,
        sessions: newMember.sessions,
        totalPaid: parseFloat(newMember.total_paid),
        memberType: newMember.member_type
      };
      
      setMembers(prev => [...prev, formattedMember]);
      return formattedMember;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  async function updateMember(id, updates) {
    try {
      const response = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      const updatedMember = await response.json();
      
      // Update state
      setMembers(prev => prev.map(m => 
        m.id === id 
          ? { ...m, ...updates }
          : m
      ));
      
      return updatedMember;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  }

  async function deleteMember(id) {
    try {
      await fetch(`/api/members?id=${id}`, {
        method: 'DELETE'
      });
      
      // Remove from state
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  async function addIncome(income) {
    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(income)
      });
      const newIncome = await response.json();
      
      const formattedIncome = {
        id: newIncome.id,
        firstName: newIncome.first_name,
        lastName: newIncome.last_name,
        paymentType: newIncome.payment_type,
        quantity: newIncome.quantity,
        amount: parseFloat(newIncome.amount),
        date: newIncome.date,
        memberId: newIncome.member_id
      };
      
      setIncomeTransactions(prev => [...prev, formattedIncome]);
      return formattedIncome;
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  }

  async function addExpenditure(expenditure) {
    try {
      const response = await fetch('/api/expenditures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenditure)
      });
      const newExpenditure = await response.json();
      
      const formattedExpenditure = {
        id: newExpenditure.id,
        payee: newExpenditure.payee,
        reason: newExpenditure.reason,
        amount: parseFloat(newExpenditure.amount),
        date: newExpenditure.date
      };
      
      setExpenditures(prev => [...prev, formattedExpenditure]);
      return formattedExpenditure;
    } catch (error) {
      console.error('Error adding expenditure:', error);
      throw error;
    }
  }

  async function addOtherIncome(income) {
    try {
      const response = await fetch('/api/other-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(income)
      });
      const newIncome = await response.json();
      
      const formattedIncome = {
        id: newIncome.id,
        name: newIncome.name,
        amount: parseFloat(newIncome.amount),
        date: newIncome.date
      };
      
      setOtherIncome(prev => [...prev, formattedIncome]);
      return formattedIncome;
    } catch (error) {
      console.error('Error adding other income:', error);
      throw error;
    }
  }

  // Calculations
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0) 
                    + otherIncome.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenditures.reduce((sum, e) => sum + e.amount, 0);
  const totalCapital = totalIncome - totalExpenses;
  const seasonLength = totalCapital >= 16250 ? 5 : 4;

  // Auto-update full-season members when season length changes
  useEffect(() => {
    const updateFullSeasonMembers = async () => {
      const fullSeasonMembers = members.filter(m => m.memberType === 'full-season');
      
      for (const member of fullSeasonMembers) {
        if (member.sessions !== seasonLength) {
          await updateMember(member.id, { sessions: seasonLength, totalPaid: member.totalPaid });
        }
      }
    };
    
    if (members.length > 0 && !loading) {
      updateFullSeasonMembers();
    }
  }, [seasonLength]);

  const value = {
    incomeTransactions,
    expenditures,
    members,
    otherIncome,
    totalIncome,
    totalExpenses,
    totalCapital,
    seasonLength,
    loading,
    // Database functions
    addMember,
    updateMember,
    deleteMember,
    addIncome,
    addExpenditure,
    addOtherIncome,
    refreshData: fetchAllData
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
}