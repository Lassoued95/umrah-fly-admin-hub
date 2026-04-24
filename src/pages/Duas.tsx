import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Plus, BookOpen } from "lucide-react";
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

type Dua = {
  id_douaa: number;
  titre?: string;
  texte_arabe?: string;
  traduction?: string;
  audio_url?: string;
};

const truncate = (s: string | undefined, n = 60) =>
  !s ? "—" : s.length > n ? s.slice(0, n) + "…" : s;

export default function Duas() {
  const [list, setList] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Dua | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<Dua>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Dua[]>("/douaa/all");
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) { toast.error(err?.message || "Failed to load duas"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!form.titre) errs.titre = "Required";
    if (!form.texte_arabe) errs.texte_arabe = "Required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api.post("/douaa/", form);
      toast.success("Dua created");
      setAdding(false); setForm({}); load();
    } catch (err: any) {
      toast.error(err?.message || "Create failed");
    } finally { setSaving(false); }
  };

  const columns: Column<Dua>[] = [
    { key: "id_douaa", header: "ID", sortable: true, className: "w-16" },
    { key: "titre", header: "Title", sortable: true, render: (d) => <span className="font-medium">{d.titre || "—"}</span> },
    { key: "texte_arabe", header: "Arabic", render: (d) => <span dir="rtl" className="font-arabic text-foreground/80">{truncate(d.texte_arabe, 40)}</span> },
    { key: "traduction", header: "Translation", render: (d) => <span className="text-muted-foreground">{truncate(d.traduction, 60)}</span> },
    { key: "audio_url", header: "Audio", render: (d) => d.audio_url ? <span className="text-xs text-primary">✓ available</span> : <span className="text-xs text-muted-foreground">—</span> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Duas"
        description="Library of supplications."
        action={<Button onClick={() => { setForm({}); setErrors({}); setAdding(true); }}><Plus size={16} className="mr-1" /> Add Dua</Button>}
      />

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? <PageSpinner /> : (
          <DataTable
            columns={columns} data={list} rowKey={(d) => d.id_douaa}
            empty={<EmptyState icon={<BookOpen size={26} />} title="No duas yet" description="Add your first supplication to get started." />}
            actions={(d) => (
              <Button size="icon" variant="ghost" onClick={() => setViewing(d)}><Eye size={16} /></Button>
            )}
          />
        )}
      </div>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{viewing?.titre || "Dua"}</SheetTitle></SheetHeader>
          {viewing && (
            <div className="mt-6 space-y-5">
              <div>
                <div className="text-xs text-muted-foreground mb-2">Arabic</div>
                <div dir="rtl" className="text-2xl leading-loose text-right font-medium bg-accent-soft/40 p-4 rounded-lg">
                  {viewing.texte_arabe || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Translation</div>
                <div className="text-sm leading-relaxed">{viewing.traduction || "—"}</div>
              </div>
              {viewing.audio_url && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Audio</div>
                  <audio controls src={viewing.audio_url} className="w-full" />
                </div>
              )}
              <DetailGrid items={[["ID", viewing.id_douaa], ["Audio URL", viewing.audio_url]]} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add a new dua</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Field label="Title *" error={errors.titre}>
              <Input value={form.titre || ""} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} className={errors.titre ? "border-destructive" : ""} />
            </Field>
            <Field label="Arabic text *" error={errors.texte_arabe}>
              <Textarea dir="rtl" rows={4} value={form.texte_arabe || ""} onChange={(e) => setForm((f) => ({ ...f, texte_arabe: e.target.value }))} className={errors.texte_arabe ? "border-destructive" : ""} />
            </Field>
            <Field label="Translation">
              <Textarea rows={3} value={form.traduction || ""} onChange={(e) => setForm((f) => ({ ...f, traduction: e.target.value }))} />
            </Field>
            <Field label="Audio URL">
              <Input value={form.audio_url || ""} onChange={(e) => setForm((f) => ({ ...f, audio_url: e.target.value }))} placeholder="https://..." />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? <Spinner className="text-primary-foreground" /> : "Create dua"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
