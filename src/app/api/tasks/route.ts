import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// No. 9 - READ: GET semua tasks
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const boardId = searchParams.get('board_id')

  let query = supabase
    .from('tasks')
    .select('*')
    .is('deleted_at', null)

  if (boardId) query = query.eq('board_id', boardId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// No. 8 - CREATE: POST task baru
export async function POST(request: Request) {
  const body = await request.json()
  const { board_id, assignee_id, title, description, status, due_date } = body

  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      board_id,
      assignee_id,
      title,
      description,
      status,
      due_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0], { status: 201 })
}