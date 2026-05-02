import { adminAuth } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { AdminManageButtons } from './AdminManageButtons';
import { ShieldAlert } from 'lucide-react';

export default async function AdminAdminsPage() {
  const session = await adminAuth();
  if (!(session as any)?.admin) redirect('/admin/login');

  const currentAdminId = (session as any).admin.id as string;

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      department: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who can access the admin portal. Only Google accounts listed here can sign in.
          </p>
        </div>
        <AdminManageButtons mode="add" />
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/20">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            {admins.length} admin{admins.length !== 1 ? 's' : ''} registered
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/20">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{a.name ?? '—'}</p>
                    {a.id === currentAdminId && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cricket-green-500/15 text-cricket-green shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                  {a.department && (
                    <span className="hidden sm:block px-2 py-0.5 rounded-full bg-muted/50 border border-border/30">
                      {a.department}
                    </span>
                  )}
                  <div className="text-right">
                    <p className="whitespace-nowrap">Added {formatDate(a.createdAt.toISOString())}</p>
                    {a.lastActiveAt && (
                      <p className="text-muted-foreground/60 whitespace-nowrap">
                        Last active {formatDate(a.lastActiveAt.toISOString())}
                      </p>
                    )}
                  </div>
                  {a.id !== currentAdminId && (
                    <AdminManageButtons mode="remove" adminId={a.id} adminEmail={a.email} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400/80 space-y-1">
        <p className="font-semibold text-amber-400">How access works</p>
        <p>Add a Google email address below to grant admin access. The person signs in at <code className="text-xs">/admin/login</code> using their Google account.</p>
        <p>Remove an entry to immediately revoke access — their next sign-in attempt will be blocked.</p>
      </div>
    </div>
  );
}
