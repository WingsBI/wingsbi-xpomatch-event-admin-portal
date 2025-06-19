import { NextRequest, NextResponse } from 'next/server';

interface MappingSubmission {
  excelColumn: string;
  standardField: string;
}

interface SubmissionRequest {
  mappings: MappingSubmission[];
}

interface ApiResponse {
  version: string;
  statusCode: number;
  message: string;
  isError: boolean | null;
  responseException: any;
  result: any;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const identifier = params.identifier;
    
    if (!identifier) {
      return NextResponse.json({
        version: "1.0.0.0",
        statusCode: 400,
        message: "Identifier is required",
        isError: true,
        responseException: null,
        result: null
      }, { status: 400 });
    }

    const body: SubmissionRequest = await request.json();
    
    if (!body.mappings || !Array.isArray(body.mappings)) {
      return NextResponse.json({
        version: "1.0.0.0",
        statusCode: 400,
        message: "Invalid mappings data",
        isError: true,
        responseException: null,
        result: null
      }, { status: 400 });
    }

    // Validate mappings
    for (const mapping of body.mappings) {
      if (!mapping.excelColumn || !mapping.standardField) {
        return NextResponse.json({
          version: "1.0.0.0",
          statusCode: 400,
          message: "Each mapping must have both excelColumn and standardField",
          isError: true,
          responseException: null,
          result: null
        }, { status: 400 });
      }
    }

    // Here you would typically save the mappings to a database
    // For now, we'll just log them and return success
    console.log(`Saving field mappings for ${identifier}:`, body.mappings);

    // In a real application, you might:
    // 1. Save mappings to database
    // 2. Process the Excel data using these mappings
    // 3. Import the data into your system
    // 4. Send notifications, etc.

    const response: ApiResponse = {
      version: "1.0.0.0",
      statusCode: 200,
      message: "Field mappings saved successfully",
      isError: null,
      responseException: null,
      result: {
        identifier: identifier,
        mappingsCount: body.mappings.length,
        timestamp: new Date().toISOString(),
        status: "processed"
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in submitMapping API:', error);
    
    return NextResponse.json({
      version: "1.0.0.0",
      statusCode: 500,
      message: "Internal server error while saving mappings",
      isError: true,
      responseException: error instanceof Error ? error.message : 'Unknown error',
      result: null
    }, { status: 500 });
  }
} 