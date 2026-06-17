"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import {
  addProfile,
  deleteProfile,
  getActiveId,
  getProfiles,
  renameProfile,
  setActiveId,
  type Profile,
} from "@/lib/storage/profile";
import { requestPersist } from "@/lib/storage/db";
import { initSync } from "@/lib/storage/sync";
import { IconUser, IconChevronDown, IconPlus, IconPencil, IconTrash, IconCheck } from "@/components/icons";

export function ProfileSwitcher() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfiles(getProfiles());
    setActive(getActiveId());
    setMounted(true);
    // Ask the browser to keep our data permanently (stops Safari's 7-day wipe).
    requestPersist();
    // Start automatic cloud sync; refresh the list when other devices sync in.
    initSync();
    const onSynced = () => { setProfiles(getProfiles()); setActive(getActiveId()); };
    window.addEventListener("espanol-synced", onSynced);
    return () => window.removeEventListener("espanol-synced", onSynced);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const active = profiles.find((p) => p.id === activeId);

  const switchTo = (id: string) => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    setActiveId(id);
    // Reload so every component re-opens against the new profile's database.
    window.location.reload();
  };

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    const p = addProfile(name);
    setNewName("");
    setActiveId(p.id);
    window.location.reload();
  };

  const saveRename = (id: string) => {
    const name = editName.trim();
    if (name) renameProfile(id, name);
    setEditing(null);
    setProfiles(getProfiles());
  };

  const remove = (id: string) => {
    if (!window.confirm(t("profile.deleteConfirm"))) return;
    deleteProfile(id);
    if (id === activeId) {
      window.location.reload();
      return;
    }
    setProfiles(getProfiles());
  };

  // Stable placeholder during SSR / pre-mount to avoid hydration mismatch.
  if (!mounted) {
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-muted">
        <IconUser className="h-4 w-4" />
      </span>
    );
  }

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
        aria-label={t("profile.label")}
      >
        <IconUser className="h-4 w-4" />
        <span className="max-w-[7rem] truncate text-foreground">{active?.name ?? "—"}</span>
        <IconChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-lg">
          <div className="px-2 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("profile.label")}
          </div>
          <ul className="space-y-0.5">
            {profiles.map((p) => (
              <li key={p.id}>
                {editing === p.id ? (
                  <div className="flex items-center gap-1.5 px-1 py-1">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(p.id);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-brand"
                    />
                    <button onClick={() => saveRename(p.id)} className="rounded-md p-1.5 text-brand hover:bg-foreground/5" aria-label={t("profile.rename")}>
                      <IconCheck className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-1 rounded-lg px-1 hover:bg-foreground/5">
                    <button
                      onClick={() => switchTo(p.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-2 text-left text-sm"
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center ${p.id === activeId ? "text-brand" : "text-transparent"}`}>
                        <IconCheck className="h-4 w-4" />
                      </span>
                      <span className="truncate font-medium text-foreground">{p.name}</span>
                    </button>
                    <button
                      onClick={() => { setEditing(p.id); setEditName(p.name); }}
                      className="rounded-md p-1.5 text-muted opacity-0 transition-opacity hover:bg-foreground/10 hover:text-foreground group-hover:opacity-100"
                      aria-label={t("profile.rename")}
                    >
                      <IconPencil className="h-3.5 w-3.5" />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => remove(p.id)}
                        className="rounded-md p-1.5 text-muted opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-600 group-hover:opacity-100"
                        aria-label={t("profile.delete")}
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-1.5 flex items-center gap-1.5 border-t border-border px-1 pt-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") create(); }}
              placeholder={t("profile.new")}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={create}
              disabled={!newName.trim()}
              className="flex items-center gap-1 rounded-md bg-brand px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <IconPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
