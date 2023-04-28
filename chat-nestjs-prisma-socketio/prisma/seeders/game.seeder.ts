import { PrismaClient } from '@prisma/client';

export async function seedGame(client: PrismaClient) {
  return client.game.createMany({
    data: [{ id: 1 }, { id: 2 }],
  });
}
