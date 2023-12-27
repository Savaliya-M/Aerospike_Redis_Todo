import { Repository, Schema } from 'redis-om';
import { createRedisClient } from 'src/redis/client';

const todoSchema = new Schema('Todo', {
  userId: { type: 'string' },
  createdBy: { type: 'string' },
  assigned_to: { type: 'string' },
  todo: { type: 'string' },
  due_date_time: { type: 'date' },
  fullName: { type: 'string' },
  is_completed: { type: 'boolean' },
  id: { type: 'string' },
});

export async function setupTodoRepository(): Promise<Repository> {
  const client = await createRedisClient();
  const todoRepository = new Repository(todoSchema, client);
  await todoRepository.createIndex();
  return todoRepository;
}
