
import React from 'react';
import { cn } from '@/lib/utils';

interface TextEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  maxLength?: number;
  className?: string;
  truncateAfter?: number;
}

export const TextEllipsis: React.FC<TextEllipsisProps> = ({
  text, 
  maxLength = 50, 
  className,
  truncateAfter,
  ...props
}) => {
  // If truncateAfter is provided, truncate the text after that many characters
  // This is useful for ensuring UI elements have space regardless of container width
  const truncatedText = truncateAfter 
    ? text.length > truncateAfter 
      ? `${text.slice(0, truncateAfter)}...` 
      : text
    : text.length > maxLength 
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
