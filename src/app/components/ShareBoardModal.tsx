"use client";

import { useState } from "react";
import { type SharePermission } from "@/lib/share";

type ShareBoardModalProps = {
  boardShareCode: string | null;
  boardName: string;
  open: boolean;
  onClose: () => void;
};

export function ShareBoardModal({ boardShareCode, boardName, open, onClose }: ShareBoardModalProps) {
  const [permission, setPermission] = useState<SharePermission>("view_only");
  const [copied, setCopied] = useState(false);

  const shareLink = typeof window === "undefined" || !boardShareCode
    ? ""
    : `${window.location.origin}/share/${boardShareCode}?permission=${permission}`;

  if (!open) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Share board</h2>
          <p className="text-sm text-gray-500">{boardName}</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Permission</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPermission("view_only")}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${permission === "view_only" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-700"}`}
            >
              View only
            </button>
            <button
              type="button"
              onClick={() => setPermission("edit")}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${permission === "edit" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-700"}`}
            >
              View + Edit
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-gray-100 p-3 text-xs break-all text-gray-700">
          {boardShareCode ? shareLink : "No share code available yet."}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
