
'use server';

import { NextResponse, type NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  const { propertyId } = params;
  // This is the most important log to check in your SERVER terminal
  console.log(`[SIMPLIFIED API] Route /api/properties/${propertyId}/active-bookings was HIT! Params:`, params);
  
  // Basic check for propertyId, though the 404 suggests the route isn't even found.
  if (!propertyId) {
    console.log('[SIMPLIFIED API] Property ID missing in params.');
    return NextResponse.json({ message: 'Property ID is required.' }, { status: 400 });
  }

  return NextResponse.json({ 
    message: `This is a test response for property ID: ${propertyId}. If you see this, the route is working.`,
    propertyId: propertyId,
    status: "ok_simplified_route"
  });
}
