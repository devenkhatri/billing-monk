import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  // Payment API endpoints will be implemented in later tasks
  return NextResponse.json({ message: 'Payments API endpoint - to be implemented' });
}

export async function POST(_request: NextRequest) {
  // Payment creation will be implemented in later tasks
  return NextResponse.json({ message: 'Payment creation - to be implemented' });
}