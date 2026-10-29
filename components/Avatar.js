import { initials } from '@/lib/utils';

export default function Avatar({ user, size = '', className = '' }) {
  const cls = `avatar ${size ? `avatar-${size}` : ''} ${className}`;
  if (user?.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt={user.name || ''} className={cls} />;
  }
  return <span className={`${cls} avatar-fallback`}>{initials(user?.name || '?')}</span>;
}
