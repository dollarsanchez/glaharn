'use client';

import { useState, useRef, TouchEvent, ReactNode } from 'react';

interface SwipeAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
}

export default function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  className = '',
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return;

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Limit swipe distance
    const maxSwipe = 150;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));

    setOffset(limitedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    // Snap to action or reset
    const threshold = 60;

    if (offset > threshold && leftActions.length > 0) {
      // Trigger left action
      setOffset(0);
      leftActions[0]?.onClick();
    } else if (offset < -threshold && rightActions.length > 0) {
      // Trigger right action
      setOffset(0);
      rightActions[0]?.onClick();
    } else {
      // Reset
      setOffset(0);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Actions */}
      {offset > 0 && leftActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex items-center">
          {leftActions.map((action) => (
            <div
              key={action.id}
              className={`h-full flex items-center justify-center px-6 ${action.bgColor}`}
              style={{ width: `${Math.min(offset, 150)}px` }}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{action.icon}</div>
                <div className={`text-xs font-semibold ${action.color}`}>
                  {action.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {offset < 0 && rightActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center">
          {rightActions.map((action) => (
            <div
              key={action.id}
              className={`h-full flex items-center justify-center px-6 ${action.bgColor}`}
              style={{ width: `${Math.min(Math.abs(offset), 150)}px` }}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{action.icon}</div>
                <div className={`text-xs font-semibold ${action.color}`}>
                  {action.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
        className="relative bg-white"
      >
        {children}
      </div>
    </div>
  );
}
