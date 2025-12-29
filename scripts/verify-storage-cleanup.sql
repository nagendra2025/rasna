-- ============================================
-- VERIFY STORAGE CLEANUP
-- ============================================
-- This script helps verify which storage folders remain
-- and which ones should be deleted.

-- ============================================
-- Current Status Check
-- ============================================
-- Run this to see all profile folders currently in storage:

WITH folder_paths AS (
  SELECT 
    SPLIT_PART(name, '/', 1) || '/' || SPLIT_PART(name, '/', 2) as folder_path,
    SPLIT_PART(name, '/', 2) as user_uuid
  FROM storage.objects
  WHERE bucket_id = 'memories'
  AND name LIKE 'profiles/%'
)
SELECT 
  folder_path,
  COUNT(*) as file_count,
  CASE 
    WHEN user_uuid = '5e1bb665-1f00-429c-9bc6-a6b0a2de7dce' 
    THEN '✅ KEEP (New User)'
    WHEN user_uuid IN (
      '151489ab-372e-4b6f-9b95-6dc5eaa4bd13',
      'ca45fd2b-4a47-46d4-9d2b-e2de3d5a95a1',
      '2bbd25c5-4cb7-4b4c-8339-7816e25a4b52',
      'b6d264de-7a5c-4d20-8bcc-4b5d4caf1e7c'
    )
    THEN '❌ DELETE (Old Test User)'
    ELSE '⚠️ UNKNOWN - Check if should be deleted'
  END as action
FROM folder_paths
GROUP BY folder_path, user_uuid
ORDER BY action, folder_path;

-- ============================================
-- Folders That Should Be Deleted
-- ============================================
-- These folders belong to deleted users and should be removed:

-- ❌ DELETE THESE:
-- - profiles/151489ab-372e-4b6f-9b95-6dc5eaa4bd13/ (user1@example.com)
-- - profiles/ca45fd2b-4a47-46d4-9d2b-e2de3d5a95a1/ (user2@example.com)
-- - profiles/2bbd25c5-4cb7-4b4c-8339-7816e25a4b52/ (user3@example.com)
-- - profiles/b6d264de-7a5c-4d20-8bcc-4b5d4caf1e7c/ (user4@example.com)

-- ✅ KEEP THIS:
-- - profiles/5e1bb665-1f00-429c-9bc6-a6b0a2de7dce/ (adapalanagendra.canada@gmail.com)

-- ============================================
-- List Files in Folders to Delete
-- ============================================
-- Uncomment to see files in folders that should be deleted:

-- SELECT 
--   name as file_path,
--   created_at
-- FROM storage.objects
-- WHERE bucket_id = 'memories'
-- AND (
--   name LIKE 'profiles/151489ab-372e-4b6f-9b95-6dc5eaa4bd13/%' OR
--   name LIKE 'profiles/ca45fd2b-4a47-46d4-9d2b-e2de3d5a95a1/%' OR
--   name LIKE 'profiles/2bbd25c5-4cb7-4b4c-8339-7816e25a4b52/%' OR
--   name LIKE 'profiles/b6d264de-7a5c-4d20-8bcc-4b5d4caf1e7c/%'
-- )
-- ORDER BY created_at DESC;

