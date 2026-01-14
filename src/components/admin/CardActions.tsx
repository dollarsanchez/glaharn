'use client';

interface CardAction {
  icon: string;
  label: string;
  onClick: () => void;
  variant: 'primary' | 'danger' | 'secondary';
}

interface CardActionsProps {
  actions: CardAction[];
  className?: string;
}

export default function CardActions({ actions, className = '' }: CardActionsProps) {
  return (
    <div
      className={`
        flex gap-1
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        ${className}
      `}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className={`
            p-2 rounded-lg backdrop-blur-sm transition-all
            hover:scale-110 active:scale-95
            ${
              action.variant === 'danger'
                ? 'bg-rose-100/90 hover:bg-rose-200 text-rose-700'
                : action.variant === 'primary'
                ? 'bg-blue-100/90 hover:bg-blue-200 text-blue-700'
                : 'bg-gray-100/90 hover:bg-gray-200 text-gray-700'
            }
          `}
          title={action.label}
        >
          <span className="text-lg">{action.icon}</span>
        </button>
      ))}
    </div>
  );
}
