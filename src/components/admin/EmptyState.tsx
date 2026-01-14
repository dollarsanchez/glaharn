'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <Card className="text-center py-16 shadow-lg">
      <div className="max-w-md mx-auto space-y-4">
        {/* Animated Icon */}
        <div className="text-8xl mb-6 animate-bounce-slow">
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-gray-600 text-base">{description}</p>
        )}

        {/* Actions */}
        {onAction && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button
              onClick={onAction}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              <span className="text-2xl mr-2">+</span>
              {actionLabel}
            </Button>

            {onSecondary && secondaryLabel && (
              <Button onClick={onSecondary} variant="ghost" size="lg">
                {secondaryLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
