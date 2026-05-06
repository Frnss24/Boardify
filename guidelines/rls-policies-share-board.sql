-- RLS Policies for Board Share Feature

-- 1. Users can view their own boards or boards they're shared with
CREATE POLICY "users_can_view_shared_boards"
ON boards
FOR SELECT
USING (
  auth.uid() = owner_id::text OR
  members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
);

-- 2. Only owner can update their board
CREATE POLICY "only_owner_can_update_boards"
ON boards
FOR UPDATE
USING (auth.uid() = owner_id::text);

-- 3. Contributors (edit permission) can update board members list
CREATE POLICY "contributors_can_update_board_members"
ON boards
FOR UPDATE
USING (
  auth.uid() = owner_id::text OR
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(members) AS m
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
      b.owner_id::text = auth.uid() OR
      b.members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
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
      b.owner_id::text = auth.uid() OR
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(b.members) AS m
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
      b.owner_id::text = auth.uid() OR
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(b.members) AS m
        WHERE m->>'user_id' = auth.uid()::text AND m->>'permission' = 'edit'
      )
    )
  )
);
