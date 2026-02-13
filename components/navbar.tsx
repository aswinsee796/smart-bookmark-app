"use client";

import { useEffect, useState } from "react";
import LoginButton from "./loginbutton";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type UserInfo = {
  name: string | null;
  email: string | null;
  avatar: string | null;
};

export default function Navbar() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
  
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
  
      if (!mounted) return;
  
      if (u) {
        setUser({
          name: u.user_metadata?.full_name || u.user_metadata?.name || null,
          email: u.email ?? null,
          avatar: u.user_metadata?.avatar_url || null,
        });
      } else {
        setUser(null);
      }
    };
  
    loadSession();
  
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user;
  
        if (!mounted) return;
  
        if (u) {
          setUser({
            name: u.user_metadata?.full_name || u.user_metadata?.name || null,
            email: u.email ?? null,
            avatar: u.user_metadata?.avatar_url || null,
          });
        } else {
          setUser(null);
          router.replace("/"); // ✅ safe redirect
        }
      });
  
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);
  

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="w-full border-b border-gray-800 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left */}
        <h1 className="text-base sm:text-lg font-semibold">
          Smart Bookmark
        </h1>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}

              {/* Desktop: name + email */}
              <div className="hidden sm:block text-right leading-tight">
                <p className="text-sm font-medium">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-gray-400">
                  {user.email}
                </p>
              </div>

              {/* Mobile: name only */}
              <p className="sm:hidden text-sm font-medium">
                {user.name || "User"}
              </p>

              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1.5 rounded-md border border-white/20 text-xs sm:text-sm hover:bg-white/10 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </nav>
  );
}
