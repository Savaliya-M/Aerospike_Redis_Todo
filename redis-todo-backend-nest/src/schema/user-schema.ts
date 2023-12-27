// import { Repository, Schema } from 'redis-om';
// import { client } from 'src/redis/client';
// const userSchema = new Schema('User', {
//   fullName: { type: 'string' },
//   email: { type: 'string' },
//   password: { type: 'string' },
//   role: { type: 'string' }, // Assuming role is a string field
//   manager: { type: 'string' }, // Assuming manager is a string field
// });

// export async function setupUserRepository() {
//   const userRepository = new Repository(userSchema, await client);
//   await userRepository.createIndex();
//   return userRepository;
// }

// src/schema/user-schema.ts

import { Repository, Schema } from 'redis-om';
import { createRedisClient } from 'src/redis/client';

const userSchema = new Schema('User', {
  fullName: { type: 'string' },
  email: { type: 'string' },
  password: { type: 'string' },
  role: { type: 'string' },
  manager: { type: 'string' },
});

export async function setupUserRepository(): Promise<Repository> {
  const client = await createRedisClient();
  const userRepository = new Repository(userSchema, client);
  await userRepository.createIndex();
  return userRepository;
}
