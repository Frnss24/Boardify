"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { type SharePermission, verifyShareCode } from "@/lib/share";
import { isInvalidRefreshTokenError } from "@/lib/auth-utils";

export default function ShareJoinPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Validating share link...");

  useEffect(() => {
    const run = async () => {
      const shareCode = params.token;
      const permission = searchParams.get("permission") as SharePermission | null;
      const nextUrl = `/share/${shareCode}?permission=${permission || "view_only"}`;

      if (!verifyShareCode(shareCode) || !permission) {
        setMessage("Invalid share link.");
        return;
      }

      if (typeof window === "undefined") {
        setMessage("Loading share link...");
        return;
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let session;
      try {
        const result = await supabase.auth.getSession();
        session = result.data.session;
      } catch (error) {
        if (isInvalidRefreshTokenError(error)) {
          await supabase.auth.signOut();
          router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
          return;
        }
        throw error;
      }

      if (!session?.user) {
        router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      const accessToken = session.access_token;
      const joinResponse = await fetch('/api/share/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ shareCode, permission }),
      });

      if (!joinResponse.ok) {
        const payloadData = await joinResponse.json().catch(() => ({}));
        setMessage(payloadData.error || 'Failed to join board.');
        return;
      }

      const payloadData = await joinResponse.json().catch(() => ({}));
      setMessage("You have joined the board.");
      router.push(`/user?boardId=${encodeURIComponent(payloadData.boardId || shareCode)}`);
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
