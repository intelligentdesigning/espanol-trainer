"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { getProfiles, setActiveId, addProfile, hasPickedProfile, type Profile } from "@/lib/storage/profile";
import { pullProfiles } from "@/lib/storage/sync";
import { IconUser, IconPlus } from "@/components/icons";

/** First visit on a device: ask who is learning, so nobody writes into someone
 *  else's progress by accident. Shown once; afterwards the switcher in the nav
 *  handles changes. */
export function ProfileGate() {
  const { t } = useI18n();
  const [needsPick, setNeedsPick] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (hasPickedProfile()) return;
    setProfiles(getProfiles());
    setNeedsPick(true);
    // Local storage only knows profiles this device has seen, so a new device
    // would show none of the existing ones. Ask the cloud before offering
    // "create a profile".
    let alive = true;
    pullProfiles()
      .then((list) => { if (alive) setProfiles(list); })
      .catch(() => {})            // offline: fall back to the local list
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (!needsPick) return null;

  const choose = (id: string) => {
    setActiveId(id);
    window.location.reload(); // re-open every store against the chosen profile
  };
  const create = () => {
    const n = name.trim();
    if (!n) return;
    choose(addProfile(n).id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur">
      <div className="card w-full max-w-sm p-6 animate-pop">
        <div className="mb-1 section-label">{t("profileGate.kicker")}</div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{t("profileGate.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("profileGate.desc")}</p>

        <div className="mt-5 space-y-2">
          {loading
            ? [0, 1].map((i) => <div key={i} className="skeleton h-10 w-full rounded-lg" />)
            : profiles.map((p) => (
                <button key={p.id} onClick={() => choose(p.id)}
                  className="btn btn-secondary w-full justify-start gap-2.5">
                  <IconUser className="h-4 w-4 shrink-0 text-muted" />
                  <span className="font-semibold">{p.name}</span>
                </button>
              ))}
        </div>

        {loading ? (
          <p className="mt-3 text-center text-xs text-muted">{t("common.loading")}</p>
        ) : creating ? (
          <div className="mt-3 flex gap-2">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") create(); }}
              placeholder={t("profileGate.namePlaceholder")}
              className="input-quiz flex-1 !py-2 !text-base" />
            <button onClick={create} className="btn btn-primary btn-sm">{t("common.check")}</button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} className="btn btn-ghost mt-3 w-full gap-2">
            <IconPlus className="h-4 w-4" /> {t("profileGate.new")}
          </button>
        )}
      </div>
    </div>
  );
}
