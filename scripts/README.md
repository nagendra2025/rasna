# Cleanup Scripts

This directory contains utility scripts for managing users and cleaning up storage in the Rasna family dashboard.

## Ready-to-Use Scripts (With Your UUIDs)

### 🎯 Quick Cleanup Scripts

1. **`delete-old-test-users.sql`** - Deletes the 4 old test users (user1-4), keeps new user
2. **`delete-all-except-new-user.sql`** - Deletes ALL users except the new user
3. **`cleanup-storage-for-deleted-users.sql`** - Identifies storage files for deleted users

These scripts are ready to use with your actual UUIDs!

## Scripts

### 1. `delete-user.sql`

**Purpose:** Delete a user and all associated data from the database.

**What it deletes:**

- User account (from `auth.users`)
- User's profile (from `profiles` table) - automatic via CASCADE
- All events created by the user - automatic via CASCADE
- All tasks created by the user - automatic via CASCADE
- All notes created by the user - automatic via CASCADE
- All announcements created by the user - automatic via CASCADE
- All memories created by the user - automatic via CASCADE

**What it does NOT delete:**

- Photos in Supabase Storage (must be deleted separately)
- Data created by other users

**Usage:**

1. Open Supabase Dashboard → SQL Editor
2. Open `delete-user.sql`
3. Find the user UUID (see instructions in script)
4. Replace `USER_UUID_HERE` with the actual UUID
5. Run the DELETE statement
6. Verify deletion

**⚠️ WARNING:** This permanently deletes all user data. There is no undo!

---

### 2. `cleanup-storage.sql`

**Purpose:** Identify orphaned files in Supabase Storage that don't have matching profiles.

**What it does:**

- Identifies profile photos in storage
- Helps find files that belong to deleted users
- Provides queries to check for orphaned files

**Usage:**

1. Open Supabase Dashboard → SQL Editor
2. Run the queries to identify orphaned files
3. Manually delete files via Storage Dashboard or API

**Note:** Supabase Storage doesn't support SQL DELETE. Files must be deleted through:

- Supabase Dashboard → Storage → Browse and delete
- Supabase Storage API
- Manual deletion

---

## Workflow: Deleting a User

### Step 1: Export Data (Optional)

If you need to keep any data, export it first:

- Export user's events, tasks, notes, etc. from Supabase Dashboard
- Download user's photos from Storage

### Step 2: Delete Storage Files

1. Go to Storage → memories bucket
2. Navigate to `profiles/{user-uuid}/`
3. Delete the folder containing user's photos

### Step 3: Delete User from Database

1. Run `delete-user.sql` in SQL Editor
2. Replace UUID with the user's UUID
3. Execute the DELETE statement
4. Verify deletion

### Step 4: Verify Cleanup

1. Check that user is gone from `auth.users`
2. Check that profile is gone from `profiles`
3. Check that all user's data is deleted
4. Verify storage files are deleted

---

## Finding User UUID

### Method 1: By Email

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'user@example.com';
```

### Method 2: From Profiles Table

```sql
SELECT id, email, name
FROM profiles
WHERE email = 'user@example.com';
```

### Method 3: From Supabase Dashboard

1. Go to Authentication → Users
2. Find the user by email
3. Click on the user
4. Copy the UUID from the user details

---

## Safety Checklist

Before deleting a user:

- [ ] Verified this is the correct user
- [ ] Exported any important data (if needed)
- [ ] Noted the user's UUID
- [ ] Deleted storage files (photos)
- [ ] Backed up database (if needed)
- [ ] Verified no other users depend on this user's data

---

## Common Scenarios

### Scenario 1: Delete Test Users

```sql
-- Delete all test users (example pattern)
DELETE FROM auth.users
WHERE email LIKE '%test%'
OR email LIKE '%example.com';
```

### Scenario 2: Delete Users Created Before Date

```sql
-- Delete users created before a specific date
DELETE FROM auth.users
WHERE created_at < '2024-01-01';
```

### Scenario 3: Delete Specific Users by Email List

```sql
-- Delete multiple specific users
DELETE FROM auth.users
WHERE email IN (
  'user1@example.com',
  'user2@example.com'
);
```

---

## Troubleshooting

### Issue: "Cannot delete user - foreign key constraint"

**Solution:** This shouldn't happen with CASCADE, but if it does:

1. Check if user has data in tables without CASCADE
2. Delete dependent data first
3. Then delete the user

### Issue: "Storage files still exist after user deletion"

**Solution:** Storage files are NOT automatically deleted. You must:

1. Manually delete via Storage Dashboard
2. Or use Storage API to delete files
3. See `cleanup-storage.sql` for identification queries

### Issue: "Profile still exists after user deletion"

**Solution:**

1. Check if CASCADE is properly configured
2. Verify the trigger is working
3. Manually delete profile if needed:
   ```sql
   DELETE FROM profiles WHERE id = 'USER_UUID_HERE';
   ```

---

## Best Practices

1. **Always backup before bulk deletions**
2. **Test on a single user first**
3. **Delete storage files before database records**
4. **Verify deletions after completion**
5. **Document which users were deleted and when**
6. **Monitor storage usage regularly**

---

## Related Files

- `supabase/migrations/001_initial_schema.sql` - Database schema with CASCADE rules
- `app/api/profiles/[id]/photo/route.ts` - Profile photo upload/delete API

---

**Last Updated:** Phase 6 Implementation  
**Status:** Ready for Use
