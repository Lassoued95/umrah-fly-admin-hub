import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ConfirmDialog({
  open, onOpenChange, title = "Are you sure?", description, confirmText = "Delete", onConfirm, loading,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Working..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
