import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { PaymentFormData } from '@/types';
import { z } from 'zod';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other']),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const payments = await sheetsService.getPayments(invoiceId || undefined);

    return NextResponse.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch payments'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = paymentSchema.parse(body);
    
    // Convert string date to Date object
    const paymentData = {
      ...validatedData,
      paymentDate: new Date(validatedData.paymentDate)
    };

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const payment = await sheetsService.createPayment(paymentData);

    return NextResponse.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment data',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create payment'
        }
      },
      { status: 500 }
    );
  }
}