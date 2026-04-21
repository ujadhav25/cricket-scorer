import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOvers(totalBalls: number): string {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
}

/**
 * Compute total legal balls from a delivery list using the over-structure formula.
 * This is the single source of truth for overs display across all pages.
 *
 * Uses maxOver * 6 + ballsInCurrentOver rather than a raw count so it
 * stays correct even if the DB has a stale/extra delivery in any over.
 */
export function legalBallCount(
  deliveries: Array<{ overNumber: number; isWide: boolean; isNoBall: boolean }>
): number {
  const legal = deliveries.filter((d) => !d.isWide && !d.isNoBall);
  if (legal.length === 0) return 0;
  const maxOver = Math.max(...legal.map((d) => d.overNumber));
  const inMaxOver = legal.filter((d) => d.overNumber === maxOver).length;
  return maxOver * 6 + Math.min(inMaxOver, 6);
}

/** Same but scoped to a single bowler. */
export function legalBallCountForBowler(
  deliveries: Array<{ overNumber: number; isWide: boolean; isNoBall: boolean; bowlerId: string }>,
  bowlerId: string
): number {
  return legalBallCount(deliveries.filter((d) => d.bowlerId === bowlerId));
}

export function calcRunRate(runs: number, totalBalls: number): string {
  if (totalBalls === 0) return '0.00';
  const rr = (runs / totalBalls) * 6;
  return rr.toFixed(2);
}

export function calcStrikeRate(runs: number, balls: number): string {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(1);
}

export function calcBowlingEconomy(runs: number, totalBalls: number): string {
  if (totalBalls === 0) return '0.00';
  return ((runs / totalBalls) * 6).toFixed(2);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
