import React, { ReactNode, useEffect, useRef } from "react";
import { ModalHeader } from "./modal-header";
import { ModalFooter } from "./modal-footer";

type Size = "sm" | "md" | "lg" | "full";

const sizeClass: Record<Size, string> = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  full: "max-w-full h-full",
};

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  headerRight?: ReactNode;
  size?: Size;
  closeOnBackdrop?: boolean;
  className?: string;
};

export function Modal({
  open,
  onClose,
  children,
  title,
  footer,
  headerRight,
  size = "md",
  closeOnBackdrop = true,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      containerRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => closeOnBackdrop && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={containerRef}
        className={`relative z-10 w-full ${sizeClass[size]} mx-4 max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg ${className ?? ""}`}
      >
        <ModalHeader right={headerRight}>
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
        </ModalHeader>
        <div className="mt-4">{children}</div>
        <ModalFooter>
          {footer ?? (
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">
              Tutup
            </button>
          )}
        </ModalFooter>
      </div>
    </div>
  );
}
