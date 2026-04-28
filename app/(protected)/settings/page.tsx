import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInitials } from '@/lib/utils';
import ProfileEditForm from './ProfileEditForm';
import { UserAvatar } from './UserAvatar';
import SignOutButton from './SignOutButton';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, image: true },
  });

  const { user } = session;
  const displayName = dbUser?.name ?? user.name ?? '';
  const phone = dbUser?.phone ?? '';

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

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
    </div>
  );
}
