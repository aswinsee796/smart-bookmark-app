"use client";

import { supabase } from "@/lib/supabaseClient";

export default function LoginButton() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full sm:w-auto px-4 py-2 rounded bg-white text-black hover:bg-gray-200 text-sm"
    >
      Login with Google
    </button>
  );
}
