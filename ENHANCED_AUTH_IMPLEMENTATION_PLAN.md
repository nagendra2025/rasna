# Enhanced Authentication & Profile Implementation Plan

**Status:** Planning Phase  
**Last Updated:** Current Session

---

## Overview

This document outlines the implementation plan for:
1. Enhanced signup with multiple fields (email, password, gender, date of birth, profile picture, nick name, punch line)
2. Automatic role assignment based on age and gender
3. Email confirmation enabled
4. Profile picture display on login and home page
5. Data cleanup when users are removed

---

## Key Questions Answered

### Q1: What happens to existing data when users are removed?

**Answer:** Due to `ON DELETE CASCADE` in the database schema:

✅ **Automatically Deleted:**
- User's profile (from `profiles` table)
- All events created by that user
- All tasks created by that user
- All notes created by that user
- All announcements created by that user
- All memories created by that user

⚠️ **NOT Automatically Deleted:**
- Photos in Supabase Storage (need cleanup script)
- Any data created by other users remains intact

**Recommendation:** Before removing users, export important data if needed.

### Q2: How to decide if a user is father, mother, son, or daughter?

**Automatic Role Assignment Based on Age and Gender:**

**Logic:**
- **Age < 26 years:**
  - Male → **Son**
  - Female → **Daughter**
- **Age >= 26 years:**
  - Male → **Father**
  - Female → **Mother**

**Implementation:**
- Calculate age from date of birth during signup
- Determine gender from signup form
- Automatically assign role based on logic above
- No user selection needed - fully automatic

---

## Implementation Phases

### Phase 1: Database & Backend Updates
**Goal:** Prepare database for enhanced signup with all new fields

**Database Changes:**
1. Update `profiles` table to store:
   - `nick_name` (TEXT) - For personalized greeting
   - `gender` (TEXT) - Male/Female
   - `punch_line` can use existing `bio` field
2. Update profile creation trigger to accept:
   - role (calculated from age + gender)
   - photo_url
   - date_of_birth
   - nick_name (stored as `name` field)
   - punch_line (stored as `bio` field)
   - gender (new field)

**Tasks:**
1. Create migration to add `gender` field to profiles table
2. Update `handle_new_user()` trigger function
3. Create cleanup script for orphaned storage files (optional)
4. Verify RLS policies still work

**Files to Create/Modify:**
- `supabase/migrations/006_enhanced_signup.sql` - Add gender field, update trigger
- `supabase/migrations/007_cleanup_orphaned_files.sql` (optional utility)

**Estimated Time:** 1-2 hours

---

### Phase 2: Enhanced Signup Flow
**Goal:** Create comprehensive signup form with automatic role assignment

**Signup Form Fields (All Required):**
1. **Email** - Username (required)
2. **Password** - (required, min 6 chars)
3. **Password Confirmation** - (required, must match password)
4. **Gender** - Dropdown: Male / Female (required)
5. **Date of Birth** - Date picker (required, for age calculation)
6. **Profile Picture** - File upload (required, max 2MB)
7. **Nick Name** - Text input (required, used for greeting)
8. **Punch Line** - Text input (optional, can be used as bio)

**Role Assignment Logic:**
- Calculate age from date of birth
- If age < 26:
  - Male → Role = "son"
  - Female → Role = "daughter"
- If age >= 26:
  - Male → Role = "father"
  - Female → Role = "mother"

**Tasks:**
1. Update signup page UI with all required fields
2. Add form validation:
   - Password confirmation match
   - Age calculation
   - File size validation
   - All required fields
3. Create signup API route:
   - Handle file upload to Supabase Storage
   - Calculate age from date of birth
   - Determine role based on age + gender
   - Create user account with metadata
   - Create profile with all fields (photo_url, role, nick_name, punch_line, date_of_birth)
4. Handle email confirmation flow:
   - Show "Check your email" message
   - Create email confirmation page
   - Redirect after confirmation

**Files to Create/Modify:**
- `app/signup/page.tsx` - Enhanced signup form with all fields
- `app/api/auth/signup/route.ts` - Signup API with role logic
- `app/auth/confirm/route.ts` - Email confirmation handler
- `app/auth/confirm/page.tsx` - Confirmation success page
- `lib/utils/age.ts` - Age calculation utility (already exists, may need updates)

**Estimated Time:** 4-5 hours

---

### Phase 3: Login Flow (Simple)
**Goal:** Keep login simple - only email and password

**Login Requirements:**
- Only two fields: Email and Password
- No changes needed to existing login page
- After successful login, redirect to home page
- Home page will show profile picture and greeting

**Tasks:**
1. Verify existing login page works (should already be simple)
2. Ensure redirect to home page after login
3. No changes needed if login is already simple

**Files to Check:**
- `app/login/page.tsx` - Should only have email and password fields ✅

**Estimated Time:** 15 minutes (verification only)

---

### Phase 4: Profile Picture Display & Home Page Greeting
**Goal:** Show profile picture and personalized greeting on home page

**Home Page Requirements:**
- Display user's profile picture in **round shape** (circular)
- Show greeting: **"Hello [Nick Name]"** (e.g., "Hello Raji")
- Profile picture should be prominent and visible immediately after login

