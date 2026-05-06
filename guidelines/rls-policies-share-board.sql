-- RLS Policies for Board Share Feature

DROP POLICY IF EXISTS "users_can_view_shared_boards" ON boards;
DROP POLICY IF EXISTS "only_owner_can_update_boards" ON boards;
DROP POLICY IF EXISTS "contributors_can_update_board_members" ON boards;
DROP POLICY IF EXISTS "users_can_view_board_tasks" ON tasks;
DROP POLICY IF EXISTS "contributors_can_modify_tasks" ON tasks;
DROP POLICY IF EXISTS "contributors_can_create_tasks" ON tasks;

-- 1. Users can view their own boards or boards they're shared with
CREATE POLICY "users_can_view_shared_boards"
ON boards
FOR SELECT
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(members, '[]'::jsonb)) AS m
    WHERE m->>'user_id' = auth.uid()::text
  )
);

-- 2. Only owner can update their board
CREATE POLICY "only_owner_can_update_boards"
ON boards
FOR UPDATE
USING (owner_id = auth.uid());

-- 3. Contributors (edit permission) can update board members list
CREATE POLICY "contributors_can_update_board_members"
ON boards
FOR UPDATE
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(members, '[]'::jsonb)) AS m
    WHERE m->>'user_id' = auth.uid()::text AND m->>'permission' = 'edit'
  )
);

-- 4. Tasks: Users can view tasks in boards they have access to
CREATE POLICY "users_can_view_board_tasks"
ON tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM boards b
    WHERE b.id = tasks.board_id AND (
      b.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(b.members, '[]'::jsonb)) AS m
        WHERE m->>'user_id' = auth.uid()::text
      )
    )
  )
);

-- 5. Tasks: Contributors can create/update tasks
CREATE POLICY "contributors_can_modify_tasks"
ON tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM boards b
    WHERE b.id = tasks.board_id AND (
      b.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(b.members, '[]'::jsonb)) AS m
        WHERE m->>'user_id' = auth.uid()::text AND m->>'permission' = 'edit'
      )
    )
  )
);

-- 6. Tasks: Contributors can create new tasks
CREATE POLICY "contributors_can_create_tasks"
ON tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boards b
    WHERE b.id = tasks.board_id AND (
      b.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(b.members, '[]'::jsonb)) AS m
        WHERE m->>'user_id' = auth.uid()::text AND m->>'permission' = 'edit'
      )
    )
  )
);
