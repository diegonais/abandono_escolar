import { type ReactNode } from "react";
import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  title?: string;
  description?: string;
}

interface EmptyStateProps {
  title: string;
  description: string;
}

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  actions?: ReactNode;
}

export function LoadingState({
  title = "Cargando datos...",
  description = "Espera un momento mientras consultamos la informacion.",
}: LoadingStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <LoaderCircle className="h-6 w-6 animate-spin text-slate-500" />
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <Inbox className="h-6 w-6 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Reintentar",
  actions,
}: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}
