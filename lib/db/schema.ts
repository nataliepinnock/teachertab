import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

//
// USERS
//
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  teacherType: varchar('teacher_type', { length: 20 }).notNull(), // 'primary' or 'secondary'
  timetableCycle: varchar('timetable_cycle', { length: 10 }).notNull().default('weekly'), // 'weekly' or '2-weekly'

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
}));

//
// CLASSES
//
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isArchived: integer('is_archived').notNull().default(0), // 0 = active, 1 = archived
});

export const classesRelations = relations(classes, ({ one, many }) => ({
  user: one(users, {
    fields: [classes.userId],
    references: [users.id],
  }),
  timetableEntries: many(timetableEntries),
}));

//
// SUBJECTS
//
export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
});

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  user: one(users, {
    fields: [subjects.userId],
    references: [users.id],
  }),
  timetableEntries: many(timetableEntries),
}));

//
// TIMETABLE SLOTS
//
export const timetableSlots = pgTable('timetable_slots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  period: integer('period').notNull(),
  weekNumber: integer('week_number').notNull().default(1), // 1 or 2
  startTime: varchar('start_time', { length: 5 }).notNull(), // "09:00"
  endTime: varchar('end_time', { length: 5 }).notNull(),     // "10:00"
  label: varchar('label', { length: 100 }), // e.g. "Lesson 1"
});

export const timetableSlotsRelations = relations(timetableSlots, ({ one }) => ({
  user: one(users, {
    fields: [timetableSlots.userId],
    references: [users.id],
  }),
}));

//
// TIMETABLE ENTRIES
//
export const timetableEntries = pgTable('timetable_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  classId: integer('class_id').references(() => classes.id),
  subjectId: integer('subject_id').references(() => subjects.id),

  dayOfWeek: varchar('day_of_week', { length: 10 }).notNull(), // "Monday"
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

export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  classId: integer('class_id').notNull().references(() => classes.id),
  subjectId: integer('subject_id').notNull().references(() => subjects.id),
  timetableSlotId: integer('timetable_slot_id').notNull().references(() => timetableSlots.id),

  title: varchar('title', { length: 255 }).notNull(),
  date: timestamp('date').notNull(), // when the lesson happens
  lessonPlan: text('lesson_plan'),   // optional markdown or rich text
  planCompleted: integer('plan_completed').notNull().default(0), // 0 = no, 1 = yes
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


//
// TYPES
//
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

