import { NextResponse } from 'next/server';
import { runImporter } from '../../../../../scripts/import-algomaster';

export async function POST() {
  try {
    await runImporter();
    return NextResponse.json({ success: true, message: 'AlgoMaster curriculum refreshed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    description: 'POST to this endpoint to re-fetch and update official AlgoMaster curriculum into Supabase and local data.',
  });
}
