"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { verifyShareToken, type SharePermission } from "@/lib/share";

export default function ShareJoinPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Validating share link...");

  useEffect(() => {
    const run = async () => {
      const token = params.token;
      const boardId = searchParams.get("board");
      const permission = searchParams.get("permission") as SharePermission | null;
      const payload = searchParams.get("payload");

      if (!token || !boardId || !permission || !payload) {
        setMessage("Invalid share link.");
        return;
      }

      if (!verifyShareToken(token, decodeURIComponent(payload))) {
        setMessage("Share link verification failed.");
        return;
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        const nextUrl = `/share/${token}?board=${boardId}&permission=${permission}&payload=${payload}`;
        router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      const userId = session.user.id;
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("members")
        .eq("id", boardId)
        .maybeSingle();

      if (boardError) {
        setMessage(boardError?.message || "Board not found.");
        return;
      }

      if (!boardData) {
        setMessage("Board not found.");
        return;
      }

      const members = Array.isArray(boardData.members) ? boardData.members : [];
      const existingIndex = members.findIndex((member: any) => member.user_id === userId);
      const nextMember = {
        user_id: userId,
        permission,
        joined_at: new Date().toISOString(),
      };

      const nextMembers = existingIndex >= 0
        ? members.map((member: any, index: number) => (index === existingIndex ? nextMember : member))
        : [...members, nextMember];

      const { error: updateError } = await supabase
        .from("boards")
        .update({ members: nextMembers })
        .eq("id", boardId);

      if (updateError) {
        setMessage(updateError.message);
        return;
      }

      setMessage("You have joined the board.");
      router.push("/user");
    };

    void run();
  }, [params.token, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <h1 className="text-2xl font-bold">Join shared board</h1>
        <p className="mt-3 text-sm text-gray-300">{message}</p>
      </div>
    </div>
  );
}
