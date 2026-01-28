import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const seasonId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // members, income, expenditures, other-income

    // Fetch season info
    const seasonRes = await pool.query('SELECT * FROM seasons WHERE id = $1', [seasonId]);
    if (seasonRes.rows.length === 0) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }
    const season = seasonRes.rows[0];

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Baylor Surf Club Finance System';
    workbook.created = new Date();

    let filename = '';
    let data = [];

    // Fetch and format data based on type
    switch (type) {
      case 'members':
        const membersRes = await pool.query(
          'SELECT * FROM archived_members WHERE season_id = $1 ORDER BY id',
          [seasonId]
        );
        data = membersRes.rows;
        filename = `${season.name}_Members.xlsx`;
        
        const membersSheet = workbook.addWorksheet('Members');
        membersSheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'First Name', key: 'first_name', width: 15 },
          { header: 'Last Name', key: 'last_name', width: 15 },
          { header: 'Member Type', key: 'member_type', width: 15 },
          { header: 'Sessions', key: 'sessions', width: 10 },
          { header: 'Total Paid', key: 'total_paid', width: 12 }
        ];
        
        // Style header
        membersSheet.getRow(1).font = { bold: true };
        membersSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        membersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        
        // Add data
        data.forEach(member => {
          membersSheet.addRow({
            id: member.original_id,
            first_name: member.first_name,
            last_name: member.last_name,
            member_type: member.member_type,
            sessions: member.sessions,
            total_paid: parseFloat(member.total_paid)
          });
        });
        
        // Format currency column
        membersSheet.getColumn('total_paid').numFmt = '$#,##0.00';
        break;

      case 'income':
        const incomeRes = await pool.query(
          'SELECT * FROM archived_income_transactions WHERE season_id = $1 ORDER BY date DESC',
          [seasonId]
        );
        data = incomeRes.rows;
        filename = `${season.name}_Income.xlsx`;
        
        const incomeSheet = workbook.addWorksheet('Income Transactions');
        incomeSheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Date', key: 'date', width: 12 },
          { header: 'First Name', key: 'first_name', width: 15 },
          { header: 'Last Name', key: 'last_name', width: 15 },
          { header: 'Payment Type', key: 'payment_type', width: 15 },
          { header: 'Quantity', key: 'quantity', width: 10 },
          { header: 'Amount', key: 'amount', width: 12 }
        ];
        
        // Style header
        incomeSheet.getRow(1).font = { bold: true };
        incomeSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF70AD47' }
        };
        incomeSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        
        // Add data
        data.forEach(income => {
          incomeSheet.addRow({
            id: income.original_id,
            date: new Date(income.date).toLocaleDateString(),
            first_name: income.first_name,
            last_name: income.last_name,
            payment_type: income.payment_type,
            quantity: income.quantity || '-',
            amount: parseFloat(income.amount)
          });
        });
        
        // Format currency column
        incomeSheet.getColumn('amount').numFmt = '$#,##0.00';
        break;

      case 'expenditures':
        const expendituresRes = await pool.query(
          'SELECT * FROM archived_expenditures WHERE season_id = $1 ORDER BY date DESC',
          [seasonId]
        );
        data = expendituresRes.rows;
        filename = `${season.name}_Expenditures.xlsx`;
        
        const expSheet = workbook.addWorksheet('Expenditures');
        expSheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Date', key: 'date', width: 12 },
          { header: 'Payee', key: 'payee', width: 20 },
          { header: 'Reason', key: 'reason', width: 30 },
          { header: 'Amount', key: 'amount', width: 12 }
        ];
        
        // Style header
        expSheet.getRow(1).font = { bold: true };
        expSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE74C3C' }
        };
        expSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        
        // Add data
        data.forEach(exp => {
          expSheet.addRow({
            id: exp.original_id,
            date: new Date(exp.date).toLocaleDateString(),
            payee: exp.payee,
            reason: exp.reason,
            amount: parseFloat(exp.amount)
          });
        });
        
        // Format currency column
        expSheet.getColumn('amount').numFmt = '$#,##0.00';
        break;

      case 'other-income':
        const otherIncomeRes = await pool.query(
          'SELECT * FROM archived_other_income WHERE season_id = $1 ORDER BY date DESC',
          [seasonId]
        );
        data = otherIncomeRes.rows;
        filename = `${season.name}_OtherIncome.xlsx`;
        
        const otherSheet = workbook.addWorksheet('Other Income');
        otherSheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Date', key: 'date', width: 12 },
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Amount', key: 'amount', width: 12 }
        ];
        
        // Style header
        otherSheet.getRow(1).font = { bold: true };
        otherSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF9B59B6' }
        };
        otherSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        
        // Add data
        data.forEach(other => {
          otherSheet.addRow({
            id: other.original_id,
            date: new Date(other.date).toLocaleDateString(),
            name: other.name,
            amount: parseFloat(other.amount)
          });
        });
        
        // Format currency column
        otherSheet.getColumn('amount').numFmt = '$#,##0.00';
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return file as download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting season data:', error);
    return NextResponse.json({ 
      error: 'Failed to export data',
      details: error.message 
    }, { status: 500 });
  }
}