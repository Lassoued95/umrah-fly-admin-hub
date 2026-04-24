import { useMemo, useState, ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  accessor?: (row: T) => any;
  render?: (row: T) => ReactNode;
};

export function DataTable<T extends Record<string, any>>({
  columns, data, rowKey, actions, empty,
}: {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  actions?: (row: T) => ReactNode;
  empty?: ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
    const get = col.accessor || ((r: T) => r[sort.key]);
    return [...data].sort((a, b) => {
      const av = get(a); const bv = get(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av;
      return sort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [data, sort, columns]);

  const toggleSort = (key: string) => {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  if (data.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap",
                  c.sortable && "cursor-pointer select-none hover:text-foreground",
                  c.className
                )}
                onClick={c.sortable ? () => toggleSort(c.key) : undefined}
              >
                <span className="inline-flex items-center gap-1.5">
                  {c.header}
                  {c.sortable && (
                    sort?.key === c.key
                      ? sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      : <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </span>
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={rowKey(row)} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                  {c.render ? c.render(row) : (c.accessor ? c.accessor(row) : row[c.key])}
                </td>
              ))}
              {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
