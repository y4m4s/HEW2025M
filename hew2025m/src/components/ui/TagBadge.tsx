interface TagBadgeProps {
  tag: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function TagBadge({ tag, size = 'md' }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center
        bg-[#2FA3E3]
        text-white
        ${sizeClasses[size]}
        font-semibold
        rounded-full
        shadow-sm
        hover:shadow-md
        transition-shadow
        duration-200
        whitespace-nowrap
      `}
    >
      {tag}
    </span>
  );
}
