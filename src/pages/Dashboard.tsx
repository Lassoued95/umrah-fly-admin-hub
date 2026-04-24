import { useEffect, useState } from "react";
import { Users, BookOpen, CalendarRange, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/Spinner";

type Stat = { label: string; value: number | null; icon: any; tint: string };

export default function Dashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { label: "Total Users", value: null, icon: Users, tint: "bg-primary/10 text-primary" },
    { label: "Total Duas", value: null, icon: BookOpen, tint: "bg-accent/15 text-accent-foreground" },
    { label: "Total Plannings", value: null, icon: CalendarRange, tint: "bg-success/10 text-success" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [users, duas, plannings] = await Promise.allSettled([
          api.get<any[]>("/utilisateurs/"),
          api.get<any[]>("/douaa/all"),
          api.get<any[]>("/planning/"),
        ]);
        if (!mounted) return;
        const num = (r: PromiseSettledResult<any>) => {
          if (r.status !== "fulfilled") return 0;
          const v: any = r.value;
          if (Array.isArray(v)) return v.length;
          if (v && typeof v === "object" && Array.isArray(v.data)) return v.data.length;
          return 0;
        };
        setStats([
          { label: "Total Users", value: num(users), icon: Users, tint: "bg-primary/10 text-primary" },
          { label: "Total Duas", value: num(duas), icon: BookOpen, tint: "bg-accent/20 text-accent-foreground" },
          { label: "Total Plannings", value: num(plannings), icon: CalendarRange, tint: "bg-success/10 text-success" },
        ]);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" description="Overview of your platform." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
                <div className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? <Spinner size={22} /> : (s.value ?? 0).toLocaleString()}
                </div>
              </div>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${s.tint}`}>
                <s.icon size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp size={12} className="text-success" />
              Live data from API
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
