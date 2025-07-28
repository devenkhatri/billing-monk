'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    key: 'd',
    altKey: true,
    action: () => window.location.href = '/',
    description: 'Go to Dashboard'
  },
  {
    key: 'c',
    altKey: true,
    action: () => window.location.href = '/clients',
    description: 'Go to Clients'
  },
  {
    key: 'i',
    altKey: true,
    action: () => window.location.href = '/invoices',
    description: 'Go to Invoices'
  },
  {
    key: 'p',
    altKey: true,
    action: () => window.location.href = '/payments',
    description: 'Go to Payments'
  },
  {
    key: 'r',
    altKey: true,
    action: () => window.location.href = '/reports',
    description: 'Go to Reports'
  },
  {
    key: 's',
    altKey: true,
    action: () => window.location.href = '/settings',
    description: 'Go to Settings'
  },
  {
    key: 'n',
    ctrlKey: true,
    action: () => {
      const path = window.location.pathname;
      if (path.includes('/clients')) {
        window.location.href = '/clients?action=new';
      } else if (path.includes('/invoices')) {
        window.location.href = '/invoices?action=new';
      } else if (path.includes('/payments')) {
        window.location.href = '/payments?action=new';
      }
    },
    description: 'Create New (context-aware)'
  },
  {
    key: '/',
    ctrlKey: true,
    action: () => {
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Focus Search'
  },
  {
    key: '?',
    shiftKey: true,
    action: () => {
      // This will be handled by the help modal
      const event = new CustomEvent('show-keyboard-shortcuts');
      window.dispatchEvent(event);
    },
    description: 'Show Keyboard Shortcuts'
  }
];

export function useKeyboardShortcuts() {
  const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { shortcuts };
}