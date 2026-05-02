import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// READ: GET detail board beserta tasks nya
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('boards')
    .select('*, tasks(*)')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// UPDATE: PUT board
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('boards')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

// SOFT DELETE: set deleted_at
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('boards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Board soft deleted', data: data[0] })
}