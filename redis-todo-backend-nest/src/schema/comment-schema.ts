import { Repository, Schema } from 'redis-om';
import { createRedisClient } from 'src/redis/client';

const commentSchema = new Schema('Comment', {
  todo_id: { type: 'string' },
  comment: { type: 'string' },
});

export async function setupCommentRepository(): Promise<Repository> {
  const client = await createRedisClient();
  const commentRepository = new Repository(commentSchema, client);
  await commentRepository.createIndex();
  return commentRepository;
}
