import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/slides — list all slides for the current session
export async function GET() {
  const { data, error } = await supabase
    .from('slides')
    .select('*')
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/slides — upsert full slide list (auto-save)
export async function POST(req: NextRequest) {
  const { slides } = await req.json() as { slides: SlideRow[] };

  const { error } = await supabase
    .from('slides')
    .upsert(slides, { onConflict: 'id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/slides?id=xxx
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('slides').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

interface SlideRow {
  id: string;
  title: string;
  fabric_json: string;
  thumbnail: string;
  position: number;
}
