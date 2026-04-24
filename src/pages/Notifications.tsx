import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Trash2, Send, Bell } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner, Spinner } from "@/components/Spinner";
import { DataTable, Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, DetailGrid } from "./Users";

type Notif = {
  id_notification: number;
  titre?: string;
  message?: string;
  categorie?: string;
  type?: string;
  lue?: boolean;
  is_global?: boolean;
  date_envoi?: string;
  id_utilisateur?: number | null;
};

const truncate = (s?: string, n = 60) => !s ? "—" : s.length > n ? s.slice(0, n) + "…" : s;

export default function Notifications() {
  const [list, setList] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Notif | null>(null);
  const [deleting, setDeleting] = useState<Notif | null>(null);
  const [delLoading, setDelLoading] = useState(false);

  const [form, setForm] = useState<any>({ categorie: "Info", is_global: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Notif[]>("/notifications/");
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) { toast.error(err?.message || "Failed to load notifications"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    const errs: Record<string, string> = {};
    if (!form.titre) errs.titre = "Required";
    if (!form.message) errs.message = "Required";
    if (!form.is_global && !form.id_utilisateur) errs.id_utilisateur = "Required for targeted send";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    try {
      await api.post("/notifications/", {
        titre: form.titre,
        message: form.message,
        categorie: form.categorie,
        type: form.type || null,
        is_global: !!form.is_global,
        id_utilisateur: form.is_global ? null : Number(form.id_utilisateur),
      });
      toast.success("Notification sent");
      setForm({ categorie: "Info", is_global: true });
      load();
    } catch (err: any) { toast.error(err?.message || "Send failed"); }
    finally { setSending(false); }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await api.del(`/notifications/${deleting.id_notification}`);
      toast.success("Notification deleted");
      setDeleting(null); load();
    } catch (err: any) { toast.error(err?.message || "Delete failed"); }
    finally { setDelLoading(false); }
  };

  const columns: Column<Notif>[] = [
    { key: "titre", header: "Title", sortable: true, render: (n) => <span className="font-medium">{n.titre || "—"}</span> },
    { key: "message", header: "Message", render: (n) => <span className="text-muted-foreground">{truncate(n.message, 60)}</span> },
    { key: "categorie", header: "Category", sortable: true, render: (n) => n.categorie ? <Badge variant="outline">{n.categorie}</Badge> : "—" },
    { key: "type", header: "Type", render: (n) => n.type || "—" },
    { key: "is_global", header: "Global", sortable: true, render: (n) => (
      n.is_global
        ? <Badge className="bg-accent text-accent-foreground hover:bg-accent">Yes</Badge>
        : <Badge variant="outline">No</Badge>
    ) },
    { key: "lue", header: "Read", sortable: true, render: (n) => (
      n.lue
        ? <Badge variant="outline" className="bg-success/10 text-success border-success/30">Read</Badge>
        : <Badge variant="outline">Unread</Badge>
    ) },
    { key: "date_envoi", header: "Date", sortable: true, render: (n) => n.date_envoi ? new Date(n.date_envoi).toLocaleDateString() : "—" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Notifications" description="Send and manage in-app notifications." />

      {/* Send card */}
      <div className="bg-card rounded-xl border shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Send size={16} />
          </div>
          <div>
            <h2 className="font-semibold">Send a notification</h2>
            <p className="text-xs text-muted-foreground">Broadcast to all users or target a specific one.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Title *" error={errors.titre}>
            <Input value={form.titre || ""} onChange={(e) => setForm((f: any) => ({ ...f, titre: e.target.value }))} className={errors.titre ? "border-destructive" : ""} />
          </Field>
          <Field label="Category">
            <Select value={form.categorie || "Info"} onValueChange={(v) => setForm((f: any) => ({ ...f, categorie: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Info">Info</SelectItem>
                <SelectItem value="Alert">Alert</SelectItem>
                <SelectItem value="Rappel">Rappel</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Message *" error={errors.message} className="md:col-span-2">
            <Textarea rows={3} value={form.message || ""} onChange={(e) => setForm((f: any) => ({ ...f, message: e.target.value }))} className={errors.message ? "border-destructive" : ""} />
          </Field>
          <Field label="Type (optional)">
            <Input value={form.type || ""} onChange={(e) => setForm((f: any) => ({ ...f, type: e.target.value }))} />
          </Field>
          <div className="flex items-end gap-3 pb-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md border bg-muted/40 flex-1">
              <Switch checked={!!form.is_global} onCheckedChange={(v) => setForm((f: any) => ({ ...f, is_global: v }))} />
              <div className="text-sm">
                <div className="font-medium">Send to all users</div>
                <div className="text-xs text-muted-foreground">Toggle off to target a single user</div>
              </div>
            </div>
          </div>
          {!form.is_global && (
            <Field label="User ID *" error={errors.id_utilisateur} className="md:col-span-2">
              <Input type="number" value={form.id_utilisateur ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, id_utilisateur: e.target.value }))} className={errors.id_utilisateur ? "border-destructive" : ""} />
            </Field>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={send} disabled={sending}>
            {sending ? <Spinner className="text-primary-foreground" /> : (<><Send size={14} className="mr-1.5" /> Send notification</>)}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? <PageSpinner /> : (
          <DataTable
            columns={columns} data={list} rowKey={(n) => n.id_notification}
            empty={<EmptyState icon={<Bell size={26} />} title="No notifications" description="Sent notifications will appear here." />}
            actions={(n) => (
              <div className="flex items-center justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => setViewing(n)}><Eye size={16} /></Button>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(n)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          />
        )}
      </div>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{viewing?.titre || "Notification"}</SheetTitle></SheetHeader>
          {viewing && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-muted/40 rounded-lg text-sm leading-relaxed">{viewing.message}</div>
              <DetailGrid items={[
                ["ID", viewing.id_notification],
                ["Category", viewing.categorie],
                ["Type", viewing.type],
                ["Global", viewing.is_global ? "Yes" : "No"],
                ["Read", viewing.lue ? "Read" : "Unread"],
                ["User ID", viewing.id_utilisateur],
                ["Sent", viewing.date_envoi ? new Date(viewing.date_envoi).toLocaleString() : "—"],
              ]} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete notification?" description="This action cannot be undone."
        onConfirm={confirmDelete} loading={delLoading}
      />
    </div>
  );
}
