import { PrismaClient } from '@prisma/client';
import { ActiveStatus } from 'src/enum/user.enum';

export async function seedStatus(client: PrismaClient) {
  return client.status.createMany({
    data: [
      { id: ActiveStatus.Online, name: 'online' },
      { id: ActiveStatus.Busy, name: 'busy' },
    ],
  });
}
