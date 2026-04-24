import { Inbox } from "lucide-react";
import { ReactNode } from "react";

export function EmptyState({ title = "Aucune donnée", description, icon }: { title?: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon || <Inbox size={26} />}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
