import { PrismaClient } from '@prisma/client';

export async function seedUser(client: PrismaClient) {
  return client.user.createMany({
    data: [
      { id: 1, fid: 'RUckX55wLWWMtI7uuB0IxYTXipE2', username: 'tinh`' },
      { id: 2, fid: 'tqR9BYe4RjQEuPH8QJVoBsknoDJ2', username: "binh'" },
      { id: 3, fid: 'PmuDVqanntY08j0saW1qPKZo1Yl1', username: 'truong`' },
      { id: 4, fid: '1ZEa2Qma8FfFrxQHn3z6T0eFhPr1', username: 'doan~' },
      { id: 5, fid: 'Aw8sHDLaG4bS0EG9zrmgYzcueox1', username: 'hop.' },
    ],
  });
}
