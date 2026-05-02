import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, Plus, Sparkles, CalendarRange } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner, Spinner } from "@/components/Spinner";
import { DataTable, Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, DetailGrid } from "./Users";
import { cn } from "@/lib/utils";

type Planning = { id_planning: number; titre?: string; type_evenement?: string; date?: string };
type Dhikr = { id_dhikr: number; nom?: string; ordre?: number; description?: string; repetitions?: number; id_planning?: number };

const truncate = (s?: string, n = 60) => !s ? "—" : s.length > n ? s.slice(0, n) + "…" : s;
const planLabel = (p: Planning) => p.titre || p.type_evenement || `Planning #${p.id_planning}`;

export default function DhikrPage() {
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [selected, setSelected] = useState<Planning | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [list, setList] = useState<Dhikr[]>([]);
  const [loading, setLoading] = useState(false);

  const [viewing, setViewing] = useState<Dhikr | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [editing, setEditing] = useState<Dhikr | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Dhikr | null>(null);
  const [delLoading, setDelLoading] = useState(false);

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

  const load = async (id: number) => {
    setLoading(true);
    try {
      const data = await api.get<Dhikr[]>(`/dhikr/${id}`);
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) { setList([]); toast.error(err?.message || "Échec du chargement des dhikrs"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selected) load(selected.id_planning); }, [selected]);

  const openView = async (d: Dhikr) => {
    setViewLoading(true);
    setViewing(d);
    try {
      const detail = await api.get<Dhikr>(`/dhikr/detail/${d.id_dhikr}`);
      setViewing(detail || d);
    } catch { /* keep partial */ }
    finally { setViewLoading(false); }
  };

  const openEdit = (d: Dhikr) => {
    setEditing(d);
    setForm({ nom: d.nom, ordre: d.ordre, description: d.description, repetitions: d.repetitions });
    setErrors({});
  };

  const openAdd = () => {
    setForm({ ordre: list.length + 1, repetitions: 33 });
    setErrors({});
    setAdding(true);
  };

  const submit = async () => {
    if (!selected) return;
    const errs: Record<string, string> = {};
    if (!form.nom) errs.nom = "Requis";
    if (form.ordre === undefined || form.ordre === "") errs.ordre = "Requis";
    if (!form.repetitions) errs.repetitions = "Requis";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const body = {
        nom: form.nom,
        ordre: Number(form.ordre),
        description: form.description || "",
        repetitions: Number(form.repetitions),
      };
      if (editing) {
        await api.put(`/dhikr/${editing.id_dhikr}`, body);
        toast.success("Dhikr mis à jour");
        setEditing(null);
      } else {
        await api.post(`/dhikr/`, { ...body, id_planning: selected.id_planning });
        toast.success("Dhikr créé");
        setAdding(false);
      }
      setForm({}); load(selected.id_planning);
    } catch (err: any) { toast.error(err?.message || "Échec de l'enregistrement"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleting || !selected) return;
    setDelLoading(true);
    try {
      await api.del(`/dhikr/${deleting.id_dhikr}`);
      toast.success("Dhikr supprimé");
      setDeleting(null);
      load(selected.id_planning);
    } catch (err: any) { toast.error(err?.message || "Échec de la suppression"); }
    finally { setDelLoading(false); }
  };

  const columns: Column<Dhikr>[] = [
    { key: "ordre", header: "#", sortable: true, className: "w-14", render: (d) => <span className="font-mono text-sm">{d.ordre ?? "—"}</span> },
    { key: "nom", header: "Nom", sortable: true, render: (d) => <span className="font-medium">{d.nom || "—"}</span> },
    { key: "description", header: "Description", render: (d) => <span className="text-muted-foreground">{truncate(d.description, 60)}</span> },
    { key: "repetitions", header: "Répétitions", sortable: true, render: (d) => (
      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-accent-soft text-accent-foreground text-xs font-semibold">{d.repetitions ?? 0}</span>
    ) },
  ];

  const isModalOpen = adding || !!editing;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dhikr" description="Phrases de rappel par planning." />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2 font-medium text-sm">
            <CalendarRange size={16} className="text-primary" /> Plannings
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {planLoading ? <PageSpinner /> : plannings.length === 0 ? <EmptyState title="Aucun planning" /> :
              plannings.map((p) => (
                <button key={p.id_planning} onClick={() => setSelected(p)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors",
                    selected?.id_planning === p.id_planning && "bg-accent-soft border-l-4 border-l-accent"
                  )}>
                  <div className="font-medium text-sm">{planLabel(p)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.date ? new Date(p.date).toLocaleDateString() : `ID ${p.id_planning}`}</div>
                </button>
              ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
            <div className="font-medium text-sm">
              {selected ? `Dhikrs — ${planLabel(selected)}` : "Sélectionnez un planning"}
            </div>
            {selected && (
              <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Ajouter un dhikr</Button>
            )}
          </div>
          {!selected ? (
            <EmptyState title="Choisissez un planning" />
          ) : loading ? <PageSpinner /> : (
            <DataTable
              columns={columns} data={list} rowKey={(d) => d.id_dhikr}
              empty={<EmptyState icon={<Sparkles size={26} />} title="Aucun dhikr" />}
              actions={(d) => (
                <div className="flex items-center justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openView(d)}><Eye size={16} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Pencil size={16} /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(d)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            />
          )}
        </div>
      </div>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{viewing?.nom || "Dhikr"}</SheetTitle></SheetHeader>
          {viewLoading ? <PageSpinner /> : viewing && (
            <div className="mt-6 space-y-4">
              <DetailGrid items={[
                ["ID", viewing.id_dhikr],
                ["Ordre", viewing.ordre],
                ["Répétitions", viewing.repetitions],
                ["ID Planning", viewing.id_planning],
              ]} />
              <div>
                <div className="text-xs text-muted-foreground mb-2">Description</div>
                <div className="text-sm leading-relaxed">{viewing.description || "—"}</div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isModalOpen} onOpenChange={(o) => { if (!o) { setAdding(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Modifier le dhikr" : "Ajouter un dhikr"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <Field label="Nom *" error={errors.nom} className="sm:col-span-2">
              <Input value={form.nom || ""} onChange={(e) => setForm((f: any) => ({ ...f, nom: e.target.value }))} className={errors.nom ? "border-destructive" : ""} />
            </Field>
            <Field label="Ordre *" error={errors.ordre}>
              <Input type="number" value={form.ordre ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, ordre: e.target.value }))} className={errors.ordre ? "border-destructive" : ""} />
            </Field>
            <Field label="Répétitions *" error={errors.repetitions}>
              <Input type="number" value={form.repetitions ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, repetitions: e.target.value }))} className={errors.repetitions ? "border-destructive" : ""} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea rows={3} value={form.description || ""} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            </Field>
            {!editing && (
              <Field label="Planning" className="sm:col-span-2">
                <Input value={selected ? `${planLabel(selected)} (#${selected.id_planning})` : ""} disabled />
              </Field>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAdding(false); setEditing(null); }} disabled={saving}>Annuler</Button>
            <Button onClick={submit} disabled={saving}>{saving ? <Spinner className="text-primary-foreground" /> : (editing ? "Enregistrer" : "Créer")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer ce dhikr ?" description={deleting ? `Ceci supprimera « ${deleting.nom} ».` : ""}
        onConfirm={confirmDelete} loading={delLoading}
      />
    </div>
  );
}
