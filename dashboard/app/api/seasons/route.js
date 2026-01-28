import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Fetch all seasons
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM seasons ORDER BY end_date DESC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 });
  }
}