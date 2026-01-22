import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Fetch all other income
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM other_income ORDER BY date DESC, created_at DESC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching other income:', error);
    return NextResponse.json({ error: 'Failed to fetch other income' }, { status: 500 });
  }
}

// POST - Create new other income
export async function POST(request) {
  try {
    const { name, amount, date } = await request.json();
    
    const result = await pool.query(
      `INSERT INTO other_income (name, amount, date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, amount, date]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating other income:', error);
    return NextResponse.json({ error: 'Failed to create other income' }, { status: 500 });
  }
}