'use client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';

export default function Dashboard() {
  // Get real data from context
  const {
    incomeTransactions,
    expenditures,
    members,
    otherIncome,
    totalIncome,
    totalExpenses,
    totalCapital,
    seasonLength
  } = useFinance();

  const totalMembers = members.length;
  
  // Calculate member types
  const memberTypes = [
    { 
      name: 'Full Season', 
      count: members.filter(m => m.memberType === 'full-season').length 
    },
    { 
      name: 'Beach Pass', 
      count: members.filter(m => m.memberType === 'beach-pass').length 
    },
    { 
      name: 'Extra Only', 
      count: members.filter(m => m.memberType !== 'full-season' && m.memberType !== 'beach-pass').length 
    }
  ];
  
  // Calculate income breakdown
  const fullSeasonIncome = incomeTransactions
    .filter(t => t.paymentType === 'full-season')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const beachPassIncome = incomeTransactions
    .filter(t => t.paymentType === 'beach-pass')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const extraSessionsIncome = incomeTransactions
    .filter(t => t.paymentType === 'extra-sessions')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const otherIncomeTotal = otherIncome.reduce((sum, t) => sum + t.amount, 0);
  
  const incomeBreakdown = [
    { 
      name: 'Full Season', 
      value: fullSeasonIncome,
      percentage: totalIncome > 0 ? ((fullSeasonIncome / totalIncome) * 100).toFixed(0) : 0
    },
    { 
      name: 'Beach Pass', 
      value: beachPassIncome,
      percentage: totalIncome > 0 ? ((beachPassIncome / totalIncome) * 100).toFixed(0) : 0
    },
    { 
      name: 'Extra Sessions', 
      value: extraSessionsIncome,
      percentage: totalIncome > 0 ? ((extraSessionsIncome / totalIncome) * 100).toFixed(0) : 0
    },
    { 
      name: 'Other', 
      value: otherIncomeTotal,
      percentage: totalIncome > 0 ? ((otherIncomeTotal / totalIncome) * 100).toFixed(0) : 0
    }
  ].filter(item => item.value > 0); // Only show categories with income
  
  // Income vs Expenses data
  const incomeVsExpenses = [
    { category: 'Income', amount: totalIncome },
    { category: 'Expenses', amount: totalExpenses }
  ];
  
  // Recent transactions - combine income and expenditures
  const allTransactions = [
    ...incomeTransactions.map(t => ({
      id: t.id,
      date: t.date,
      name: `${t.firstName} ${t.lastName}`,
      type: t.paymentType,
      amount: t.amount
    })),
    ...expenditures.map(e => ({
      id: e.id,
      date: e.date,
      name: e.payee,
      type: 'Expenditure',
      amount: -e.amount
    }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  // Colors for charts
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
  const MEMBER_COLORS = ['#10b981', '#3b82f6', '#8b5cf6'];
  
  // Capital progress calculation
  const capitalTarget = 16250;
  const capitalProgress = (totalCapital / capitalTarget) * 100;
  const isAboveTarget = totalCapital >= capitalTarget;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Capital Card */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-lg shadow-lg text-white">
          <h3 className="text-green-100 text-sm font-semibold uppercase tracking-wide">Total Capital</h3>
          <p className="text-4xl font-bold mt-2">${totalCapital.toLocaleString()}</p>
          <p className="text-green-100 text-sm mt-2">Current club funds</p>
        </div>
        
        {/* Members Card */}
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-lg shadow-lg text-white">
          <h3 className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Total Members</h3>
          <p className="text-4xl font-bold mt-2">{totalMembers}</p>
          <p className="text-blue-100 text-sm mt-2">Active members</p>
        </div>
        
        {/* Season Length Card */}
        <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-lg shadow-lg text-white">
          <h3 className="text-purple-100 text-sm font-semibold uppercase tracking-wide">Season Length</h3>
          <p className="text-4xl font-bold mt-2">{seasonLength} sessions</p>
          <p className="text-purple-100 text-sm mt-2">
            {isAboveTarget ? 'Full season unlocked! 🎉' : 'Standard season'}
          </p>
        </div>
      </div>

      {/* Capital Progress to Target */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Capital Progress to 5-Session Target</h2>
        <div className="mb-2 flex justify-between text-sm text-gray-600">
          <span>Current: ${totalCapital.toLocaleString()}</span>
          <span>Target: ${capitalTarget.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
          <div 
            className={`h-full ${isAboveTarget ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-500 flex items-center justify-end pr-3`}
            style={{ width: `${Math.min(capitalProgress, 100)}%` }}
          >
            <span className="text-white font-bold text-sm">
              {capitalProgress.toFixed(1)}%
            </span>
          </div>
        </div>
        {isAboveTarget ? (
          <p className="text-green-600 font-semibold mt-3">
            ✓ Target reached! 5-session season is active.
          </p>
        ) : (
          <p className="text-gray-600 mt-3">
            Need ${(capitalTarget - totalCapital).toLocaleString()} more to unlock 5-session season
          </p>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill="#8884d8">
                {incomeVsExpenses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.category === 'Income' ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-around text-sm">
            <div>
              <span className="text-gray-600">Net: </span>
              <span className="font-bold text-green-600">${(totalIncome - totalExpenses).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Income Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Income Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incomeBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {incomeBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {incomeBreakdown.map((item, index) => (
              <div key={item.name} className="flex items-center">
                <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-gray-600">{item.name}: ${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Member Types Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Member Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberTypes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8">
                {memberTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={MEMBER_COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm text-gray-600">
            Total: {memberTypes.reduce((sum, m) => sum + m.count, 0)} members
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Transactions</h2>
          <div className="space-y-3">
            {allTransactions.map(transaction => (
              <div key={transaction.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-semibold text-gray-800">{transaction.name}</p>
                  <p className="text-sm text-gray-500">{transaction.date} • {transaction.type}</p>
                </div>
                <span className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full text-blue-600 hover:text-blue-800 font-semibold text-sm">
            View All Transactions →
          </button>
        </div>
      </div>
    </div>
  );
}