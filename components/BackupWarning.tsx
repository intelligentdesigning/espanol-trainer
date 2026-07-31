"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { onSyncStatus, daysSinceBackup, syncNow } from "@/lib/storage/sync";
import { exportData } from "@/lib/storage/db";
import { getActiveProfile } from "@/lib/storage/profile";
import { IconShield, IconDownload } from "@/components/icons";

const STALE_DAYS = 3;      // quiet until the cloud backup is this far behind
const DISMISS_KEY = "backup-warn-dismissed";

/** Stays out of the way — but speaks up when the cloud backup has not gone
 *  through for days, so progress can be secured before anything is at risk. */
export function BackupWarning() {
  const { t } = useI18n();
  const [stale, setStale] = useState<number | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const check = () => {
      const d = daysSinceBackup();
      // never synced on this device counts as stale too (cloud may be down)
      setStale(d === null ? 99 : d);
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      setHidden(Date.now() < until);
    };
    check();
    const off = onSyncStatus(check);
    const id = setInterval(check, 60000);
    return () => { off(); clearInterval(id); };
  }, []);

  if (hidden || stale === null || stale < STALE_DAYS) return null;

  const save = async () => {
    const data = await exportData();
    const safe = getActiveProfile().name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "profil";
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `espanol-trainer-${safe}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const snooze = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 86400000)); // 1 day
    setHidden(true);
  };

  return (
    <div className="mb-4 rounded-xl border-2 border-brand-2/40 bg-brand-2/10 p-4 text-sm">
      <div className="flex items-start gap-2.5">
        <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-brand-2" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-brand-2">{t("backupWarn.title")}</div>
          <p className="mt-0.5 text-foreground/80">
            {stale >= 99 ? t("backupWarn.never") : t("backupWarn.days").replace("{n}", String(stale))}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button onClick={save} className="btn btn-primary btn-sm gap-1.5">
              <IconDownload className="h-3.5 w-3.5" /> {t("backupWarn.save")}
            </button>
            <button onClick={() => void syncNow()} className="btn btn-secondary btn-sm">{t("sync.now")}</button>
            <button onClick={snooze} className="btn btn-ghost btn-sm">{t("backupWarn.later")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
