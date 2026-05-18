import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Database, Zap, CheckCircle2, Clock, MapPin, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner, Spinner } from "@/components/Spinner";
import { DataTable, Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserMini = {
  id_utilisateur: number;
  nom?: string;
  prenom?: string;
  avatar?: string;
};

type Post = {
  id_post: number;
  contenu: string;
  lieu?: string | null;
  date_creation?: string;
  embedding?: unknown;
  utilisateur?: UserMini;
};

const initials = (u?: UserMini) =>
  u ? `${(u.prenom?.[0] || "").toUpperCase()}${(u.nom?.[0] || "").toUpperCase()}` || "?" : "?";
const fullName = (u?: UserMini) => `${u?.prenom || ""} ${u?.nom || ""}`.trim() || "—";
const isVectorized = (p: Post) => p.embedding != null;

async function callVectorize(postId: number) {
  return api.post(`/ai/admin/vectorize-post/${postId}`);
}

export default function RagManagementPage() {
  const { user } = useAuth();
  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await api.get("/posts?page=1&limit=200");
      const list: Post[] = Array.isArray(data) ? data : data?.posts || [];
      setPosts(list);
    } catch (err: any) {
      toast.error(err?.message || "Échec du chargement des publications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) =>
      `${p.contenu || ""} ${fullName(p.utilisateur)} ${p.lieu || ""} ${p.id_post}`
        .toLowerCase()
        .includes(q)
    );
  }, [posts, query]);

  const stats = useMemo(() => {
    const total = posts.length;
    const done = posts.filter(isVectorized).length;
    return { total, done, pending: total - done };
  }, [posts]);

  const markVectorized = (id: number) =>
    setPosts((ps) => ps.map((p) => (p.id_post === id ? { ...p, embedding: "ok" } : p)));

  const vectorizeOne = async (post: Post) => {
    setBusyIds((s) => new Set(s).add(post.id_post));
    try {
      await callVectorize(post.id_post);
      markVectorized(post.id_post);
      toast.success(`Post #${post.id_post} vectorisé`);
    } catch (err: any) {
      toast.error(err?.message || `Échec pour le post #${post.id_post}`);
    } finally {
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(post.id_post);
        return n;
      });
    }
  };

  const vectorizeAll = async () => {
    const pending = posts.filter((p) => !isVectorized(p));
    if (pending.length === 0) {
      toast.info("Aucun post en attente");
      return;
    }
    setBulkRunning(true);
    let ok = 0;
    let ko = 0;
    for (const p of pending) {
      try {
        setBusyIds((s) => new Set(s).add(p.id_post));
        await callVectorize(p.id_post);
        markVectorized(p.id_post);
        ok++;
      } catch {
        ko++;
      } finally {
        setBusyIds((s) => {
          const n = new Set(s);
          n.delete(p.id_post);
          return n;
        });
      }
    }
    setBulkRunning(false);
    if (ko === 0) toast.success(`${ok} post(s) vectorisé(s)`);
    else toast.warning(`${ok} réussis, ${ko} échoués`);
  };

  if (!isAdmin) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Gestion RAG" description="Base de connaissances IA — réservée aux administrateurs." />
        <EmptyState
          icon={<Lock size={26} />}
          title="Accès refusé"
          description="Cette page est réservée aux administrateurs."
        />
      </div>
    );
  }

  const columns: Column<Post>[] = [
    {
      key: "id_post", header: "ID", sortable: true, className: "w-16",
      render: (p) => <span className="font-mono text-xs">#{p.id_post}</span>,
    },
    {
      key: "auteur", header: "Auteur",
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            {p.utilisateur?.avatar && <AvatarImage src={p.utilisateur.avatar} alt="" />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials(p.utilisateur)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{fullName(p.utilisateur)}</span>
        </div>
      ),
    },
    {
      key: "contenu", header: "Contenu", sortable: true,
      render: (p) => (
        <div className="max-w-md line-clamp-2 text-muted-foreground text-sm">
          {p.contenu || "—"}
        </div>
      ),
    },
    {
      key: "lieu", header: "Lieu",
      render: (p) => p.lieu
        ? <span className="inline-flex items-center gap-1 text-xs"><MapPin size={12} /> {p.lieu}</span>
        : "—",
    },
    {
      key: "date_creation", header: "Créé le", sortable: true,
      render: (p) => p.date_creation ? new Date(p.date_creation).toLocaleDateString() : "—",
    },
    {
      key: "status", header: "Statut", sortable: true,
      accessor: (p) => (isVectorized(p) ? 1 : 0),
      render: (p) => isVectorized(p)
        ? (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 border-emerald-500/30">
            <CheckCircle2 size={12} className="mr-1" /> Vectorisé
          </Badge>
        )
        : (
          <Badge variant="outline" className="text-amber-700 border-amber-500/40">
            <Clock size={12} className="mr-1" /> En attente
          </Badge>
        ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gestion RAG"
        description="Base de connaissances — vectorisez les publications pour la recherche communautaire."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 w-full sm:w-64"
                placeholder="Rechercher..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button onClick={vectorizeAll} disabled={bulkRunning || stats.pending === 0}>
              {bulkRunning ? <Spinner /> : <Zap size={16} />}
              Tout vectoriser {stats.pending > 0 && `(${stats.pending})`}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Vectorisés</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{stats.done}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">En attente</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</div>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <PageSpinner />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(p) => p.id_post}
            empty={
              <EmptyState
                icon={<Database size={26} />}
                title="Aucune publication"
                description="Rien à vectoriser."
              />
            }
            actions={(p) => {
              const busy = busyIds.has(p.id_post);
              const done = isVectorized(p);
              return (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant={done ? "ghost" : "default"}
                    disabled={done || busy}
                    onClick={() => vectorizeOne(p)}
                  >
                    {busy ? <Spinner /> : <Zap size={14} />}
                    {done ? "Déjà fait" : "Vectoriser"}
                  </Button>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}