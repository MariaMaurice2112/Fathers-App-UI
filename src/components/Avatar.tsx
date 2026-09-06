'use client';

import type { Child } from '@/types';
import { getAvatarColor, getInitials } from '@/utils';

interface AvatarProps {
  child: Child;
  size?: number;
}

export default function Avatar({ child, size = 40 }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: getAvatarColor(child.id),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
        fontFamily: 'var(--font-display)',
      }}
    >
      {getInitials(child.name)}
    </div>
  );
}
