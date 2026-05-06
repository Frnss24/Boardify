"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Users, Crown, ShieldCheck, Eye } from "lucide-react";
import { type SharePermission } from "@/lib/share";

type BoardMember = {
  user_id: string;
  permission: SharePermission | "owner";
  joined_at?: string;
};

type BoardMembersProps = {
  boardId: string | null;
  boardName: string;
  ownerId: string | null;
  members: BoardMember[];
};

type MemberProfile = {
  id: string;
  name: string | null;
  email: string | null;
};

const permissionMeta: Record<BoardMember["permission"], { label: string; icon: typeof Eye; className: string }> = {
  owner: { label: "Owner", icon: Crown, className: "bg-amber-50 text-amber-700 border-amber-200" },
  edit: { label: "Contributor", icon: ShieldCheck, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  view_only: { label: "View only", icon: Eye, className: "bg-sky-50 text-sky-700 border-sky-200" },
};

export function BoardMembers({ boardId, boardName, ownerId, members }: BoardMembersProps) {
  const [profiles, setProfiles] = useState<Record<string, MemberProfile>>({});

  const normalizedMembers = useMemo(() => {
    const nextMembers = [...members];
    if (ownerId && !nextMembers.some((member) => member.user_id === ownerId)) {
      nextMembers.unshift({ user_id: ownerId, permission: "owner", joined_at: undefined });
    }
    return nextMembers;
  }, [members, ownerId]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!boardId || normalizedMembers.length === 0) {
        setProfiles({});
        return;
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const ids = Array.from(new Set(normalizedMembers.map((member) => member.user_id)));
      const { data } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", ids);

      const nextProfiles: Record<string, MemberProfile> = {};
      (data || []).forEach((profile) => {
        nextProfiles[profile.id] = profile;
      });
      setProfiles(nextProfiles);
    };

    void fetchProfiles();
  }, [boardId, normalizedMembers]);

  if (!boardId) return null;

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Users size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Board Members</h3>
          <p className="text-xs text-gray-500">People who can access {boardName}</p>
        </div>
      </div>

      <div className="space-y-3">
        {normalizedMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            No members yet.
          </div>
        ) : (
          normalizedMembers.map((member) => {
            const profile = profiles[member.user_id];
            const displayName = profile?.name || profile?.email?.split("@")[0] || member.user_id.slice(0, 8);
            const meta = permissionMeta[member.permission];
            const Icon = meta.icon;

            return (
              <div key={member.user_id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                  <p className="truncate text-xs text-gray-500">{profile?.email || member.user_id}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                  <Icon size={12} />
                  {meta.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
