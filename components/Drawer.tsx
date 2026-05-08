'use client';

import type { ReactNode } from 'react';
import { Button } from './Button';

type DrawerProps = {
  title: string;
  helper?: string;
  open: boolean;
  children: ReactNode;
  onClose: () => void;
  onSave?: () => void;
};

export function Drawer({ title, helper, open, children, onClose, onSave }: DrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Close drawer backdrop"
        className="fixed inset-0 z-30 bg-black/25"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-40 flex h-screen w-[460px] max-w-[90vw] flex-col bg-white shadow-soft">
        <div className="border-b border-border p-5">
          <div className="font-title text-lg font-semibold text-primaryText">{title}</div>
          {helper ? <p className="mt-1 text-xs text-helperText">{helper}</p> : null}
        </div>
        <div className="flex-1 overflow-y-auto p-5 pb-24">{children}</div>
        <div className="absolute bottom-0 left-0 right-0 flex justify-end gap-2 border-t border-border bg-white p-4">
          <Button variant="primary" onClick={onSave ?? onClose}>Save</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </aside>
    </>
  );
}
