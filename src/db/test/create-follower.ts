import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.$connect();

async function getUserIdList(userId: string): Promise<Array<string>> {
  try {
    const userIdList = await prisma.user.findMany({
      select: {
        id: true,
      },
      where: {
        NOT: {
          id: userId,
        },
      },
    });

    return userIdList.map((x) => x.id);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function createFollower(userId: string): Promise<void> {
  try {
    const userList = await getUserIdList(userId);
    const floowDataList = userList.map((id) => {
      return { type: 'FOLLOW', from: userId, to: id };
    });

    await prisma.userRelation.createMany({
      data: floowDataList,
    });
  } catch (err) {
    throw new Error(err.message);
  }
}

const userId = '';

createFollower(userId).then(() => {
  console.log('done');
});
