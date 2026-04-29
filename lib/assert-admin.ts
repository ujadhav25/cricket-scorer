import { adminAuth, type AdminUser } from '@/lib/admin-auth';

export type { AdminUser };

export async function assertAdmin(): Promise<AdminUser | null> {
  const session = await adminAuth();
  return (session as any)?.admin ?? null;
}
