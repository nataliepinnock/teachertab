import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import {
  users,
  classes,
  subjects,
  timetableEntries,
  timetableSlots,
  lessons,
} from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

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

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  let user;
  if (existingUser) {
    console.log('Test user already exists, using existing user.');
    user = existingUser;
  } else {
    const [newUser] = await db
      .insert(users)
      .values([
        {
          name: 'Test Teacher',
          email: email,
          passwordHash: passwordHash,
          teacherType: 'primary',
          timetableCycle: 'weekly',
        },
      ])
      .returning();
    user = newUser;
    console.log('Initial teacher user created.');
  }

  const [maths, science] = await db
    .insert(subjects)
    .values([
      {
        userId: user.id,
        name: 'Maths',
      },
      {
        userId: user.id,
        name: 'Science',
      },
    ])
    .returning();

  const [year3] = await db
    .insert(classes)
    .values([
      {
        userId: user.id,
        name: 'Year 3 - Penguins',
        description: 'My primary class',
      },
    ])
    .returning();

  // Create timetable slots
  const [slot1, slot2, slot3] = await db
    .insert(timetableSlots)
    .values([
      {
        userId: user.id,
        period: 1,
        weekNumber: 1,
        startTime: '09:00',
        endTime: '10:00',
        label: 'Lesson 1',
      },
      {
        userId: user.id,
        period: 2,
        weekNumber: 1,
        startTime: '10:15',
        endTime: '11:15',
        label: 'Lesson 2',
      },
      {
        userId: user.id,
        period: 1,
        weekNumber: 2,
        startTime: '09:00',
        endTime: '10:00',
        label: 'Lesson 1',
      },
    ])
    .returning();

  await db.insert(timetableEntries).values([
    {
      userId: user.id,
      classId: year3.id,
      subjectId: maths.id,
      dayOfWeek: 'Monday',
      period: 1,
      weekNumber: 1,
      timetableSlotId: slot1.id,
      room: 'Room A',
      notes: 'Mental maths and number bonds',
    },
    {
      userId: user.id,
      classId: year3.id,
      subjectId: science.id,
      dayOfWeek: 'Wednesday',
      period: 2,
      weekNumber: 1,
      timetableSlotId: slot2.id,
      room: 'Lab 1',
      notes: 'Plants and their environment',
    },
  ]);

  // Add sample lessons
  await db.insert(lessons).values([
    {
      userId: user.id,
      classId: year3.id,
      subjectId: maths.id,
      timetableSlotId: slot1.id,
      title: 'Introduction to Multiplication',
      date: new Date('2025-06-24T09:00:00'), // matching slot time
      lessonPlan: 'Start with arrays and repeated addition.\nUse concrete resources.\nMini whiteboard quiz.',
      planCompleted: 1, // 1 = completed
    },
    {
      userId: user.id,
      classId: year3.id,
      subjectId: science.id,
      timetableSlotId: slot3.id,
      title: 'Plant Life Cycles',
      date: new Date('2025-07-01T09:30:00'),
      lessonPlan: 'Diagram of seed germination.\nDiscuss with examples from the school garden.',
      planCompleted: 0, // 0 = not yet completed
    },
  ]);

  console.log('📘 Seeded example lessons.');
  console.log('Seeded timetable for test user.');
  await createStripeProducts();
}

seed()
  .then(() => {
    console.log('Seed completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
