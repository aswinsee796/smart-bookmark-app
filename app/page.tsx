"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) router.replace("/dashboard");
      });
  
    return () => subscription.unsubscribe();
  }, [router]);
  

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold">Smart Bookmark</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Save and manage your personal bookmarks in one place.
        </p>
        <p className="text-xs sm:text-sm text-gray-500">
          Login with Google to continue.
        </p>
      </div>
    </main>
  );
}
