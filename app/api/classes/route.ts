import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { classes } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.userId, user.id))
      .orderBy(classes.name);

    return Response.json(userClasses || []);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return Response.json([], { status: 500 });
  }
} 