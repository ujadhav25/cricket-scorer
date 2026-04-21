'use client';

import { getInitials } from '@/lib/utils';
import { useState } from 'react';

// Upgrade Google profile picture to 256px for crisp display
function upgradeImageUrl(url: string): string {
  // Google: replace =s96-c or =s64-c etc. with =s256-c
  return url.replace(/=s\d+-c/, '=s256-c');
}

export function UserAvatar({ image, name }: { image?: string | null; name: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = image ? upgradeImageUrl(image) : null;

  return (
    <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden ring-2 ring-border">
      {src && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-cricket-green/20 text-xl font-bold text-cricket-green">
          {getInitials(name || 'U')}
        </div>
      )}
    </div>
  );
}
