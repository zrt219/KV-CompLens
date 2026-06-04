import React, { forwardRef } from 'react';
import { Button, ButtonProps, cn } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string; // Required for accessibility
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, size = 'md', ...props }, ref) => {

    const sizes = {
      sm: 'w-[36px] h-[36px] p-0',
      md: 'w-[40px] h-[40px] p-0',
      lg: 'w-[44px] h-[44px] p-0'
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(sizes[size], className)}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
