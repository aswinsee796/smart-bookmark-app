"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  user_id: string;
};

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user || !mounted) return;

      setUserId(user.id);
      await fetchBookmarks(user.id);

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      channelRef.current = supabase
        .channel(`bookmarks-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchBookmarks(user.id);
          }
        )
        .subscribe();
    };

    init();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const fetchBookmarks = async (uid: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("id, title, url, user_id")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (data) setBookmarks(data);
  };

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !userId) return;

    setLoading(true);

    const { error } = await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: userId,
    });

    if (!error) {
      setTitle("");
      setUrl("");
      fetchBookmarks(userId); // local instant update
    }

    setLoading(false);
  };

  const deleteBookmark = async (id: string) => {
    if (!userId) return;
  
    // 1️⃣ Optimistic UI update (remove immediately)
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  
    // 2️⃣ Delete from DB
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
  
    // 3️⃣ If delete fails, rollback UI
    if (error) {
      console.error("Delete failed:", error.message);
      fetchBookmarks(userId);
      alert("Delete failed. Please refresh.");
    }
  };
  

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          My Bookmarks
        </h2>

        <form
          onSubmit={addBookmark}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 space-y-3"
        >
          <input
            type="text"
            placeholder="Title"
            className="w-full px-3 py-2 rounded bg-black border border-zinc-700 text-white text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="url"
            placeholder="https://example.com"
            className="w-full px-3 py-2 rounded bg-black border border-zinc-700 text-white text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 rounded bg-white text-black hover:bg-gray-200 text-sm"
          >
            {loading ? "Adding..." : "Add Bookmark"}
          </button>
        </form>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowBookmarks((p) => !p)}
            className="px-4 py-2 rounded-md border border-white/20 text-sm hover:bg-white/10"
          >
            {showBookmarks ? "Hide Bookmarks" : "See Your Bookmarks"}
          </button>
        </div>

        {showBookmarks && (
          <div className="space-y-3">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-3"
              >
                <div className="break-all">
                  <p className="font-medium text-sm">{bm.title}</p>
                  <a
                    href={bm.url}
                    target="_blank"
                    className="text-xs sm:text-sm text-blue-400 hover:underline"
                  >
                    {bm.url}
                  </a>
                </div>
                <button
  onClick={() => deleteBookmark(bm.id)}
  className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
>
  Delete
</button>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
