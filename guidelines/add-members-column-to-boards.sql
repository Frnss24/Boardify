-- Add members column to boards table to track board members and their permissions
ALTER TABLE boards 
ADD COLUMN members JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN boards.members IS 
'Array of members with their access level. Format: [{"user_id": "uuid", "permission": "owner|edit|view_only", "joined_at": "timestamp"}]';

-- Create index for better query performance
CREATE INDEX idx_boards_members ON boards USING GIN(members);
