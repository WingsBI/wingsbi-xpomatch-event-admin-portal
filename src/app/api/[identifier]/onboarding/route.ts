import { NextRequest, NextResponse } from 'next/server';

// Example onboarding data structure
interface OnboardingData {
  identifier: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    required: boolean;
  }>;
  progress: number;
  configuration: {
    theme: string;
    features: string[];
    settings: Record<string, any>;
  };
}

// Mock data for different identifiers
const mockOnboardingData: Record<string, OnboardingData> = {
  'AI2025': {
    identifier: 'AI2025',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to AI2025 Event',
        description: 'Get started with your AI conference setup',
        completed: true,
        required: true,
      },
      {
        id: 'users',
        title: 'Import Users',
        description: 'Upload participant and exhibitor data',
        completed: false,
        required: true,
      },
      {
        id: 'theme',
        title: 'Customize Theme',
        description: 'Configure the look and feel of your event',
        completed: false,
        required: false,
      },
      {
        id: 'launch',
        title: 'Launch Event',
        description: 'Make your event live for participants',
        completed: false,
        required: true,
      },
    ],
    progress: 25,
    configuration: {
      theme: 'AI_BLUE',
      features: ['matchmaking', 'networking', 'virtual_booths'],
      settings: {
        maxParticipants: 1000,
        enableChat: true,
        enableVideo: true,
      },
    },
  },
  'TECH2024': {
    identifier: 'TECH2024',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Tech Summit 2024',
        description: 'Set up your technology conference',
        completed: true,
        required: true,
      },
      {
        id: 'agenda',
        title: 'Create Agenda',
        description: 'Set up sessions and speakers',
        completed: false,
        required: true,
      },
      {
        id: 'sponsors',
        title: 'Configure Sponsors',
        description: 'Add sponsor information and branding',
        completed: false,
        required: false,
      },
    ],
    progress: 33,
    configuration: {
      theme: 'TECH_GREEN',
      features: ['sessions', 'speakers', 'sponsors'],
      settings: {
        maxParticipants: 500,
        enableChat: false,
        enableVideo: false,
      },
    },
  },
  'default': {
    identifier: 'default',
    steps: [
      {
        id: 'setup',
        title: 'Basic Setup',
        description: 'Get started with your event',
        completed: false,
        required: true,
      },
    ],
    progress: 0,
    configuration: {
      theme: 'DEFAULT',
      features: [],
      settings: {},
    },
  },
};

// GET /api/[identifier]/onboarding
export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const { identifier } = params;
    
    console.log(`[API] GET /api/${identifier}/onboarding - Identifier extracted:`, identifier);

    // Get onboarding data for the specific identifier
    const onboardingData = mockOnboardingData[identifier] || mockOnboardingData['default'];

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      data: onboardingData,
      message: `Onboarding data retrieved for ${identifier}`,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error(`[API] Error in GET /api/${params.identifier}/onboarding:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve onboarding data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// PUT /api/[identifier]/onboarding
export async function PUT(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const { identifier } = params;
    const body = await request.json();
    
    console.log(`[API] PUT /api/${identifier}/onboarding - Updating data:`, body);

    // Get current data
    const currentData = mockOnboardingData[identifier] || mockOnboardingData['default'];

    // Update the data (in a real app, this would update a database)
    const updatedData = {
      ...currentData,
      ...body,
      identifier, // Ensure identifier stays consistent
    };

    // Calculate progress based on completed steps
    if (updatedData.steps) {
      const completedSteps = updatedData.steps.filter((step: { completed: any; }) => step.completed).length;
      updatedData.progress = Math.round((completedSteps / updatedData.steps.length) * 100);
    }

    // Store the updated data (in memory for this example)
    mockOnboardingData[identifier] = updatedData;

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: `Onboarding data updated for ${identifier}`,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error(`[API] Error in PUT /api/${params.identifier}/onboarding:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update onboarding data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// POST /api/[identifier]/onboarding/complete
export async function POST(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const { identifier } = params;
    
    console.log(`[API] POST /api/${identifier}/onboarding/complete - Completing onboarding`);

    // Get current data
    const currentData = mockOnboardingData[identifier] || mockOnboardingData['default'];

    // Mark all required steps as completed
    const updatedSteps = currentData.steps.map(step => ({
      ...step,
      completed: step.required ? true : step.completed,
    }));

    const updatedData = {
      ...currentData,
      steps: updatedSteps,
      progress: 100,
    };

    // Store the updated data
    mockOnboardingData[identifier] = updatedData;

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: `Onboarding completed for ${identifier}`,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error(`[API] Error in POST /api/${params.identifier}/onboarding/complete:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to complete onboarding',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// DELETE /api/[identifier]/onboarding
export async function DELETE(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const { identifier } = params;
    
    console.log(`[API] DELETE /api/${identifier}/onboarding - Resetting onboarding`);

    // Reset to default state
    const defaultData = {
      ...mockOnboardingData['default'],
      identifier,
    };

    mockOnboardingData[identifier] = defaultData;

    return NextResponse.json({
      success: true,
      data: defaultData,
      message: `Onboarding reset for ${identifier}`,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error(`[API] Error in DELETE /api/${params.identifier}/onboarding:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset onboarding',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 