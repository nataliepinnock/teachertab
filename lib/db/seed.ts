import { db } from './drizzle';
import {
  users,
  classes,
  subjects,
  timetableSlots,
  timetableEntries,
  lessons,
  tasks,
  events,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { stripe } from '../payments/stripe';

async function createStripeProducts() {
  console.log('🔄 Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800,
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200,
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('✅ Stripe products created.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const existingUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (existingUser) {
    console.log('ℹ️ User already exists. Skipping seed.');
    process.exit(0);
  }

  const [user] = await db
    .insert(users)
    .values([
      {
        name: 'Test User',
        email,
        passwordHash,
        teacherType: 'primary',
        timetableCycle: '2-weekly',
        stripeCustomerId: 'cus_dev_001',
        stripeSubscriptionId: 'sub_dev_001',
        stripeProductId: 'prod_dev_001',
        planName: 'Base',
        subscriptionStatus: 'active',
      },
    ])
    .returning();

  console.log('👤 Created test user:', user.email);

  const [maths, science] = await db
    .insert(subjects)
    .values([
      {
        userId: user.id,
        name: 'Maths',
        color: '#4F46E5',
      },
      {
        userId: user.id,
        name: 'Science',
        color: '#10B981',
      },
    ])
    .returning();

  const [class1] = await db
    .insert(classes)
    .values([
      {
        userId: user.id,
        name: 'Year 3 - Penguins',
        numberOfStudents: 25,
        notes: 'Primary class with mixed abilities',
        color: '#F59E0B',
      },
    ])
    .returning();

  const [slotW1P1, slotW2P1] = await db
    .insert(timetableSlots)
    .values([
      {
        userId: user.id,
        dayOfWeek: 'Monday',
        weekNumber: 1,
        startTime: '09:00',
        endTime: '10:00',
        label: 'Lesson 1 (W1)',
      },
      {
        userId: user.id,
        dayOfWeek: 'Monday',
        weekNumber: 2,
        startTime: '09:30',
        endTime: '10:30',
        label: 'Lesson 1 (W2)',
      },
    ])
    .returning();

  await db.insert(timetableEntries).values([
    {
      userId: user.id,
      classId: class1.id,
      subjectId: maths.id,
      dayOfWeek: 'Monday',
      weekNumber: 1,
      timetableSlotId: slotW1P1.id,
      room: 'Room A',
      notes: 'Warm-up quiz + intro activity',
    },
    {
      userId: user.id,
      classId: class1.id,
      subjectId: science.id,
      dayOfWeek: 'Monday',
      weekNumber: 2,  
      timetableSlotId: slotW2P1.id,
      room: 'Room A',
      notes: 'Discussion + garden observations',
    },
  ]);

  console.log('📆 Timetable entries created.');

  await db.insert(lessons).values([
    {
      userId: user.id,
      classId: class1.id,
      subjectId: maths.id,
      timetableSlotId: slotW1P1.id,
      title: 'Number Bonds to 10',
      date: '2025-06-10',
      lessonPlan: 'Use counters and pair activities.\nWrap-up quiz.',
      planCompleted: 1,
    },
    {
      userId: user.id,
      classId: class1.id,
      subjectId: science.id,
      timetableSlotId: slotW2P1.id,
      title: 'What Plants Need to Grow',
      date: '2025-06-12',
      lessonPlan: 'Experiment + discussion.\nSunlight, water, soil.',
      planCompleted: 1,
    },
    {
      userId: user.id,
      classId: class1.id,
      subjectId: maths.id,
      timetableSlotId: slotW1P1.id,
      title: 'Intro to Multiplication',
      date: '2025-06-24',
      lessonPlan: 'Arrays and repeated addition.\nMini whiteboard quiz.',
      planCompleted: 1,
    },
    {
      userId: user.id,
      classId: class1.id,
      subjectId: science.id,
      timetableSlotId: slotW2P1.id,
      title: 'Plant Life Cycles',
      date: '2025-07-01',
      lessonPlan: 'Seed germination diagram.\nSchool garden examples.',
      planCompleted: 0,
    },
    // Test lessons with identical times for overlap testing
    {
      userId: user.id,
      classId: class1.id,
      subjectId: maths.id,
      timetableSlotId: slotW1P1.id,
      title: 'Form Time',
      date: '2025-09-09',
      lessonPlan: 'Registration and announcements',
      planCompleted: 0,
    },
    {
      userId: user.id,
      classId: class1.id,
      subjectId: maths.id,
      timetableSlotId: slotW1P1.id,
      title: 'Percentage of an amount',
      date: '2025-09-09',
      lessonPlan: 'Calculate percentages of amounts',
      planCompleted: 0,
    },
  ]);

  console.log('📘 Lessons created.');

  await db.insert(tasks).values([
    {
      userId: user.id,
      title: 'Grade Maths worksheets',
      description: 'Review and mark the multiplication worksheets from today\'s lesson',
      dueDate: new Date('2025-06-25T17:00:00'),
      priority: 'high',
      completed: 0,
      tags: JSON.stringify(['grading', 'maths', 'worksheets']),
    },
    {
      userId: user.id,
      title: 'Prepare Science experiment materials',
      description: 'Gather materials for the plant growth experiment next week',
      dueDate: new Date('2025-06-30T16:00:00'),
      priority: 'medium',
      completed: 0,
      tags: JSON.stringify(['preparation', 'science', 'experiment']),
    },
    {
      userId: user.id,
      title: 'Update lesson plans',
      description: 'Review and update lesson plans for the upcoming week',
      dueDate: new Date('2025-06-23T18:00:00'),
      priority: 'high',
      completed: 1,
      tags: JSON.stringify(['planning', 'lessons']),
    },
  ]);

  console.log('📋 Tasks created.');

  await db.insert(events).values([
    {
      userId: user.id,
      title: 'Parents Evening',
      description: 'Evening meetings with parents to discuss student progress',
      location: 'Hall',
      startTime: new Date('2025-06-26T16:00:00'),
      endTime: new Date('2025-06-26T18:00:00'),
      allDay: 0,
    },
    {
      userId: user.id,
      title: 'Staff Training Day',
      description: 'INSET day — no pupils in school',
      location: '',
      startTime: new Date('2025-07-05T00:00:00'),
      endTime: new Date('2025-07-05T23:59:59'),
      allDay: 1,
    },
  ]);

  console.log('🗓️ Events created.');
  await createStripeProducts();

  console.log('✅ Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
