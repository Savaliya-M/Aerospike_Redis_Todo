// import { Client } from 'redis-om';

// export const client = await createRedisClient();

// async function createRedisClient() {
//   const client = new Client();
//   await client.open('redis://localhost:6379');

//   return client;
// }

import { Client } from 'redis-om';

export async function createRedisClient(): Promise<Client> {
  const client = new Client();
  await client.open('redis://localhost:6379');
  return client;
}
