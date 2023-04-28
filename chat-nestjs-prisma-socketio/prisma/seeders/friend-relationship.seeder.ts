import { PrismaClient } from '@prisma/client';

export async function seedFriendRelationship(client: PrismaClient) {
  return client.friendRelationship.createMany({
    data: [
      {
        inviterId: 1,
        acceptorId: 2,
      },
      {
        inviterId: 1,
        acceptorId: 3,
      },
      {
        inviterId: 4,
        acceptorId: 1,
      },
      {
        inviterId: 4,
        acceptorId: 2,
      },
      {
        inviterId: 4,
        acceptorId: 3,
      },
    ],
  });
}
