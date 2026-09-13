import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

type CreateTestUserParams = {
  prisma: PrismaService;
  email: string;
  role: Role;
  name?: string;
  password?: string;
};

export async function createTestUser({
  prisma,
  email,
  role,
  name = 'Test User',
  password = 'test12345',
}: CreateTestUserParams) {
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      role,
      name,
      passwordHash,
    },
  });
}
