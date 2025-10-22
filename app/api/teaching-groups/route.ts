import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { classes, subjects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch both classes and subjects for the user
    const userClasses = await db.select().from(classes).where(eq(classes.userId, parseInt(userId)));
    const userSubjects = await db.select().from(subjects).where(eq(subjects.userId, parseInt(userId)));

    // Create teaching groups by combining classes and subjects
    const teachingGroups = userClasses.flatMap(cls => 
      userSubjects.map(subject => ({
        id: `${cls.id}-${subject.id}`,
        classId: cls.id,
        subjectId: subject.id,
        className: cls.name,
        subjectName: subject.name,
        numberOfStudents: cls.numberOfStudents || 0,
        notes: cls.notes || '',
        color: subject.color || '#000000',
        isArchived: cls.isArchived === 1
      }))
    );

    return NextResponse.json(teachingGroups);
  } catch (error) {
    console.error('Error fetching teaching groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { className, subjectName, numberOfStudents, notes, color, userId } = body;

    if (!className || !subjectName || !userId) {
      return NextResponse.json({ error: 'Class name, subject name, and user ID are required' }, { status: 400 });
    }

    // Check if class already exists
    let existingClass = await db.select().from(classes).where(
      and(eq(classes.name, className), eq(classes.userId, userId))
    ).limit(1);

    let classId: number;

    if (existingClass.length === 0) {
      // Create new class
      const newClass = await db.insert(classes).values({
        userId: parseInt(userId),
        name: className,
        numberOfStudents: numberOfStudents || 0,
        notes: notes || '',
        color: color || null
      }).returning();
      classId = newClass[0].id;
    } else {
      classId = existingClass[0].id;
    }

    // Check if subject already exists
    let existingSubject = await db.select().from(subjects).where(
      and(eq(subjects.name, subjectName), eq(subjects.userId, userId))
    ).limit(1);

    let subjectId: number;

    if (existingSubject.length === 0) {
      // Create new subject
      const newSubject = await db.insert(subjects).values({
        userId: parseInt(userId),
        name: subjectName,
        color: color || null
      }).returning();
      subjectId = newSubject[0].id;
    } else {
      subjectId = existingSubject[0].id;
    }

    return NextResponse.json({ 
      success: true, 
      teachingGroup: {
        id: `${classId}-${subjectId}`,
        classId,
        subjectId,
        className,
        subjectName,
        numberOfStudents: numberOfStudents || 0,
        notes: notes || '',
        color: color || '#000000'
      }
    });
  } catch (error) {
    console.error('Error creating teaching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, subjectId, numberOfStudents, notes, color } = body;

    if (!classId || !subjectId) {
      return NextResponse.json({ error: 'Class ID and subject ID are required' }, { status: 400 });
    }

    // Update class if notes or numberOfStudents changed
    if (numberOfStudents !== undefined || notes !== undefined) {
      await db.update(classes)
        .set({
          numberOfStudents: numberOfStudents,
          notes: notes,
        })
        .where(eq(classes.id, classId));
    }

    // Update subject if color changed
    if (color !== undefined) {
      await db.update(subjects)
        .set({
          color: color
        })
        .where(eq(subjects.id, subjectId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating teaching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');

    if (!classId || !subjectId) {
      return NextResponse.json({ error: 'Class ID and subject ID are required' }, { status: 400 });
    }

    // Archive the class (soft delete)
    await db.update(classes)
      .set({ isArchived: 1 })
      .where(eq(classes.id, parseInt(classId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting teaching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 