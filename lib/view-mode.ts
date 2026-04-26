import { cookies } from 'next/headers';

export type ViewMode = 'organizer' | 'player';

const COOKIE_NAME = 'view-mode';

/**
 * Read the current view mode from cookie. Defaults to 'player'.
 * View mode is stored only in the client (cookie) — no DB persistence.
 */
export function getViewMode(): ViewMode {
  const value = cookies().get(COOKIE_NAME)?.value;
  return value === 'organizer' ? 'organizer' : 'player';
}
