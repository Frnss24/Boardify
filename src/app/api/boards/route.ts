import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// READ: GET semua boards
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get('owner_id')

  let query = supabase
    .from('boards')
    .select('*')
    .is('deleted_at', null)

  if (ownerId) query = query.eq('owner_id', ownerId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// CREATE: POST board baru
export async function POST(request: Request) {
  const body = await request.json()
  const { name, description, owner_id } = body

  const { data, error } = await supabase
    .from('boards')
    .insert([{
      name,
      description,
      owner_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0], { status: 201 })
}