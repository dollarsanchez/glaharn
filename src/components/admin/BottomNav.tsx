'use client';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
}

export default function BottomNav({ activeTab, onTabChange, pendingCount }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'items', label: 'Items', icon: '🍽️' },
    { id: 'requests', label: 'Requests', icon: '💬', badge: pendingCount },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === item.id
                ? 'text-violet-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute top-1 right-1/4 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            {activeTab === item.id && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-b-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
