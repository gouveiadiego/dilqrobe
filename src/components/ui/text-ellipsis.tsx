
import React from 'react';
import { cn } from '@/lib/utils';

interface TextEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  maxLength?: number;
  className?: string;
}

export const TextEllipsis: React.FC<TextEllipsisProps> = ({
  text, 
  maxLength = 50, 
  className,
  ...props
}) => {
  const truncatedText = text.length > maxLength 
    ? `${text.slice(0, maxLength)}...` 
    : text;

  return (
    <span 
      title={text} 
      className={cn(
        "inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap",
        className
      )}
      {...props}
    >
      {truncatedText}
    </span>
  );
};
