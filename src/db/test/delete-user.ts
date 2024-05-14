import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.$connect();

async function getUserIdList(): Promise<Array<string>> {
  try {
    const userIdList = await prisma.user.findMany({
      select: {
        id: true,
      },
      where: {
        email: {
          contains: '@test.com',
        },
      },
    });

    return userIdList.map((x) => x.id);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function deleteUser(): Promise<void> {
  try {
    const userIdList = await getUserIdList();
    await prisma.$transaction(async (tx) => {
      await tx.profile.deleteMany({
        where: {
          user_id: { in: userIdList },
        },
      });

      await tx.user.deleteMany({
        where: {
          id: { in: userIdList },
        },
      });
    });
  } catch (err) {
    throw new Error(err.message);
  }
}

deleteUser().then(() => {
  console.log('done');
});
