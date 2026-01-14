'use client';

import { useState } from 'react';

interface FABAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
}

interface FABProps {
  actions: FABAction[];
  badge?: number;  // Optional badge count
}

export default function FAB({ actions, badge }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Speed Dial Actions */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2">
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 pr-4 pl-3 py-3 group"
              style={{
                animation: `slideIn 0.2s ease-out ${index * 0.05}s both`,
              }}
            >
              <span className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                {action.icon}
              </span>
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap pr-2">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Tooltip - shows when closed and hovering */}
      {!isOpen && showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg shadow-xl whitespace-nowrap animate-slide-in-from-bottom">
          Quick Actions
          <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
        className={`
          w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full
          shadow-lg hover:shadow-xl transition-all transform hover:scale-110
          flex items-center justify-center text-white text-2xl
          ${isOpen ? 'rotate-45' : 'rotate-0'}
          ${!isOpen ? 'animate-pulse-ring' : ''}
        `}
        aria-label="Quick actions menu"
      >
        <span className="font-bold">+</span>

        {/* Badge */}
        {badge !== undefined && badge > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {badge}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
