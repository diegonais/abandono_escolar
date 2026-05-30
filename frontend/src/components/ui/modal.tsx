import { type PropsWithChildren, type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModalProps extends PropsWithChildren {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
} as const;

export function Modal({
  isOpen,
  title,
  description,
  onClose,
  footer,
  size = "md",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full rounded-xl border border-slate-200 bg-white shadow-xl",
          sizeClasses[size],
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">{children}</div>

        {footer ? <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
