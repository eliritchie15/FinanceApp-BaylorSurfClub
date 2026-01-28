import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const client = await pool.connect();
  
  try {
    const { seasonName, endDate } = await request.json();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Get current data for calculations
    const membersRes = await client.query('SELECT * FROM members');
    const incomeRes = await client.query('SELECT * FROM income_transactions');
    const expendituresRes = await client.query('SELECT * FROM expenditures');
    const otherIncomeRes = await client.query('SELECT * FROM other_income');
    
    const members = membersRes.rows;
    const income = incomeRes.rows;
    const expenditures = expendituresRes.rows;
    const otherIncome = otherIncomeRes.rows;
    
    // Calculate totals
    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0) +
                       otherIncome.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = expenditures.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const endingCapital = totalIncome - totalExpenses;
    
    // Determine start date (earliest transaction or current date)
    const allDates = [
      ...income.map(i => i.date),
      ...expenditures.map(e => e.date),
      ...otherIncome.map(o => o.date)
    ];
    const startDate = allDates.length > 0 
      ? allDates.sort()[0] 
      : new Date().toISOString().split('T')[0];
    
    // Create season record
    const seasonResult = await client.query(
      `INSERT INTO seasons (name, start_date, end_date, starting_capital, ending_capital, 
                           total_members, total_income, total_expenses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [seasonName, startDate, endDate, 0, endingCapital, members.length, totalIncome, totalExpenses]
    );
    
    const seasonId = seasonResult.rows[0].id;
    
    // Archive members
    if (members.length > 0) {
      const memberValues = members.map(m => 
        `(${seasonId}, ${m.id}, '${m.first_name}', '${m.last_name}', ${m.sessions}, ${m.total_paid}, '${m.member_type}')`
      ).join(',');
      
      await client.query(`
        INSERT INTO archived_members (season_id, original_id, first_name, last_name, sessions, total_paid, member_type)
        VALUES ${memberValues}
      `);
    }
    
    // Archive income transactions
    if (income.length > 0) {
      const incomeValues = income.map(i => {
        const dateStr = new Date(i.date).toISOString().split('T')[0];
        return `(${seasonId}, ${i.id}, '${i.first_name}', '${i.last_name}', '${i.payment_type}', ${i.quantity || 'NULL'}, ${i.amount}, '${dateStr}', ${i.member_id || 'NULL'})`;
      }).join(',');
      
      await client.query(`
        INSERT INTO archived_income_transactions (season_id, original_id, first_name, last_name, payment_type, quantity, amount, date, member_id)
        VALUES ${incomeValues}
      `);
    }
    
    // Archive expenditures
    if (expenditures.length > 0) {
      const expValues = expenditures.map(e => {
        const dateStr = new Date(e.date).toISOString().split('T')[0];
        return `(${seasonId}, ${e.id}, '${e.payee.replace(/'/g, "''")}', '${e.reason.replace(/'/g, "''")}', ${e.amount}, '${dateStr}')`;
      }).join(',');
      
      await client.query(`
        INSERT INTO archived_expenditures (season_id, original_id, payee, reason, amount, date)
        VALUES ${expValues}
      `);
    }
    
    // Archive other income
    if (otherIncome.length > 0) {
      const otherValues = otherIncome.map(o => {
        const dateStr = new Date(o.date).toISOString().split('T')[0];
        return `(${seasonId}, ${o.id}, '${o.name.replace(/'/g, "''")}', ${o.amount}, '${dateStr}')`;
      }).join(',');
    }
    
    // Clear active tables
    await client.query('DELETE FROM income_transactions');
    await client.query('DELETE FROM expenditures');
    await client.query('DELETE FROM other_income');
    await client.query('DELETE FROM members');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE members_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE income_transactions_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE expenditures_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE other_income_id_seq RESTART WITH 1');
    
    // Commit transaction
    await client.query('COMMIT');
    
    return NextResponse.json({ 
      success: true, 
      seasonId,
      message: 'Season ended successfully',
      endingCapital 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error ending season:', error);
    return NextResponse.json({ 
      error: 'Failed to end season',
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}