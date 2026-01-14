'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Command {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  commands: Command[];
}

export default function CommandPalette({ commands }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (command: Command) => {
    command.action();
    setIsOpen(false);
    setSearch('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        setSearch('');
      }}
      title=""
      size="lg"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Type a command or search..."
            className="w-full px-4 py-3 text-lg border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            autoFocus
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
            ⌘K
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No commands found</p>
            </div>
          ) : (
            filteredCommands.map((command) => (
              <button
                key={command.id}
                onClick={() => handleSelect(command)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors text-left"
              >
                <span className="text-2xl">{command.icon}</span>
                <span className="font-medium text-gray-900">{command.label}</span>
              </button>
            ))
          )}
        </div>

        {/* Hint */}
        <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded font-mono">↑</kbd>{' '}
          <kbd className="px-2 py-1 bg-gray-100 rounded font-mono">↓</kbd> to navigate,{' '}
          <kbd className="px-2 py-1 bg-gray-100 rounded font-mono">Enter</kbd> to select,{' '}
          <kbd className="px-2 py-1 bg-gray-100 rounded font-mono">Esc</kbd> to close
        </div>
      </div>
    </Modal>
  );
}
