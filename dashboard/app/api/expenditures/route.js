import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Fetch all expenditures
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM expenditures ORDER BY date DESC, created_at DESC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    return NextResponse.json({ error: 'Failed to fetch expenditures' }, { status: 500 });
  }
}

// POST - Create new expenditure
export async function POST(request) {
  try {
    const { payee, reason, amount, date } = await request.json();
    
    const result = await pool.query(
      `INSERT INTO expenditures (payee, reason, amount, date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payee, reason, amount, date]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating expenditure:', error);
    return NextResponse.json({ error: 'Failed to create expenditure' }, { status: 500 });
  }
}