'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdatePlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(1, 'Phone is required'),
  battingStyle: z.enum(['Right', 'Left']),
  bowlingStyle: z.enum(['Fast', 'Spin', 'Medium']),
});

export async function updatePlayerProfile(
  playerId: string,
  data: z.infer<typeof UpdatePlayerSchema>
): Promise<{ error?: string; playerId?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const parsed = UpdatePlayerSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Resolve the user's self player (first player owned by this user)
  const player = await prisma.player.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

  if (!player) return { error: 'Player not found' };

  await prisma.player.update({
    where: { id: player.id },
    data: parsed.data,
  });

  return { playerId: player.id };
}
