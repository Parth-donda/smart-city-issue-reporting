import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 rounded-input',
    rectangular: 'rounded-card',
    circular: 'rounded-full',
  };

  const inlineStyles: React.CSSProperties = {
    ...style,
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'circular' ? width : undefined),
  };

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-line/80 ${variantStyles[variant]} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
};

