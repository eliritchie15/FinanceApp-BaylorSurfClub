import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Fetch all income transactions
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM income_transactions ORDER BY date DESC, created_at DESC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching income:', error);
    return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 });
  }
}

// POST - Create new income transaction
export async function POST(request) {
  try {
    const { firstName, lastName, paymentType, quantity, amount, date, memberId } = await request.json();
    
    const result = await pool.query(
      `INSERT INTO income_transactions (first_name, last_name, payment_type, quantity, amount, date, member_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [firstName, lastName, paymentType, quantity, amount, date, memberId]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating income:', error);
    return NextResponse.json({ error: 'Failed to create income' }, { status: 500 });
  }
}