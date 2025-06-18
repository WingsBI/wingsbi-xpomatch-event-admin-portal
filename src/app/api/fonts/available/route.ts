import { NextRequest, NextResponse } from 'next/server';
import { AvailableFont } from '@/types';

// Available font families for Event Admin customization
const AVAILABLE_FONTS: AvailableFont[] = [
  {
    key: 'nunitosans',
    name: 'Nunito Sans',
    fontFamily: '"Nunito Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  {
    key: 'inter',
    name: 'Inter',
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  {
    key: 'roboto',
    name: 'Roboto',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  {
    key: 'poppins',
    name: 'Poppins',
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  {
    key: 'montserrat',
    name: 'Montserrat',
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  {
    key: 'opensans',
    name: 'Open Sans',
    fontFamily: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  {
    key: 'lato',
    name: 'Lato',
    fontFamily: '"Lato", "Roboto", "Helvetica", "Arial", sans-serif',
  },
];

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would:
    // 1. Verify the user is authenticated (Event Admin or other roles)
    // 2. Possibly filter fonts based on organization settings
    
    return NextResponse.json(AVAILABLE_FONTS);
  } catch (error) {
    console.error('Error fetching available fonts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available fonts' },
      { status: 500 }
    );
  }
} 