**Tasks:**
1. Update home page:
   - Fetch user profile (including nick_name and photo_url)
   - Display circular profile picture (large, 80-100px)
   - Show personalized greeting: "Hello [nick_name]"
   - Add fallback if no photo (initial letter)
2. Update navigation to show user's profile picture (small, 32px)
3. Ensure "Meet the Family" page uses profile pictures (already done ✅)

**Files to Modify:**
- `app/home/page.tsx` - Add profile picture and greeting
- `components/navigation.tsx` - Add profile picture (optional, for consistency)
- `components/family-member-card.tsx` - Already uses photo_url ✅

**Estimated Time:** 2-3 hours

---

### Phase 5: Email Confirmation Setup
**Goal:** Enable and configure email confirmation in Supabase

**Tasks:**
1. Enable email confirmation in Supabase Dashboard
2. Configure email templates (optional)
3. Test email delivery
4. Update signup flow to handle confirmation (remove auto-login)

**Files to Modify:**
- Supabase Dashboard settings (no code changes)
- `app/signup/page.tsx` - Remove auto-login, show "Check your email" message
- `app/auth/confirm/route.ts` - Handle email confirmation
- `app/auth/confirm/page.tsx` - Confirmation success page

**Estimated Time:** 1 hour

---

### Phase 6: Data Cleanup & User Management
**Goal:** Provide tools for removing users and cleaning up data

**Tasks:**
1. Create admin utility script for user deletion
2. Create storage cleanup script
3. Document data export process (if needed)
4. Add user management page (optional, for future)

**Files to Create:**
- `scripts/delete-user.sql` - SQL script for user deletion
- `scripts/cleanup-storage.sql` - Cleanup orphaned files
- `USER_MANAGEMENT.md` - Documentation

**Estimated Time:** 1-2 hours

---

## Detailed Implementation

### Phase 1: Database Updates

#### Migration: `006_enhanced_signup.sql`

```sql
-- Update handle_new_user function to accept all new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role, 
    photo_url, 
    date_of_birth,
    bio
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nick_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    NEW.raw_user_meta_data->>'photo_url',
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'punch_line'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note:** 
- Role is calculated in signup API and passed via metadata
- All fields (photo_url, date_of_birth, nick_name, punch_line) are passed via metadata
- `name` field uses `nick_name` from metadata
- `bio` field uses `punch_line` from metadata

---

### Phase 2: Enhanced Signup Flow

#### Signup Form Fields (All Required)

1. **Email** (required) - Used as username
2. **Password** (required, min 6 characters)
3. **Password Confirmation** (required, must match password)
4. **Gender** (required dropdown):
   - Male
   - Female
5. **Date of Birth** (required) - Used for age calculation and role assignment
6. **Profile Picture** (required, max 2MB) - JPG, PNG, or GIF
7. **Nick Name** (required) - Used for personalized greeting (e.g., "Hello Raji")
8. **Punch Line** (optional) - Can be used as bio or tagline

#### Signup Flow

1. User fills all form fields:
   - Email, Password, Password Confirmation
   - Gender, Date of Birth
   - Profile Picture (upload)
   - Nick Name, Punch Line
2. Form validation:
   - Passwords match
   - All required fields filled
   - Profile picture is valid image (< 2MB)
   - Date of birth is in the past
3. Calculate age from date of birth
4. Determine role automatically:
  - Age < 26 + Male = "son"
  - Age < 26 + Female = "daughter"
  - Age >= 26 + Male = "father"
  - Age >= 26 + Female = "mother"
5. Upload photo to Supabase Storage (get URL)
6. Sign up with Supabase Auth (include metadata: role, photo_url, nick_name, punch_line, date_of_birth, gender)
7. Profile auto-created with all fields via trigger
8. Show "Check your email" message
9. User confirms email via link
10. Redirect to login page (or auto-login after confirmation)

---

### Phase 3: Email Confirmation

#### Supabase Settings

1. Go to **Authentication → Settings**
2. Under **Email Auth**, **Enable** "Enable email confirmations"
3. Configure email template (optional)
4. Save settings

#### Confirmation Flow

1. User signs up → Email sent
2. User clicks confirmation link
3. Redirected to `/auth/confirm`
4. Account confirmed
5. Auto-login or redirect to login page

---

### Phase 4: Profile Picture Display

#### Navigation Bar

Add user's profile picture next to "Sign Out" button:
- Small circular image (32x32px)
- Fallback to initial letter if no photo
- Click to go to profile/Family page

#### Home Page Welcome

Update welcome message to show:
- User's profile picture (larger, 64x64px)
- "Welcome back, [Name]!" with photo

---

### Phase 5: User Deletion

#### SQL Script for User Deletion

```sql
-- Delete user and all associated data
-- WARNING: This permanently deletes all user data!

-- 1. Delete user (cascades to profile and all related data)
DELETE FROM auth.users WHERE id = 'user-uuid-here';

