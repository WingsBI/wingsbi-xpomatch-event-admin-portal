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
    key: 'dark',
    name: 'Midnight Professional',
    description: 'Sophisticated dark theme for extended use',
    preview: '#0f172a',
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
    key: 'purple',
    name: 'Royal Professional',
    description: 'Elegant purple theme with professional styling',
    preview: '#7c3aed',
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
  {
    key: 'indigo',
    name: 'Indigo Professional',
    description: 'Deep indigo theme with premium professional feel',
    preview: '#4f46e5',
  },
  {
    key: 'red',
    name: 'Crimson Professional',
    description: 'Bold red theme with confident professional presence',
    preview: '#dc2626',
  },
  {
    key: 'pink',
    name: 'Rose Professional',
    description: 'Elegant rose theme with refined professional aesthetics',
    preview: '#e11d48',
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