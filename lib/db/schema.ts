import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// USERS
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  teacherType: varchar('teacher_type', { length: 20 }).notNull(),
  timetableCycle: varchar('timetable_cycle', { length: 10 }).notNull().default('weekly'),

  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const usersRelations = relations(users, ({ many }) => ({
  classes: many(classes),
  subjects: many(subjects),
  timetableEntries: many(timetableEntries),
  timetableSlots: many(timetableSlots),
  lessons: many(lessons),
  tasks: many(tasks),
  events: many(events),
}));

// CLASSES
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isArchived: integer('is_archived').notNull().default(0),
  color: varchar('color', { length: 10 }),
});

export const classesRelations = relations(classes, ({ one, many }) => ({
  user: one(users, {
    fields: [classes.userId],
    references: [users.id],
  }),
  timetableEntries: many(timetableEntries),
  lessons: many(lessons),
}));

// SUBJECTS
export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 10 }),
});

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  user: one(users, {
    fields: [subjects.userId],
    references: [users.id],
  }),
  timetableEntries: many(timetableEntries),
  lessons: many(lessons),
}));

// TIMETABLE SLOTS
export const timetableSlots = pgTable('timetable_slots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  period: integer('period').notNull(),
  weekNumber: integer('week_number').notNull().default(1),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  label: varchar('label', { length: 100 }),
});

export const timetableSlotsRelations = relations(timetableSlots, ({ one, many }) => ({
  user: one(users, {
    fields: [timetableSlots.userId],
    references: [users.id],
  }),
  lessons: many(lessons),
}));

// TIMETABLE ENTRIES
export const timetableEntries = pgTable('timetable_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  classId: integer('class_id').references(() => classes.id),
  subjectId: integer('subject_id').references(() => subjects.id),

  dayOfWeek: varchar('day_of_week', { length: 10 }).notNull(),
  period: integer('period').notNull(),
  weekNumber: integer('week_number').notNull().default(1),
  timetableSlotId: integer('timetable_slot_id').references(() => timetableSlots.id),

  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  room: varchar('room', { length: 50 }),
  notes: text('notes'),
});

export const timetableEntriesRelations = relations(timetableEntries, ({ one }) => ({
  user: one(users, {
    fields: [timetableEntries.userId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [timetableEntries.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [timetableEntries.subjectId],
    references: [subjects.id],
  }),
  timetableSlot: one(timetableSlots, {
    fields: [timetableEntries.timetableSlotId],
    references: [timetableSlots.id],
  }),
}));

// LESSONS
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  classId: integer('class_id').notNull().references(() => classes.id),
  subjectId: integer('subject_id').notNull().references(() => subjects.id),
  timetableSlotId: integer('timetable_slot_id').notNull().references(() => timetableSlots.id),
  title: varchar('title', { length: 255 }).notNull(),
  date: date('date').notNull(),
  lessonPlan: text('lesson_plan'),
  planCompleted: integer('plan_completed').notNull().default(0),
});

export const lessonsRelations = relations(lessons, ({ one }) => ({
  user: one(users, {
    fields: [lessons.userId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [lessons.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [lessons.subjectId],
    references: [subjects.id],
  }),
  timetableSlot: one(timetableSlots, {
    fields: [lessons.timetableSlotId],
    references: [timetableSlots.id],
  }),
}));

// TASKS (single-table with array of tags)
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date'),
  priority: varchar('priority', { length: 20 }),
  completed: integer('completed').notNull().default(0),
  tags: varchar('tags', { length: 500 }), // Store as JSON string instead of array
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

// EVENTS
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  allDay: integer('all_day').notNull().default(0),
});

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
}));

// TYPES
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type TimetableEntry = typeof timetableEntries.$inferSelect;
export type NewTimetableEntry = typeof timetableEntries.$inferInsert;

export type TimetableSlot = typeof timetableSlots.$inferSelect;
export type NewTimetableSlot = typeof timetableSlots.$inferInsert;

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
