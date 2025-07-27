import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  // Invoice API endpoints will be implemented in later tasks
  return NextResponse.json({ message: 'Invoices API endpoint - to be implemented' });
}

export async function POST(_request: NextRequest) {
  // Invoice creation will be implemented in later tasks
  return NextResponse.json({ message: 'Invoice creation - to be implemented' });
}