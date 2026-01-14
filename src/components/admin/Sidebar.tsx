'use client';

import { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  pendingCount,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'items', label: 'Items', icon: '🍽️' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'requests', label: 'Requests', icon: '💬', badge: pendingCount },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleCollapse}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out z-50
          ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-violet-700 to-purple-600 bg-clip-text text-transparent">
                  กล้าหาร
                </span>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isCollapsed ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg
                      transition-all duration-200 relative
                      ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 font-semibold shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {/* Active indicator */}
                    {activeTab === item.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-violet-600 to-purple-600 rounded-r-full" />
                    )}

                    {/* Icon */}
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>

                    {/* Label */}
                    {!isCollapsed && (
                      <span className="flex-1 text-left">{item.label}</span>
                    )}

                    {/* Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">Admin</p>
                  <p className="text-xs text-gray-500">Signed in</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
