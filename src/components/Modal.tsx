"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, labelledBy, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Verrou de défilement + focus initial : ne se déclenche qu'à l'ouverture,
  // jamais à chaque rendu, pour ne pas voler le focus des champs de saisie.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Écouteur Échap séparé : peut se relier sans toucher au focus.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 md:items-center">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="animate-scrim fixed inset-0 cursor-default bg-ink/35"
        style={{ backdropFilter: "saturate(0.9)" }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="animate-sheet relative my-auto w-full max-w-3xl border border-rule-strong bg-surface shadow-[0_24px_60px_-24px_oklch(0.27_0.018_265/0.45)] outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fiche"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sunk hover:text-ink"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
