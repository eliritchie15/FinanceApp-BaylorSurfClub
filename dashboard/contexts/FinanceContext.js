'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  // All your financial data state
  const [incomeTransactions, setIncomeTransactions] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [members, setMembers] = useState([]);
  const [otherIncome, setOtherIncome] = useState([]);

  // Calculations
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0) 
                    + otherIncome.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenditures.reduce((sum, e) => sum + e.amount, 0);
  const totalCapital = totalIncome - totalExpenses;
  const seasonLength = totalCapital >= 16250 ? 5 : 4;

  // Auto-update full-season members when season length changes
  useEffect(() => {
    const updatedMembers = members.map(member => {
      if (member.memberType === 'full-season') {
        return {
          ...member,
          sessions: seasonLength
        };
      }
      return member;
    });
    
    if (JSON.stringify(updatedMembers) !== JSON.stringify(members)) {
      setMembers(updatedMembers);
    }
  }, [seasonLength, members]);

  const value = {
    incomeTransactions,
    setIncomeTransactions,
    expenditures,
    setExpenditures,
    members,
    setMembers,
    otherIncome,
    setOtherIncome,
    totalIncome,
    totalExpenses,
    totalCapital,
    seasonLength
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