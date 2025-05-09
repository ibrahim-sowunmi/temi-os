import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const workerId = searchParams.get('workerId');
    
    // Validate required parameters
    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: agentId' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          // Include workerId in headers if available
          ...(workerId && { 'x-worker-id': workerId }),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get signed URL');
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
