import { NextRequest, NextResponse } from 'next/server';
import { AvailableTheme } from '@/types';

// Available themes for Event Admin customization
const AVAILABLE_THEMES: AvailableTheme[] = [
  {
    key: 'default',
    name: 'Ocean Blue',
    description: 'Professional blue theme with clean design',
    preview: '#1976d2',
  },
  {
    key: 'corporate',
    name: 'Executive Gray',
    description: 'Professional corporate theme with neutral tones',
    preview: '#374151',
  },
  {
    key: 'green',
    name: 'Forest Professional',
    description: 'Clean green theme for a fresh professional look',
    preview: '#059669',
  },
  {
    key: 'teal',
    name: 'Teal Professional',
    description: 'Modern teal theme with sophisticated appeal',
    preview: '#0891b2',
  },
  {
    key: 'orange',
    name: 'Sunset Professional',
    description: 'Warm orange theme with energetic professional vibes',
    preview: '#ea580c',
  },
];

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would:
    // 1. Verify the user is authenticated (Event Admin or other roles)
    // 2. Possibly filter themes based on organization settings
    
    // Example authentication check:
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    return NextResponse.json(AVAILABLE_THEMES);
  } catch (error) {
    console.error('Error fetching available themes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available themes' },
      { status: 500 }
    );
  }
} 