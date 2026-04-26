'use server';

import { cookies } from 'next/headers';

export async function switchView(view: 'organizer' | 'player') {
  cookies().set('view-mode', view, {
    path: '/',
    httpOnly: false, // readable by client too if needed
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
