import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { subjects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSubjects = await db
      .select()
      .from(subjects)
      .where(eq(subjects.userId, user.id))
      .orderBy(subjects.name);

    return Response.json(userSubjects || []);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return Response.json([], { status: 500 });
  }
} 