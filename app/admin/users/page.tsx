import { adminAuth } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { RoleSelector } from './RoleSelector';
import { AdminSearch } from '../AdminSearch';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await adminAuth();
  if (!(session as any)?.admin) redirect('/admin/login');

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const search = searchParams.q ?? '';
  const limit = 20;

  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { teams: true, matches: true, tournaments: true, players: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} total</p>
        </div>
        <AdminSearch placeholder="Search name or email…" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">User</th>
                  <th className="text-left px-4 py-2.5 font-medium">Role</th>
                  <th className="text-right px-4 py-2.5 font-medium">Teams</th>
                  <th className="text-right px-4 py-2.5 font-medium">Matches</th>
                  <th className="text-right px-4 py-2.5 font-medium">Tournaments</th>
                  <th className="text-left px-4 py-2.5 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <RoleSelector userId={u.id} currentRole={u.role} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{u._count.teams}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{u._count.matches}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{u._count.tournaments}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(u.createdAt.toISOString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/users?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                Previous
              </a>
            )}
            {page < pages && (
              <a href={`/admin/users?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
