'use client';

import { ReactNode } from 'react';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts-modal';

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  useKeyboardShortcuts();

  return (
    <>
      {children}
      <KeyboardShortcutsModal />
    </>
  );
}