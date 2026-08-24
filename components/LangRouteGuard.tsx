"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/lang";
import { isKaSection } from "@/lib/sections";

/** The static export ships every route for every language, so a Georgian
 *  learner could open /themen/ or /zahlen/ by URL and sit in front of a loading
 *  state that never resolves — those pages wait on data files Georgian has no
 *  equivalent for. Send them back to the start page instead.
 *
 *  Only Georgian is guarded: Spanish and German have all of their sections, and
 *  redirecting there would be a behaviour change for pages that already work. */
export function LangRouteGuard() {
  const { lang, picked } = useLang();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // `picked` flips in the provider's own effect, together with `lang` — before
    // that, `lang` is still the "es" default and would redirect the wrong people.
    if (!picked || lang !== "ka") return;
    if (isKaSection(pathname)) return;
    router.replace("/");
  }, [lang, picked, pathname, router]);

  return null;
}
