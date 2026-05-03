import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// No. 9 - READ: GET detail task
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// No. 10 - UPDATE: PUT task
export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

// No. 11 - SOFT DELETE: set deleted_at
export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  const { id } = await params
  const { data, error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Task soft deleted', data: data[0] })
}