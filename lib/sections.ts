import type { UIKey } from "@/lib/i18n/strings";

/** The sections the Georgian mode actually has. Defined once so the navigation
 *  and the route guard cannot drift apart: every other route still exists as a
 *  static file, and opening one by URL used to leave the page spinning on data
 *  that does not exist for Georgian. */
export const KA_SECTIONS: { href: string; key: UIKey }[] = [
  { href: "/", key: "nav.home" },
  { href: "/grammatik", key: "nav.grammar" },
  { href: "/satzbau", key: "nav.sentence" },
  { href: "/stats", key: "nav.stats" },
];

/** Is this path part of the Georgian mode? Trailing slashes are ignored. */
export function isKaSection(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/") return true;
  return KA_SECTIONS.some(({ href }) => href !== "/" && (p === href || p.startsWith(`${href}/`)));
}
