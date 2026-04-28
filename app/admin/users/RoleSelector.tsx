'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  userId: string;
  currentRole: string;
}

const roles = ['ORGANIZER', 'PLAYER', 'SUPER_ADMIN'];

const roleColor: Record<string, string> = {
  ORGANIZER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PLAYER: 'bg-cricket-green-500/15 text-cricket-green border-cricket-green/30',
  SUPER_ADMIN: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function RoleSelector({ userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function changeRole(newRole: string) {
    if (newRole === role) return;
    if (!confirm(`Change role to ${newRole}?`)) return;
    startTransition(async () => {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      setRole(newRole);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1">
      {roles.map((r) => (
        <button
          key={r}
          disabled={isPending}
          onClick={() => changeRole(r)}
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border transition-all ${
            role === r
              ? roleColor[r]
              : 'bg-transparent border-border/30 text-muted-foreground hover:border-border'
          }`}
        >
          {r === 'SUPER_ADMIN' ? 'ADMIN' : r}
        </button>
      ))}
    </div>
  );
}
