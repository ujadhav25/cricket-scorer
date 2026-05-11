import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://cricscorer.co.in';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // regenerate at most once per hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const [matches, tournaments] = await Promise.all([
    prisma.match.findMany({
      select: { shareToken: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    }),
    prisma.tournament.findMany({
      select: { shareToken: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    }),
  ]);

  const matchRoutes: MetadataRoute.Sitemap = matches.map((m) => ({
    url: `${BASE_URL}/m/${m.shareToken}`,
    lastModified: m.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const tournamentRoutes: MetadataRoute.Sitemap = tournaments.map((t) => ({
    url: `${BASE_URL}/t/${t.shareToken}`,
    lastModified: t.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...matchRoutes, ...tournamentRoutes];
}
