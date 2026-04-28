/**
 * CricScorer GA4 analytics utility
 * Measurement ID: G-R2QNLWWCEH
 *
 * All tracking calls are wrapped in try/catch so a failure never
 * breaks the user experience.  PII (email, name, phone) is never sent.
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function isBot(): boolean {
  return isBrowser() && !!navigator.webdriver;
}

/** Fire a GA4 event. All events are no-ops in SSR, bot environments, or if gtag fails. */
export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  try {
    if (!isBrowser() || isBot()) return;
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', eventName, {
      page_path: window.location.pathname,
      page_title: document.title,
      app_version: APP_VERSION,
      ...params,
    });
  } catch {
    // Never throw — tracking must not affect UX
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export const analytics = {
  // Auth events
  login: (method: 'google' | 'email') =>
    trackEvent('login', { method }),

  signUp: (method: 'google' | 'email') =>
    trackEvent('sign_up', { method }),

  logout: () =>
    trackEvent('logout'),

  magicLinkSent: () =>
    trackEvent('magic_link_sent'),

  // View switch
  viewSwitchOpened: (current_view: string) =>
    trackEvent('view_switch_opened', { current_view }),

  viewSwitchConfirmed: (from_view: string, to_view: string) =>
    trackEvent('view_switch_confirmed', { from_view, to_view }),

  // Navigation
  navClick: (destination: string) =>
    trackEvent('nav_click', { destination }),

  // Forms
  formStart: (form_name: string) =>
    trackEvent('form_start', { form_name }),

  formSubmit: (form_name: string) =>
    trackEvent('form_submit', { form_name }),

  formSuccess: (form_name: string, extra: Record<string, unknown> = {}) =>
    trackEvent('form_success', { form_name, ...extra }),

  formError: (form_name: string, error_message: string) =>
    trackEvent('form_error', { form_name, error_message }),

  // Teams
  teamCreated: () =>
    trackEvent('team_created'),

  teamUpdated: () =>
    trackEvent('team_updated'),

  teamDeleted: () =>
    trackEvent('team_deleted'),

  teamColorPicked: (color: string, source: 'preset' | 'custom') =>
    trackEvent('team_color_picked', { color, source }),

  playerRemovedFromTeam: () =>
    trackEvent('player_removed_from_team'),

  // Matches
  matchCreated: (overs: number, has_tournament: boolean) =>
    trackEvent('match_created', { overs, has_tournament }),

  matchUpdated: () =>
    trackEvent('match_updated'),

  matchDeleted: () =>
    trackEvent('match_deleted'),

  matchTabSwitch: (tab: string) =>
    trackEvent('match_tab_switch', { tab }),

  motmSelected: () =>
    trackEvent('motm_selected'),

  // Scoring
  ballRecorded: (runs: number, is_wicket: boolean, is_extra: boolean) =>
    trackEvent('ball_recorded', { runs, is_wicket, is_extra }),

  undoBall: () =>
    trackEvent('undo_ball'),

  inningsEnded: () =>
    trackEvent('innings_ended'),

  // Tournaments
  tournamentCreated: (format: string, team_count: number) =>
    trackEvent('tournament_created', { format, team_count }),

  tournamentUpdated: () =>
    trackEvent('tournament_updated'),

  tournamentDeleted: () =>
    trackEvent('tournament_deleted'),

  fixturesGenerated: (tournament_id: string) =>
    trackEvent('fixtures_generated', { tournament_id }),

  tournamentTabSwitch: (tab: string) =>
    trackEvent('tournament_tab_switch', { tab }),

  // Players
  playerProfileUpdated: () =>
    trackEvent('player_profile_updated'),

  playerViewed: (is_own_profile: boolean) =>
    trackEvent('player_viewed', { is_own_profile }),

  // Share & invite
  shareOpened: (content_type: 'match' | 'tournament' | 'team_invite' | 'tournament_join') =>
    trackEvent('share_opened', { content_type }),

  shareDismissed: (content_type: string) =>
    trackEvent('share_dismissed', { content_type }),

  linkCopied: (content_type: string) =>
    trackEvent('link_copied', { content_type }),

  nativeShareTriggered: (content_type: string) =>
    trackEvent('native_share_triggered', { content_type }),

  // Settings
  settingsProfileUpdated: () =>
    trackEvent('settings_profile_updated'),

  // Push notifications
  pushSubscribed: () =>
    trackEvent('push_subscribed'),

  pushUnsubscribed: () =>
    trackEvent('push_unsubscribed'),

  // PWA
  pwaInstallPromptShown: () =>
    trackEvent('pwa_install_prompt_shown'),

  pwaInstalled: () =>
    trackEvent('pwa_installed'),

  // Errors
  apiError: (endpoint: string, status_code: number) =>
    trackEvent('api_error', { endpoint, status_code }),
};
