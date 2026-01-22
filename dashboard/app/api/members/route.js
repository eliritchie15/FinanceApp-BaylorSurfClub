import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Fetch all members
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM members ORDER BY created_at DESC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error in members GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new member
export async function POST(request) {
  try {
    const { firstName, lastName, sessions, totalPaid, memberType } = await request.json();
    
    const result = await pool.query(
      `INSERT INTO members (first_name, last_name, sessions, total_paid, member_type, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [firstName, lastName, sessions, totalPaid, memberType]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error in members POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update member
export async function PUT(request) {
  try {
    const { id, sessions, totalPaid } = await request.json();
    
    const result = await pool.query(
      `UPDATE members 
       SET sessions = $1, total_paid = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [sessions, totalPaid, id]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error in members PUT:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove member
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await pool.query('DELETE FROM members WHERE id = $1', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error in members DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}