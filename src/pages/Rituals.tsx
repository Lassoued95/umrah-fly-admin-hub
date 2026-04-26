import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, Plus, Landmark, CalendarRange, ListOrdered } from "lucide-react";
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

type Planning = { id_planning: number; titre?: string; type_evenement?: string; date_heure?: string };
type Etape = { id_etape: number; titre?: string; description?: string; ordre?: number; id_rituel?: number };
type Rituel = { id_rituel: number; nom?: string; ordre?: number; description?: string; id_douaa?: number; etapes?: Etape[] };

const truncate = (s?: string, n = 60) => !s ? "—" : s.length > n ? s.slice(0, n) + "…" : s;
const planLabel = (p: Planning) => p.titre || p.type_evenement || `Planning #${p.id_planning}`;

export default function Rituals() {
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [selected, setSelected] = useState<Planning | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [rituals, setRituals] = useState<Rituel[]>([]);
  const [ritLoading, setRitLoading] = useState(false);

  // Rituel dialogs
  const [viewing, setViewing] = useState<Rituel | null>(null);
  const [editingRit, setEditingRit] = useState<Rituel | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingRit, setDeletingRit] = useState<Rituel | null>(null);
  const [deletingRitLoading, setDeletingRitLoading] = useState(false);

  // Etapes
  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [etapesLoading, setEtapesLoading] = useState(false);
  const [etapeDialog, setEtapeDialog] = useState<{ open: boolean; mode: "create" | "edit"; data: any }>({ open: false, mode: "create", data: {} });
  const [etapeErrors, setEtapeErrors] = useState<Record<string, string>>({});
  const [etapeSaving, setEtapeSaving] = useState(false);
  const [deletingEtape, setDeletingEtape] = useState<Etape | null>(null);
  const [deletingEtapeLoading, setDeletingEtapeLoading] = useState(false);

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
      const data = await api.get<Rituel[]>(`/rituels/${id}`);
      setRituals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setRituals([]);
      toast.error(err?.message || "Échec du chargement des rituels");
    } finally { setRitLoading(false); }
  };

  useEffect(() => { if (selected) loadRituals(selected.id_planning); }, [selected]);

  // ------- Rituel CRUD -------
  const submitRituel = async () => {
    if (!selected) return;
    const errs: Record<string, string> = {};
    if (!form.nom) errs.nom = "Requis";
    if (form.ordre === undefined || form.ordre === "") errs.ordre = "Requis";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = {
        nom: form.nom,
        ordre: Number(form.ordre),
        description: form.description || "",
        id_planning: selected.id_planning,
        id_douaa: form.id_douaa ? Number(form.id_douaa) : null,
      };
      if (editingRit) {
        await api.put(`/rituels/${editingRit.id_rituel}`, payload);
        toast.success("Rituel mis à jour");
      } else {
        await api.post("/rituels/", payload);
        toast.success("Rituel créé");
      }
      setAdding(false); setEditingRit(null); setForm({});
      loadRituals(selected.id_planning);
    } catch (err: any) {
      toast.error(err?.message || "Échec de l'enregistrement");
    } finally { setSaving(false); }
  };

  const confirmDeleteRituel = async () => {
    if (!deletingRit || !selected) return;
    setDeletingRitLoading(true);
    try {
      await api.del(`/rituels/${deletingRit.id_rituel}`);
      toast.success("Rituel supprimé");
      setDeletingRit(null);
      loadRituals(selected.id_planning);
    } catch (err: any) {
      toast.error(err?.message || "Échec de la suppression");
    } finally { setDeletingRitLoading(false); }
  };

  // ------- Etapes -------
  const loadEtapes = async (rituelId: number) => {
    setEtapesLoading(true);
    try {
      const data = await api.get<Etape[]>(`/rituels/${rituelId}/etapes`);
      setEtapes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // Fallback: try to use etapes embedded in viewing rituel
      const fallback = viewing?.etapes;
      if (Array.isArray(fallback)) setEtapes(fallback);
      else { setEtapes([]); toast.error(err?.message || "Échec du chargement des étapes"); }
    } finally { setEtapesLoading(false); }
  };

  useEffect(() => { if (viewing) loadEtapes(viewing.id_rituel); else setEtapes([]); }, [viewing]);

  const submitEtape = async () => {
    if (!viewing) return;
    const data = etapeDialog.data;
    const errs: Record<string, string> = {};
    if (!data.titre) errs.titre = "Requis";
    if (data.ordre === undefined || data.ordre === "") errs.ordre = "Requis";
    setEtapeErrors(errs);
    if (Object.keys(errs).length) return;
    setEtapeSaving(true);
    try {
      const payload = {
        titre: data.titre,
        description: data.description || "",
        ordre: Number(data.ordre),
        id_rituel: viewing.id_rituel,
      };
      if (etapeDialog.mode === "edit" && data.id_etape) {
        await api.put(`/etapes/${data.id_etape}`, payload);
        toast.success("Étape mise à jour");
      } else {
        await api.post("/etapes", payload);
        toast.success("Étape créée");
      }
      setEtapeDialog({ open: false, mode: "create", data: {} });
      loadEtapes(viewing.id_rituel);
    } catch (err: any) {
      toast.error(err?.message || "Échec de l'enregistrement de l'étape");
    } finally { setEtapeSaving(false); }
  };

  const confirmDeleteEtape = async () => {
    if (!deletingEtape || !viewing) return;
    setDeletingEtapeLoading(true);
    try {
      await api.del(`/etapes/${deletingEtape.id_etape}`);
      toast.success("Étape supprimée");
      setDeletingEtape(null);
      loadEtapes(viewing.id_rituel);
    } catch (err: any) {
      toast.error(err?.message || "Échec de la suppression");
    } finally { setDeletingEtapeLoading(false); }
  };

  const columns: Column<Rituel>[] = [
    { key: "ordre", header: "#", sortable: true, className: "w-14", render: (r) => <span className="font-mono text-sm">{r.ordre ?? "—"}</span> },
    { key: "nom", header: "Nom", sortable: true, render: (r) => <span className="font-medium">{r.nom || "—"}</span> },
    { key: "description", header: "Description", render: (r) => <span className="text-muted-foreground">{truncate(r.description, 60)}</span> },
    { key: "id_douaa", header: "ID Douaa", render: (r) => r.id_douaa ?? "—" },
  ];

  const openCreate = () => {
    setEditingRit(null);
    setForm({ ordre: rituals.length + 1 });
    setErrors({});
    setAdding(true);
  };

  const openEdit = (r: Rituel) => {
    setEditingRit(r);
    setForm({
      nom: r.nom ?? "",
      ordre: r.ordre ?? "",
      description: r.description ?? "",
      id_douaa: r.id_douaa ?? "",
    });
    setErrors({});
    setAdding(true);
  };

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
                  {p.date_heure ? new Date(p.date_heure).toLocaleDateString() : `ID ${p.id_planning}`}
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
              <Button size="sm" onClick={openCreate}>
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
              actions={(r) => (
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setViewing(r)} title="Voir / Étapes"><Eye size={16} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Modifier"><Pencil size={16} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeletingRit(r)} title="Supprimer"><Trash2 size={16} className="text-destructive" /></Button>
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Rituel detail + étapes management */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>{viewing?.nom || "Rituel"}</SheetTitle></SheetHeader>
          {viewing && (
            <div className="mt-6 space-y-6">
              <DetailGrid items={[
                ["ID", viewing.id_rituel],
                ["Ordre", viewing.ordre],
                ["ID Douaa", viewing.id_douaa],
              ]} />
              <div>
                <div className="text-xs text-muted-foreground mb-2">Description</div>
                <div className="text-sm leading-relaxed">{viewing.description || "—"}</div>
              </div>

              {/* Etapes section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <ListOrdered size={16} className="text-primary" /> Étapes
                  </div>
                  <Button size="sm" onClick={() => {
                    setEtapeErrors({});
                    setEtapeDialog({ open: true, mode: "create", data: { ordre: etapes.length + 1 } });
                  }}>
                    <Plus size={14} className="mr-1" /> Ajouter
                  </Button>
                </div>
                {etapesLoading ? <PageSpinner /> : etapes.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center border rounded-lg">Aucune étape</div>
                ) : (
                  <div className="space-y-2">
                    {etapes
                      .slice()
                      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
                      .map((e) => (
                      <div key={e.id_etape} className="border rounded-lg p-3 flex items-start gap-3">
                        <div className="font-mono text-xs bg-muted rounded px-2 py-1 mt-0.5">{e.ordre ?? "—"}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{e.titre || "—"}</div>
                          {e.description && <div className="text-xs text-muted-foreground mt-1">{e.description}</div>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => {
                            setEtapeErrors({});
                            setEtapeDialog({
                              open: true, mode: "edit",
                              data: { id_etape: e.id_etape, titre: e.titre ?? "", description: e.description ?? "", ordre: e.ordre ?? "" }
                            });
                          }}><Pencil size={14} /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeletingEtape(e)}>
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit rituel dialog */}
      <Dialog open={adding} onOpenChange={(o) => { setAdding(o); if (!o) { setEditingRit(null); setForm({}); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingRit ? "Modifier le rituel" : "Ajouter un rituel"}</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => { setAdding(false); setEditingRit(null); setForm({}); }} disabled={saving}>Annuler</Button>
            <Button onClick={submitRituel} disabled={saving}>{saving ? <Spinner className="text-primary-foreground" /> : (editingRit ? "Enregistrer" : "Créer")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Etape create/edit dialog */}
      <Dialog open={etapeDialog.open} onOpenChange={(o) => setEtapeDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{etapeDialog.mode === "edit" ? "Modifier l'étape" : "Ajouter une étape"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <Field label="Titre *" error={etapeErrors.titre} className="sm:col-span-2">
              <Input value={etapeDialog.data.titre || ""} onChange={(e) => setEtapeDialog((d) => ({ ...d, data: { ...d.data, titre: e.target.value } }))} className={etapeErrors.titre ? "border-destructive" : ""} />
            </Field>
            <Field label="Ordre *" error={etapeErrors.ordre}>
              <Input type="number" value={etapeDialog.data.ordre ?? ""} onChange={(e) => setEtapeDialog((d) => ({ ...d, data: { ...d.data, ordre: e.target.value } }))} className={etapeErrors.ordre ? "border-destructive" : ""} />
            </Field>
            <Field label="Rituel">
              <Input value={viewing ? `${viewing.nom} (#${viewing.id_rituel})` : ""} disabled />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea rows={3} value={etapeDialog.data.description || ""} onChange={(e) => setEtapeDialog((d) => ({ ...d, data: { ...d.data, description: e.target.value } }))} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEtapeDialog({ open: false, mode: "create", data: {} })} disabled={etapeSaving}>Annuler</Button>
            <Button onClick={submitEtape} disabled={etapeSaving}>{etapeSaving ? <Spinner className="text-primary-foreground" /> : (etapeDialog.mode === "edit" ? "Enregistrer" : "Créer")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingRit}
        onOpenChange={(o) => !o && setDeletingRit(null)}
        title="Supprimer ce rituel ?"
        description={`"${deletingRit?.nom ?? ""}" sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        loading={deletingRitLoading}
        onConfirm={confirmDeleteRituel}
        destructive
      />

      <ConfirmDialog
        open={!!deletingEtape}
        onOpenChange={(o) => !o && setDeletingEtape(null)}
        title="Supprimer cette étape ?"
        description={`"${deletingEtape?.titre ?? ""}" sera supprimée définitivement.`}
        confirmLabel="Supprimer"
        loading={deletingEtapeLoading}
        onConfirm={confirmDeleteEtape}
        destructive
      />
    </div>
  );
}
