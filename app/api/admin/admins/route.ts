import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/assert-admin';

export async function GET() {
  const admin = await assertAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      department: true,
      permissions: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  const admin = await assertAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { email, name, department } = body ?? {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 409 });

  const newAdmin = await prisma.admin.create({
    data: {
      email,
      name: name ?? null,
      department: department ?? null,
    },
    select: { id: true, email: true, name: true, department: true, createdAt: true },
  });

  return NextResponse.json(newAdmin, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const admin = await assertAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id } = body ?? {};

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  if (id === admin.id) return NextResponse.json({ error: 'Cannot remove your own admin account' }, { status: 400 });

  await prisma.admin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
