import { Button } from "@/components/ui/button";
import { type PaginationMeta } from "@/types/pagination";

interface PaginationControlsProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ meta, onPageChange }: PaginationControlsProps) {
  const hasPages = meta.totalPages > 0;
  const from = hasPages ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = hasPages ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center">
      <p>
        {hasPages
          ? `Mostrando ${from}-${to} de ${meta.total} registros`
          : "Sin registros para mostrar"}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
        >
          Anterior
        </Button>

        <span className="px-2 text-sm text-slate-700">
          Pagina {hasPages ? meta.page : 0} de {meta.totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!hasPages || meta.page >= meta.totalPages}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
