import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    token_hash?: string;
    type?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Handle email confirmation token from Supabase
  if (params.token_hash && params.type) {
    const { error } = await supabase.auth.verifyOtp({
      type: params.type as any,
      token_hash: params.token_hash,
    });

    if (!error) {
      // Email confirmed successfully
      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // User is authenticated, redirect to home
        redirect("/home");
      }

      // Show success message
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
          <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900">Email Confirmed!</h1>
            <p className="mt-4 text-lg text-gray-600">
              Your account has been successfully confirmed.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 rounded-lg bg-indigo-600 px-4 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      );
    } else {
      // Error verifying token
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
          <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-gray-900">Confirmation Failed</h1>
            <p className="mt-4 text-lg text-gray-600">
              {error.message || "There was an error confirming your email. The link may have expired."}
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 rounded-lg bg-indigo-600 px-4 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      );
    }
  }

  // Handle success/error query params (for redirects)
  if (params.success === "true") {
    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // User is authenticated, redirect to home
      redirect("/home");
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900">Email Confirmed!</h1>
          <p className="mt-4 text-lg text-gray-600">
            Your account has been successfully confirmed.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 rounded-lg bg-indigo-600 px-4 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  if (params.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900">Confirmation Failed</h1>
          <p className="mt-4 text-lg text-gray-600">
            There was an error confirming your email. The link may have expired.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 rounded-lg bg-indigo-600 px-4 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Default: redirect to login if no params
  redirect("/login");
}

