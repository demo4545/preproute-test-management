interface SidebarIconProps {
  src: string
  alt?: string
  className?: string
}

export default function SidebarIcon({ src, alt = '', className = '' }: SidebarIconProps) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={`sidebar-icon ${className}`.trim()}
    />
  )
}
