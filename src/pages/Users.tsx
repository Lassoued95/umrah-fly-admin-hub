import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, Search, Users as UsersIcon } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner, Spinner } from "@/components/Spinner";
import { DataTable, Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type User = {
  id_utilisateur: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  langue?: string;
  type_compte?: string;
  date_inscription?: string;
  role?: string;
  avatar?: string;
};

const initials = (u: User) =>
  `${(u.prenom?.[0] || "").toUpperCase()}${(u.nom?.[0] || "").toUpperCase()}` || (u.email?.[0] || "?").toUpperCase();

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [viewing, setViewing] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<User | null>(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<User[]>("/utilisateurs/");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.prenom || ""} ${u.nom || ""} ${u.email || ""}`.toLowerCase().includes(q)
    );
  }, [users, query]);

  const openEdit = (u: User) => {
    setEditing(u);
    setEditForm({
      nom: u.nom, prenom: u.prenom, email: u.email,
      telephone: u.telephone, langue: u.langue, type_compte: u.type_compte, role: u.role,
    });
    setEditErrors({});
  };

  const saveEdit = async () => {
    if (!editing) return;
    const errs: Record<string, string> = {};
    if (!editForm.nom) errs.nom = "Required";
    if (!editForm.prenom) errs.prenom = "Required";
    if (!editForm.email) errs.email = "Required";
    setEditErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api.put(`/utilisateurs/${editing.id_utilisateur}`, editForm);
      toast.success("User updated");
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await api.del(`/utilisateurs/${deleting.id_utilisateur}`);
      toast.success("User deleted");
      setDeleting(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDelLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "avatar", header: "",
      render: (u) => (
        <Avatar className="h-9 w-9">
          {u.avatar && <AvatarImage src={u.avatar} alt="" />}
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials(u)}</AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: "nom", header: "Full name", sortable: true,
      accessor: (u) => `${u.prenom || ""} ${u.nom || ""}`.trim(),
      render: (u) => <div className="font-medium">{`${u.prenom || ""} ${u.nom || ""}`.trim() || "—"}</div>,
    },
    { key: "email", header: "Email", sortable: true, render: (u) => <span className="text-muted-foreground">{u.email || "—"}</span> },
    { key: "telephone", header: "Phone", render: (u) => u.telephone || "—" },
    {
      key: "role", header: "Role", sortable: true,
      render: (u) => (
        <Badge
          variant="outline"
          className={
            u.role === "ADMIN"
              ? "bg-accent/20 text-accent-foreground border-accent/40"
              : "bg-muted text-foreground border-border"
          }
        >
          {u.role || "USER"}
        </Badge>
      ),
    },
    {
      key: "date_inscription", header: "Joined", sortable: true,
      render: (u) => u.date_inscription ? new Date(u.date_inscription).toLocaleDateString() : "—",
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Users"
        description="Manage all platform users."
        action={
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 w-full sm:w-72"
              placeholder="Search by name or email..."
              value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      />

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <PageSpinner />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(u) => u.id_utilisateur}
            empty={<EmptyState icon={<UsersIcon size={26} />} title="No users found" description="Try adjusting your search." />}
            actions={(u) => (
              <div className="flex items-center justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => setViewing(u)}><Eye size={16} /></Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Pencil size={16} /></Button>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(u)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          />
        )}
      </div>

      {/* View drawer */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User details</SheetTitle>
            <SheetDescription>Full information about this user.</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {viewing.avatar && <AvatarImage src={viewing.avatar} alt="" />}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(viewing)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{`${viewing.prenom || ""} ${viewing.nom || ""}`.trim()}</div>
                  <div className="text-sm text-muted-foreground">{viewing.email}</div>
                </div>
              </div>
              <DetailGrid items={[
                ["ID", viewing.id_utilisateur],
                ["Role", viewing.role],
                ["Phone", viewing.telephone],
                ["Language", viewing.langue],
                ["Account type", viewing.type_compte],
                ["Joined", viewing.date_inscription ? new Date(viewing.date_inscription).toLocaleString() : "—"],
              ]} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit user</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <Field label="First name" error={editErrors.prenom}>
              <Input value={editForm.prenom || ""} onChange={(e) => setEditForm((f) => ({ ...f, prenom: e.target.value }))} className={editErrors.prenom ? "border-destructive" : ""} />
            </Field>
            <Field label="Last name" error={editErrors.nom}>
              <Input value={editForm.nom || ""} onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))} className={editErrors.nom ? "border-destructive" : ""} />
            </Field>
            <Field label="Email" error={editErrors.email} className="sm:col-span-2">
              <Input type="email" value={editForm.email || ""} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className={editErrors.email ? "border-destructive" : ""} />
            </Field>
            <Field label="Phone">
              <Input value={editForm.telephone || ""} onChange={(e) => setEditForm((f) => ({ ...f, telephone: e.target.value }))} />
            </Field>
            <Field label="Language">
              <Input value={editForm.langue || ""} onChange={(e) => setEditForm((f) => ({ ...f, langue: e.target.value }))} placeholder="fr / en / ar" />
            </Field>
            <Field label="Account type">
              <Input value={editForm.type_compte || ""} onChange={(e) => setEditForm((f) => ({ ...f, type_compte: e.target.value }))} />
            </Field>
            <Field label="Role">
              <Select value={editForm.role || "USER"} onValueChange={(v) => setEditForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? <Spinner className="text-primary-foreground" /> : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete user?"
        description={deleting ? `This will permanently remove ${deleting.prenom || ""} ${deleting.nom || ""}.` : ""}
        onConfirm={confirmDelete}
        loading={delLoading}
      />
    </div>
  );
}

export function Field({ label, children, error, className = "" }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

export function DetailGrid({ items }: { items: [string, any][] }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-2 border-b last:border-0 text-sm">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-medium text-right break-all">{v ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}
