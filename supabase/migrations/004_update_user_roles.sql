-- ============================================
-- UPDATE USER ROLES
-- ============================================
-- This migration updates specific users to parent/kid roles

-- STEP 1: First, let's see all users and their current roles
-- Run this query first to see all users:
SELECT 
  email, 
  name, 
  role, 
  created_at,
  ROW_NUMBER() OVER (ORDER BY created_at) as user_number
FROM profiles
ORDER BY created_at;

-- STEP 2: Update roles based on user order (user2, user3, user4)
-- This assumes users are ordered by creation time

-- Update user2 (2nd user) to parent role
UPDATE profiles 
SET role = 'parent'
WHERE id = (
  SELECT id FROM profiles 
  ORDER BY created_at 
  OFFSET 1 LIMIT 1
);

-- Update user3 (3rd user) to kid role (son)
UPDATE profiles 
SET role = 'son'
WHERE id = (
  SELECT id FROM profiles 
  ORDER BY created_at 
  OFFSET 2 LIMIT 1
);

-- Update user4 (4th user) to kid role (daughter)
UPDATE profiles 
SET role = 'daughter'
WHERE id = (
  SELECT id FROM profiles 
  ORDER BY created_at 
  OFFSET 3 LIMIT 1
);

-- STEP 3: Verify the updates
SELECT email, name, role, created_at
FROM profiles
ORDER BY created_at;

-- ALTERNATIVE: If you know the exact emails, use these instead:
-- UPDATE profiles SET role = 'parent' WHERE email = 'user2@example.com';
-- UPDATE profiles SET role = 'son' WHERE email = 'user3@example.com';
-- UPDATE profiles SET role = 'daughter' WHERE email = 'user4@example.com';

