import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

prisma.$connect();

async function createUser(): Promise<void> {
  try {
    const password = await hash('test1!');

    for (let i = 1; i <= 100; i++) {
      await prisma.user.create({
        select: {
          id: true,
        },
        data: {
          email: `test${i}@test.com`,
          password,
          UserProfile: {
            create: {
              nick_name: `test${i}`,
              height: `1${Math.floor(Math.random() * 100)}`.padEnd(3, '0'),
              weight: `${Math.floor(Math.random() * 100)}`.padEnd(2, '0'),
              feet_size: `2${Math.floor(Math.random() * 100)}`.padEnd(3, '0'),
              gender: ['female', 'male'][i % 2],
            },
          },
        },
      });
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

createUser().then(() => {
  console.log('done');
});
