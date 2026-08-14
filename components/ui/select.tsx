"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type SelectContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
  value: string;
  label: React.ReactNode;
  onSelect: (value: string, label: React.ReactNode) => void;
};

const SelectContext = createContext<SelectContextType | null>(null);

// Walks the SelectContent/SelectItem tree to find the display label
// (the item's children) that matches the current value.
function findLabel(children: React.ReactNode, value: string): React.ReactNode | null {
  let found: React.ReactNode | null = null;
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return;
    const props = child.props as { value?: string; children?: React.ReactNode };
    if (props.value === value) {
      found = props.children ?? null;
      return;
    }
    if (props.children) {
      const nested = findLabel(props.children, value);
      if (nested) found = nested;
    }
  });
  return found;
}

export function Select({
  children,
  value = "",
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState<React.ReactNode>(() => findLabel(children, value));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLabel(findLabel(children, value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newValue: string, newLabel: React.ReactNode) => {
    setLabel(newLabel);
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ open, setOpen, value, label, onSelect: handleSelect }}>
      <div ref={rootRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(SelectContext)!;
  return (
    <button
      type="button"
      onClick={() => ctx.setOpen(!ctx.open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 ${className}`}
    >
      {children}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`ms-2 shrink-0 text-muted-foreground transition-transform ${ctx.open ? "rotate-180" : ""}`}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(SelectContext)!;
  return <span className="truncate">{ctx.label ?? placeholder}</span>;
}

export function SelectContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(SelectContext)!;
  if (!ctx.open) return null;
  return (
    <div
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface-2 p-1 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(SelectContext)!;
  const isActive = ctx.value === value;
  return (
    <div
      onClick={() => ctx.onSelect(value, children)}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-surface ${
        isActive ? "text-accent" : "text-foreground"
      }`}
    >
      {children}
    </div>
  );
}
