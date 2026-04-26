import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Plus, Landmark, CalendarRange } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner, Spinner } from "@/components/Spinner";
import { DataTable, Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, DetailGrid } from "./Users";
import { cn } from "@/lib/utils";

type Planning = { id_planning: number; titre?: string; type_evenement?: string; date?: string };
type Rituel = { id_rituel: number; nom?: string; ordre?: number; description?: string; id_douaa?: number; etapes?: any };

const truncate = (s?: string, n = 60) => !s ? "—" : s.length > n ? s.slice(0, n) + "…" : s;
const planLabel = (p: Planning) => p.titre || p.type_evenement || `Planning #${p.id_planning}`;

export default function Rituals() {
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [selected, setSelected] = useState<Planning | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [rituals, setRituals] = useState<Rituel[]>([]);
  const [ritLoading, setRitLoading] = useState(false);

  const [viewing, setViewing] = useState<Rituel | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setPlanLoading(true);
      try {
        const data = await api.get<Planning[]>("/plannings/");
        const arr = Array.isArray(data) ? data : [];
        setPlannings(arr);
        if (arr.length) setSelected(arr[0]);
      } catch (err: any) { toast.error(err?.message || "Échec du chargement des plannings"); }
      finally { setPlanLoading(false); }
    })();
  }, []);

  const loadRituals = async (id: number) => {
    setRitLoading(true);
    try {
      const data = await api.get<Rituel[]>(`/rituel/${id}`);
      setRituals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setRituals([]);
      toast.error(err?.message || "Échec du chargement des rituels");
    } finally { setRitLoading(false); }
  };

  useEffect(() => { if (selected) loadRituals(selected.id_planning); }, [selected]);

  const submit = async () => {
    if (!selected) return;
    const errs: Record<string, string> = {};
    if (!form.nom) errs.nom = "Requis";
    if (form.ordre === undefined || form.ordre === "") errs.ordre = "Requis";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api.post("/rituel/", {
        nom: form.nom,
        ordre: Number(form.ordre),
        description: form.description || "",
        id_planning: selected.id_planning,
        id_douaa: form.id_douaa ? Number(form.id_douaa) : null,
      });
      toast.success("Rituel créé");
      setAdding(false); setForm({}); loadRituals(selected.id_planning);
    } catch (err: any) {
      toast.error(err?.message || "Échec de la création");
    } finally { setSaving(false); }
  };

  const columns: Column<Rituel>[] = [
    { key: "ordre", header: "#", sortable: true, className: "w-14", render: (r) => <span className="font-mono text-sm">{r.ordre ?? "—"}</span> },
    { key: "nom", header: "Nom", sortable: true, render: (r) => <span className="font-medium">{r.nom || "—"}</span> },
    { key: "description", header: "Description", render: (r) => <span className="text-muted-foreground">{truncate(r.description, 60)}</span> },
    { key: "id_douaa", header: "ID Douaa", render: (r) => r.id_douaa ?? "—" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Rituels" description="Rituels associés à chaque planning." />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2 font-medium text-sm">
            <CalendarRange size={16} className="text-primary" /> Plannings
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {planLoading ? <PageSpinner /> : plannings.length === 0 ? (
              <EmptyState title="Aucun planning" />
            ) : plannings.map((p) => (
              <button
                key={p.id_planning}
                onClick={() => setSelected(p)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors",
                  selected?.id_planning === p.id_planning && "bg-accent-soft border-l-4 border-l-accent"
                )}
              >
                <div className="font-medium text-sm">{planLabel(p)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {p.date ? new Date(p.date).toLocaleDateString() : `ID ${p.id_planning}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
            <div className="font-medium text-sm">
              {selected ? `Rituels — ${planLabel(selected)}` : "Sélectionnez un planning"}
            </div>
            {selected && (
              <Button size="sm" onClick={() => { setForm({ ordre: rituals.length + 1 }); setErrors({}); setAdding(true); }}>
                <Plus size={14} className="mr-1" /> Ajouter un rituel
              </Button>
            )}
          </div>
          {!selected ? (
            <EmptyState title="Choisissez un planning" description="Sélectionnez un planning à gauche pour voir ses rituels." />
          ) : ritLoading ? <PageSpinner /> : (
            <DataTable
              columns={columns} data={rituals} rowKey={(r) => r.id_rituel}
              empty={<EmptyState icon={<Landmark size={26} />} title="Aucun rituel" />}
              actions={(r) => <Button size="icon" variant="ghost" onClick={() => setViewing(r)}><Eye size={16} /></Button>}
            />
          )}
        </div>
      </div>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{viewing?.nom || "Rituel"}</SheetTitle></SheetHeader>
          {viewing && (
            <div className="mt-6 space-y-4">
              <DetailGrid items={[
                ["ID", viewing.id_rituel],
                ["Ordre", viewing.ordre],
                ["ID Douaa", viewing.id_douaa],
              ]} />
              <div>
                <div className="text-xs text-muted-foreground mb-2">Description</div>
                <div className="text-sm leading-relaxed">{viewing.description || "—"}</div>
              </div>
              {viewing.etapes && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Étapes</div>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">{JSON.stringify(viewing.etapes, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Ajouter un rituel</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <Field label="Nom *" error={errors.nom} className="sm:col-span-2">
              <Input value={form.nom || ""} onChange={(e) => setForm((f: any) => ({ ...f, nom: e.target.value }))} className={errors.nom ? "border-destructive" : ""} />
            </Field>
            <Field label="Ordre *" error={errors.ordre}>
              <Input type="number" value={form.ordre ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, ordre: e.target.value }))} className={errors.ordre ? "border-destructive" : ""} />
            </Field>
            <Field label="ID Douaa">
              <Input type="number" value={form.id_douaa ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, id_douaa: e.target.value }))} />
            </Field>
            <Field label="Planning">
              <Input value={selected ? `${planLabel(selected)} (#${selected.id_planning})` : ""} disabled />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea rows={3} value={form.description || ""} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)} disabled={saving}>Annuler</Button>
            <Button onClick={submit} disabled={saving}>{saving ? <Spinner className="text-primary-foreground" /> : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
