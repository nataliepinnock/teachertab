import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { tasks } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, user.id))
      .orderBy(tasks.dueDate, tasks.createdAt);

    return Response.json(userTasks || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return Response.json([], { status: 500 });
  }
} 