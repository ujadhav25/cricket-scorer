import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInitials } from '@/lib/utils';
import ProfileEditForm from './ProfileEditForm';
import { UserAvatar } from './UserAvatar';
import SignOutButton from './SignOutButton';
import { LanguagePicker } from '@/components/LanguagePicker';
import { ShieldAlert } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [dbUser, roleRows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, image: true },
    }),
    // Use raw query so a not-yet-migrated enum (e.g. SUPER_ADMIN) doesn't crash Prisma
    prisma.$queryRaw<{ role: string }[]>`
      SELECT role::text FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `.catch(() => [] as { role: string }[]),
  ]);

  const { user } = session;
  const displayName = dbUser?.name ?? user.name ?? '';
  const phone = dbUser?.phone ?? '';
  const isSuperAdmin = roleRows[0]?.role === 'SUPER_ADMIN';

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-base">Language</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Choose your preferred language for the app UI</p>
            <LanguagePicker />
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar image={user.image} name={displayName || 'U'} />
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <ProfileEditForm initialName={displayName} initialPhone={phone} />

          <div className="border-t border-border pt-4">
            <SignOutButton formAction={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }} />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground/40 text-center">
        v{process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'}
      </p>

      {isSuperAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-2 max-w-lg rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <ShieldAlert className="h-4 w-4" />
          Super Admin Panel
        </Link>
      )}
    </div>
  );
}
