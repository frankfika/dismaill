import * as React from 'react'
import { cn } from '../../lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const Avatar: React.FC<AvatarProps> = ({
  className,
  src,
  alt,
  fallback,
  size = 'md',
  ...props
}) => {
  const [error, setError] = React.useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-white font-medium overflow-hidden',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span>{fallback ? getInitials(fallback) : '?'}</span>
      )}
    </div>
  )
}

export { Avatar }
