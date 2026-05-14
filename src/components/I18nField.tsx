import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type I18nValue = { ar?: string; en?: string; fr?: string };

export const LANGS: { key: keyof I18nValue; label: string; dir?: "rtl" | "ltr" }[] = [
  { key: "fr", label: "Français" },
  { key: "en", label: "English" },
  { key: "ar", label: "العربية", dir: "rtl" },
];

/** Normalize anything (string | object | JSON-string | null) into an I18nValue. */
export function toI18n(v: any): I18nValue {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      if (p && typeof p === "object") return p;
    } catch { /* not JSON */ }
    return { fr: v };
  }
  if (typeof v === "object") return v as I18nValue;
  return {};
}

/** Pick best available label for display (fr → en → ar). */
export function loc(v: any): string {
  const o = toI18n(v);
  return o.fr || o.en || o.ar || "";
}

/** Returns true if at least one language has content. */
export function hasI18n(v: I18nValue | undefined): boolean {
  if (!v) return false;
  return !!(v.fr?.trim() || v.en?.trim() || v.ar?.trim());
}

type Props = {
  value: I18nValue | undefined;
  onChange: (v: I18nValue) => void;
  multiline?: boolean;
  rows?: number;
  error?: boolean;
};

export function I18nInput({ value, onChange, multiline, rows = 3, error }: Props) {
  const v = value || {};
  return (
    <div className="space-y-2">
      {LANGS.map((l) => (
        <div key={l.key} className="flex items-start gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted rounded px-1.5 py-1 mt-1.5 w-10 text-center shrink-0">
            {l.key}
          </span>
          {multiline ? (
            <Textarea
              dir={l.dir}
              rows={rows}
              placeholder={l.label}
              value={v[l.key] || ""}
              onChange={(e) => onChange({ ...v, [l.key]: e.target.value })}
              className={cn("flex-1", error && "border-destructive")}
            />
          ) : (
            <Input
              dir={l.dir}
              placeholder={l.label}
              value={v[l.key] || ""}
              onChange={(e) => onChange({ ...v, [l.key]: e.target.value })}
              className={cn("flex-1", error && "border-destructive")}
            />
          )}
        </div>
      ))}
    </div>
  );
}
