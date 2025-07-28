import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Template } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // For now, return some mock templates since template management isn't implemented yet
    // This will be replaced with actual Google Sheets integration when templates are implemented
    const mockTemplates: Template[] = [
      {
        id: 'template-1',
        name: 'Web Development Services',
        description: 'Standard web development template',
        lineItems: [
          { description: 'Frontend Development', quantity: 40, rate: 75 },
          { description: 'Backend Development', quantity: 30, rate: 85 },
          { description: 'Testing & QA', quantity: 10, rate: 65 }
        ],
        taxRate: 8.5,
        notes: 'Payment due within 30 days',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'template-2',
        name: 'Consulting Services',
        description: 'Standard consulting template',
        lineItems: [
          { description: 'Strategy Consultation', quantity: 8, rate: 150 },
          { description: 'Implementation Support', quantity: 16, rate: 125 }
        ],
        taxRate: 8.5,
        notes: 'Net 15 payment terms',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'template-3',
        name: 'Design Services',
        description: 'Standard design template',
        lineItems: [
          { description: 'UI/UX Design', quantity: 20, rate: 95 },
          { description: 'Graphic Design', quantity: 15, rate: 80 },
          { description: 'Design Revisions', quantity: 5, rate: 70 }
        ],
        taxRate: 8.5,
        notes: 'Payment due upon completion',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    const response: ApiResponse<Template[]> = {
      success: true,
      data: mockTemplates
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching templates:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch templates'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}