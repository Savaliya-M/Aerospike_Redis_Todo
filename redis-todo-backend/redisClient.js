import { createClient } from 'redis';

const client = createClient();

client.on('error', err => console.log('Redis Client Error', err));
client.on('connect', () => {
    console.log('Connected to Redis server');
});
await client.connect();



export { client };