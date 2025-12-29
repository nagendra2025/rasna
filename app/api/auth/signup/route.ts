import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculateAge } from "@/lib/utils/age";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const formData = await request.formData();
    
    // Extract form fields
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const passwordConfirmation = formData.get("passwordConfirmation") as string;
    const gender = formData.get("gender") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const nickName = formData.get("nickName") as string;
    const punchLine = formData.get("punchLine") as string | null;
    const file = formData.get("file") as File;

    // Validation
    if (!email || !password || !passwordConfirmation || !gender || !dateOfBirth || !nickName || !file) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Validate password match
    if (password !== passwordConfirmation) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Validate gender
    if (gender !== "male" && gender !== "female") {
      return NextResponse.json(
        { error: "Invalid gender selection" },
        { status: 400 }
      );
    }

    // Validate file
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Profile picture must be an image file" },
        { status: 400 }
      );
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Profile picture must be less than 2MB" },
        { status: 400 }
      );
    }

    // Validate date of birth (must be in the past)
    const dob = new Date(dateOfBirth);
    const today = new Date();
    if (dob >= today) {
      return NextResponse.json(
        { error: "Date of birth must be in the past" },
        { status: 400 }
      );
    }

    // Calculate age
    const age = calculateAge(dateOfBirth);

    // Determine role based on age and gender
    let role: string;
    if (age < 26) {
      role = gender === "male" ? "son" : "daughter";
    } else {
      role = gender === "male" ? "father" : "mother";
    }

    // Generate temporary user ID for file upload (we'll use a temp UUID)
    // Actually, we need to create the user first, then upload the photo
    // But we can't upload to storage without auth. Let's create user first with a placeholder,
    // then update with photo. Actually, better approach: create user, get ID, upload photo, update profile.

    // Create user account first (without photo)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`,
        data: {
          role,
          gender,
          date_of_birth: dateOfBirth,
          nick_name: nickName,
          punch_line: punchLine || null,
          // photo_url will be added after upload
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    let publicUrl: string | null = null;

    // Try to upload profile picture to Supabase Storage
    // Note: After signup, the user session might not be immediately available in server context
    // So we'll try to upload, but if it fails, we'll continue without photo
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `profiles/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("memories")
        .upload(fileName, arrayBuffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (!uploadError && uploadData) {
        // Get public URL
        const {
          data: { publicUrl: url },
        } = supabase.storage.from("memories").getPublicUrl(fileName);
        publicUrl = url;
      } else {
        console.warn("Photo upload failed (user can add later):", uploadError?.message);
      }
    } catch (uploadErr: any) {
      // Upload failed - not critical, user can add photo later
      console.warn("Photo upload error (non-critical):", uploadErr.message);
    }

    // Update user metadata and profile with photo URL if upload was successful
    if (publicUrl) {
      // Update user metadata with photo URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          photo_url: publicUrl,
        },
      });

      if (updateError) {
        console.error("Failed to update user metadata:", updateError);
      }

      // Wait a bit for profile trigger to run, then update profile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          photo_url: publicUrl,
        })
        .eq("id", userId);

      if (profileError) {
        // Profile might not exist yet (trigger might be delayed)
        // This is OK, the trigger will create it with metadata
        console.error("Profile update error (may be expected):", profileError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. Please check your email to confirm your account.",
        user: {
          id: userId,
          email: authData.user.email,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    
    // Ensure we always return valid JSON
    const errorMessage = error?.message || "An error occurred during signup";
    
    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

