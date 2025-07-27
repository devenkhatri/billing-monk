import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  // Client API endpoints will be implemented in later tasks
  return NextResponse.json({ message: 'Clients API endpoint - to be implemented' });
}

export async function POST(_request: NextRequest) {
  // Client creation will be implemented in later tasks
  return NextResponse.json({ message: 'Client creation - to be implemented' });
}