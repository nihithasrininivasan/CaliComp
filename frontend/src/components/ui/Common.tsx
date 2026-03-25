import React from 'react';
import { clsx } from 'clsx';

/* ── Card ──────────────────────────────────────────────────────────────────── */

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
}

export function Card({ children, title, subtitle, headerAction, className }: CardProps) {
  return (
    <div className={clsx('bg-[#111827] rounded-2xl border border-gray-800 p-6', className)}>
      {(title || headerAction) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-bold text-gray-100">{title}</h3>}
            {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Button ────────────────────────────────────────────────────────────────── */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

export function Button({ variant = 'primary', children, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-500',
        variant === 'outline' && 'bg-transparent border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white',
        variant === 'secondary' && 'bg-white text-gray-900 hover:bg-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Badge ─────────────────────────────────────────────────────────────────── */

interface BadgeProps {
  variant?: 'warning' | 'success' | 'danger' | 'info' | 'default';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider',
        variant === 'warning' && 'bg-amber-900/30 text-amber-400 border border-amber-900/50',
        variant === 'success' && 'bg-green-900/30 text-green-400 border border-green-900/50',
        variant === 'danger'  && 'bg-red-900/30 text-red-400 border border-red-900/50',
        variant === 'info'    && 'bg-blue-900/30 text-blue-400 border border-blue-900/50',
        variant === 'default' && 'bg-gray-800 text-gray-400 border border-gray-700',
        className
      )}
    >
      {children}
    </span>
  );
}
