'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  href,
  type = 'button',
  disabled = false,
  icon,
  className,
  onClick,
  ...props
}) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium transition-all duration-300 cursor-pointer border-none outline-none relative overflow-hidden',
    'before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-white/20 before:transform before:skew-x-[-45deg] before:transition-all before:duration-1000 before:ease-out',
    'hover:before:left-[100%]',
    {
      'opacity-50 cursor-not-allowed': disabled,
      'hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0': !disabled,
    }
  );

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white hover:shadow-[#2FA3E3]/30',
    secondary: 'bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-gray-600/30',
    outline: 'bg-transparent text-[#2FA3E3] border-2 border-[#2FA3E3] hover:bg-[#2FA3E3] hover:text-white',
    ghost: 'bg-transparent text-[#2FA3E3] hover:bg-[#2FA3E3]/10',
  };

  const sizeClasses = {
    sm: 'py-2 px-4 text-sm rounded-lg gap-2',
    md: 'py-3 px-6 text-base rounded-lg gap-2',
    lg: 'py-4 px-8 text-lg rounded-full gap-3',
  };

  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  const content = (
    <>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={buttonClasses} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;