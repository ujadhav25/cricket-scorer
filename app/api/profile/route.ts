import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession, unauthorizedResponse, badRequestResponse, serverErrorResponse } from '@/lib/api-helpers';

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
});

export async function GET(_req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });
    return NextResponse.json(user);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: { id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
