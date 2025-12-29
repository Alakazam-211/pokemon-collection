import { ReactNode, HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
}

/**
 * GlassCard Component
 * 
 * A versatile card component with glassmorphic styling.
 * 
 * @example
 * ```tsx
 * <GlassCard variant="light" className="p-8">
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </GlassCard>
 * ```
 */
export default function GlassCard({
  children,
  className = '',
  variant = 'light',
  ...props
}: GlassCardProps) {
  const baseClasses = variant === 'light' ? 'glass-card' : 'glass-card-dark';
  
  return (
    <div className={`${baseClasses} rounded-3xl p-8 ${className}`} {...props}>
      {children}
    </div>
  );
}