-- 2. Cleanup storage files (run separately)
-- See cleanup-storage.sql script
```

#### Storage Cleanup Script

```sql
-- Find orphaned files (files without matching profiles)
-- This is a utility query, actual cleanup done via API or dashboard
SELECT 
  name,
  bucket_id,
  created_at
FROM storage.objects
WHERE bucket_id = 'memories'
AND name LIKE 'profiles/%'
AND name NOT IN (
  SELECT 'profiles/' || id || '/%' 
  FROM profiles
);
```

---

## Role Assignment Logic

### Automatic Role Assignment Based on Age and Gender

**Calculation:**
1. Get date of birth from signup form
2. Calculate age: `current_date - date_of_birth`
3. Get gender from signup form
4. Apply logic:
   ```
   IF age < 26:
     IF gender == "male": role = "son"
     IF gender == "female": role = "daughter"
   ELSE (age >= 26):
     IF gender == "male": role = "father"
     IF gender == "female": role = "mother"
   ```

**Implementation:**
- Done in signup API route before creating user
- Role is passed to Supabase Auth via metadata
- Profile trigger uses role from metadata

**UI Flow:**
```
Signup Form:
├── Email (username)
├── Password
├── Password Confirmation
├── Gender: [Dropdown: Male / Female]
├── Date of Birth: [Date picker] → Used for age calculation
├── Profile Picture: [Upload, required]
├── Nick Name: [Text input] → Used for "Hello [Nick Name]"
└── Punch Line: [Text input, optional] → Used as bio

[Submit Button]
↓
Backend calculates:
├── Age from date of birth
├── Role from age + gender
└── Creates account with all metadata
```

---

## File Structure Changes

### New Files

```
app/
├── api/
│   └── auth/
│       └── signup/
│           └── route.ts          # Enhanced signup API
├── auth/
│   └── confirm/
│       ├── route.ts              # Email confirmation handler
│       └── page.tsx              # Confirmation success page
└── signup/
    └── page.tsx                  # Updated signup form

supabase/
└── migrations/
    ├── 006_enhanced_signup.sql   # Update profile trigger
    └── 007_cleanup_orphaned_files.sql  # Utility script

scripts/
├── delete-user.sql               # User deletion script
└── cleanup-storage.sql           # Storage cleanup script
```

### Modified Files

```
components/
└── navigation.tsx                # Add profile picture

app/
└── home/
    └── page.tsx                  # Show profile picture in welcome
```

---

## Testing Checklist

### Phase 1: Database
- [ ] Migration runs successfully
- [ ] Profile trigger works with role and photo_url
- [ ] RLS policies still work

### Phase 2: Signup
- [ ] Can upload profile picture
- [ ] Can select role
- [ ] Profile created with correct data
- [ ] Photo stored in Supabase Storage
- [ ] Photo URL saved in profile

### Phase 3: Email Confirmation
- [ ] Email sent on signup
- [ ] Confirmation link works
- [ ] User confirmed after clicking link
- [ ] Redirects correctly after confirmation

### Phase 4: Display
- [ ] Profile picture shows in navigation
- [ ] Profile picture shows on home page
- [ ] Profile picture shows in "Meet the Family"
- [ ] Fallback works (initial letter)

### Phase 5: Cleanup
- [ ] User deletion script works
- [ ] All user data deleted
- [ ] Storage cleanup script identifies orphaned files

---

## Implementation Order

**Recommended Sequence:**

1. **Phase 1** - Database updates (foundation)
2. **Phase 2** - Enhanced signup with all fields and role logic (core feature)
3. **Phase 3** - Verify login is simple (quick check)
4. **Phase 4** - Profile picture display and greeting on home page (UI)
5. **Phase 5** - Enable email confirmation (Supabase settings)
6. **Phase 6** - Cleanup scripts (utilities)

**Total Estimated Time:** 9-13 hours

---

## Implementation Details Confirmed

✅ **Signup Fields:**
- Email (username)
- Password
- Password Confirmation
- Gender (Male/Female)
- Date of Birth
- Profile Picture (required)
- Nick Name (for greeting)
- Punch Line (optional, used as bio)

✅ **Role Assignment:**
- Automatic based on age + gender
- Age < 26: Male = Son, Female = Daughter
- Age >= 26: Male = Father, Female = Mother

✅ **Login:**
- Simple: Only email and password

✅ **Home Page:**
- Circular profile picture
- Greeting: "Hello [Nick Name]"

## Questions to Confirm

Before starting implementation, please confirm:

1. **Nick Name vs Name:** Should `nick_name` replace the `name` field, or should we keep both?
2. **Punch Line:** Should this be stored in the `bio` field or a separate field?
3. **Gender Storage:** Should we add a `gender` field to profiles table, or calculate from role?
4. **Email Template:** Do you want to customize the confirmation email?
5. **Data Export:** Do you need to export data before deleting users?

---

## Next Steps

1. **Review this plan** and confirm approach
2. **Answer questions** above
3. **Start with Phase 1** (database updates)
4. **Test each phase** before moving to next
5. **Deploy incrementally** (can deploy after each phase)

---

**Status:** Ready for Review  
**Awaiting:** Your confirmation on approach and answers to questions

