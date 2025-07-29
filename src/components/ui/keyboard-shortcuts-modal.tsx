'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    key: 'd',
    altKey: true,
    description: 'Go to Dashboard'
  },
  {
    key: 'c',
    altKey: true,
    description: 'Go to Clients'
  },
  {
    key: 'i',
    altKey: true,
    description: 'Go to Invoices'
  },
  {
    key: 'p',
    altKey: true,
    description: 'Go to Payments'
  },
  {
    key: 'r',
    altKey: true,
    description: 'Go to Reports'
  },
  {
    key: 's',
    altKey: true,
    description: 'Go to Settings'
  },
  {
    key: 'a',
    altKey: true,
    description: 'Go to Activity Logs'
  },
  {
    key: 'n',
    ctrlKey: true,
    description: 'Create New (context-aware)'
  },
  {
    key: '/',
    ctrlKey: true,
    description: 'Focus Search'
  },
  {
    key: '?',
    shiftKey: true,
    description: 'Show Keyboard Shortcuts'
  }
];

function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('Cmd');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => {
      setIsOpen(true);
    };

    window.addEventListener('show-keyboard-shortcuts', handleShowShortcuts);
    return () => {
      window.removeEventListener('show-keyboard-shortcuts', handleShowShortcuts);
    };
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Keyboard Shortcuts"
      size="md"
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-6">
          Use these keyboard shortcuts to navigate quickly through the application.
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{shortcut.description}</span>
              <div className="flex items-center space-x-1">
                {formatShortcut(shortcut).split(' + ').map((key, keyIndex, array) => (
                  <span key={keyIndex} className="inline-flex items-center">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-md shadow-sm">
                      {key}
                    </kbd>
                    {keyIndex < array.length - 1 && (
                      <span className="mx-1 text-gray-400">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}