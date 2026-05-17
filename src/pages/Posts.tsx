import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Trash2, Search, MessageSquare, Heart, MapPin, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner, Spinner } from "@/components/Spinner";
import { DataTable, Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

type UserMini = {
  id_utilisateur: number;
  nom?: string;
  prenom?: string;
  avatar?: string;
};

type Comment = {
  id_commentaire: number;
  contenu: string;
  date_creation?: string;
  utilisateur?: UserMini;
};

type Post = {
  id_post: number;
  contenu: string;
  image_url?: string | null;
  lieu?: string | null;
  date_creation?: string;
  utilisateur?: UserMini;
  _count?: { likes: number; commentaires: number };
};

const initials = (u?: UserMini) =>
  u ? `${(u.prenom?.[0] || "").toUpperCase()}${(u.nom?.[0] || "").toUpperCase()}` || "?" : "?";

const fullName = (u?: UserMini) => `${u?.prenom || ""} ${u?.nom || ""}`.trim() || "—";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [viewing, setViewing] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [deletingComment, setDeletingComment] = useState<Comment | null>(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await api.get("/posts?page=1&limit=100");
      const list: Post[] = Array.isArray(data) ? data : data?.posts || [];
      setPosts(list);
    } catch (err: any) {
      toast.error(err?.message || "Échec du chargement des publications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadComments = async (postId: number) => {
    setCommentsLoading(true);
    try {
      const data: any = await api.get(`/posts/${postId}/comments?page=1&limit=100`);
      const list: Comment[] = Array.isArray(data) ? data : data?.comments || [];
      setComments(list);
    } catch (err: any) {
      toast.error(err?.message || "Échec du chargement des commentaires");
    } finally {
      setCommentsLoading(false);
    }
  };

  const openView = (p: Post) => {
    setViewing(p);
    setComments([]);
    loadComments(p.id_post);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) =>
      `${p.contenu || ""} ${fullName(p.utilisateur)} ${p.lieu || ""}`.toLowerCase().includes(q)
    );
  }, [posts, query]);

  const confirmDeletePost = async () => {
    if (!deletingPost) return;
    setDelLoading(true);
    try {
      await api.del(`/posts/${deletingPost.id_post}`);
      toast.success("Publication supprimée");
      setDeletingPost(null);
      if (viewing?.id_post === deletingPost.id_post) setViewing(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Échec de la suppression");
    } finally {
      setDelLoading(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!deletingComment) return;
    setDelLoading(true);
    try {
      await api.del(`/posts/comments/${deletingComment.id_commentaire}`);
      toast.success("Commentaire supprimé");
      const id = deletingComment.id_commentaire;
      setDeletingComment(null);
      setComments((cs) => cs.filter((c) => c.id_commentaire !== id));
      if (viewing) {
        setPosts((ps) => ps.map((p) =>
          p.id_post === viewing.id_post
            ? { ...p, _count: { likes: p._count?.likes ?? 0, commentaires: Math.max(0, (p._count?.commentaires ?? 1) - 1) } }
            : p
        ));
      }
    } catch (err: any) {
      toast.error(err?.message || "Échec de la suppression");
    } finally {
      setDelLoading(false);
    }
  };

  const columns: Column<Post>[] = [
    {
      key: "auteur", header: "Auteur",
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            {p.utilisateur?.avatar && <AvatarImage src={p.utilisateur.avatar} alt="" />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials(p.utilisateur)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{fullName(p.utilisateur)}</span>
        </div>
      ),
    },
    {
      key: "contenu", header: "Contenu", sortable: true,
      render: (p) => <div className="max-w-md line-clamp-2 text-muted-foreground">{p.contenu || "—"}</div>,
    },
    {
      key: "lieu", header: "Lieu",
      render: (p) => p.lieu ? <span className="inline-flex items-center gap-1 text-xs"><MapPin size={12} /> {p.lieu}</span> : "—",
    },
    {
      key: "likes", header: "Likes", sortable: true,
      accessor: (p) => p._count?.likes ?? 0,
      render: (p) => <span className="inline-flex items-center gap-1 text-xs"><Heart size={12} /> {p._count?.likes ?? 0}</span>,
    },
    {
      key: "commentaires", header: "Commentaires", sortable: true,
      accessor: (p) => p._count?.commentaires ?? 0,
      render: (p) => <span className="inline-flex items-center gap-1 text-xs"><MessageSquare size={12} /> {p._count?.commentaires ?? 0}</span>,
    },
    {
      key: "date_creation", header: "Publié le", sortable: true,
      render: (p) => p.date_creation ? new Date(p.date_creation).toLocaleDateString() : "—",
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Publications"
        description="Modérez les publications et commentaires de la communauté."
        action={
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 w-full sm:w-72"
              placeholder="Rechercher..."
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
            rowKey={(p) => p.id_post}
            empty={<EmptyState icon={<FileText size={26} />} title="Aucune publication" description="Aucune publication à modérer." />}
            actions={(p) => (
              <div className="flex items-center justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => openView(p)}><Eye size={16} /></Button>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeletingPost(p)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          />
        )}
      </div>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Détails de la publication</SheetTitle>
            <SheetDescription>Contenu, statistiques et commentaires.</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  {viewing.utilisateur?.avatar && <AvatarImage src={viewing.utilisateur.avatar} alt="" />}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(viewing.utilisateur)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{fullName(viewing.utilisateur)}</div>
                  <div className="text-xs text-muted-foreground">
                    {viewing.date_creation ? new Date(viewing.date_creation).toLocaleString() : ""}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-muted/30 whitespace-pre-wrap text-sm">{viewing.contenu}</div>

              {viewing.image_url && (
                <img src={viewing.image_url} alt="" className="w-full rounded-lg border" />
              )}

              <div className="flex flex-wrap gap-2">
                {viewing.lieu && <Badge variant="outline"><MapPin size={12} className="mr-1" />{viewing.lieu}</Badge>}
                <Badge variant="outline"><Heart size={12} className="mr-1" />{viewing._count?.likes ?? 0} likes</Badge>
                <Badge variant="outline"><MessageSquare size={12} className="mr-1" />{viewing._count?.commentaires ?? 0} commentaires</Badge>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Commentaires</h3>
                  <Button size="sm" variant="destructive" onClick={() => setDeletingPost(viewing)}>
                    <Trash2 size={14} /> Supprimer la publication
                  </Button>
                </div>

                {commentsLoading ? (
                  <div className="py-8 flex justify-center"><Spinner /></div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Aucun commentaire.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div key={c.id_commentaire} className="flex gap-3 p-3 rounded-lg border bg-card">
                        <Avatar className="h-8 w-8 shrink-0">
                          {c.utilisateur?.avatar && <AvatarImage src={c.utilisateur.avatar} alt="" />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials(c.utilisateur)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">{fullName(c.utilisateur)}</div>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingComment(c)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {c.date_creation ? new Date(c.date_creation).toLocaleString() : ""}
                          </div>
                          <div className="text-sm whitespace-pre-wrap break-words">{c.contenu}</div>
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

      <ConfirmDialog
        open={!!deletingPost}
        onOpenChange={(o) => !o && setDeletingPost(null)}
        title="Supprimer cette publication ?"
        description="Cette action est définitive et supprimera également les commentaires associés."
        onConfirm={confirmDeletePost}
        loading={delLoading}
      />

      <ConfirmDialog
        open={!!deletingComment}
        onOpenChange={(o) => !o && setDeletingComment(null)}
        title="Supprimer ce commentaire ?"
        description="Cette action est définitive."
        onConfirm={confirmDeleteComment}
        loading={delLoading}
      />
    </div>
  );
}
