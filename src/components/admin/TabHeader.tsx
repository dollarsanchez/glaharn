'use client';

import Button from '@/components/ui/Button';

interface TabHeaderProps {
  icon: string;
  title: string;
  count?: number;
  description?: string;
  addLabel?: string;
  onAdd?: () => void;
}

export default function TabHeader({
  icon,
  title,
  count,
  description,
  addLabel = 'Add',
  onAdd,
}: TabHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
      {/* Left section: Icon + Title + Count + Description */}
      <div className="flex items-center gap-4">
        <span className="text-5xl">{icon}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {title}
            {count !== undefined && (
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border border-violet-200">
                {count}
              </span>
            )}
          </h2>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>

      {/* Right section: Add button */}
      {onAdd && (
        <Button
          onClick={onAdd}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <span className="text-xl mr-2">+</span>
          {addLabel}
        </Button>
      )}
    </div>
  );
}
