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

  teachingPhase: varchar('teaching_phase', { length: 20 }).notNull().default('primary'), // primary, secondary, further, elementary, middle, high
  colorPreference: varchar('color_preference', { length: 10 }).notNull().default('subject'), // 'class' or 'subject'
  timetableCycle: varchar('timetable_cycle', { length: 10 }).notNull().default('weekly'),
  location: varchar('location', { length: 10 }).notNull().default('UK'), // UK, US, or Other

  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),

  marketingEmails: integer('marketing_emails').notNull().default(1), // 1 = subscribed, 0 = unsubscribed

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id]
    })
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  passwordResetTokens: many(passwordResetTokens),
  classes: many(classes),
  subjects: many(subjects),
  timetableEntries: many(timetableEntries),
  timetableActivities: many(timetableActivities),
  timetableSlots: many(timetableSlots),
  lessons: many(lessons),
  tasks: many(tasks),
  events: many(events),
  academicYears: many(academicYears),
  holidays: many(holidays),
}));

// CLASSES
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  numberOfStudents: integer('number_of_students').notNull().default(0),
  notes: text('notes'),
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
  notes: text('notes'),
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
  dayOfWeek: varchar('day_of_week', { length: 10 }).notNull(),
  weekNumber: integer('week_number').notNull().default(1),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  label: varchar('label', { length: 100 }).notNull(),
});

export const timetableSlotsRelations = relations(timetableSlots, ({ one, many }) => ({
  user: one(users, {
    fields: [timetableSlots.userId],
    references: [users.id],
  }),
  lessons: many(lessons),
  activities: many(timetableActivities),
}));

// TIMETABLE ENTRIES
export const timetableEntries = pgTable('timetable_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  classId: integer('class_id').references(() => classes.id),
  subjectId: integer('subject_id').references(() => subjects.id),

  dayOfWeek: varchar('day_of_week', { length: 10 }).notNull(),
  weekNumber: integer('week_number').notNull().default(1),
  timetableSlotId: integer('timetable_slot_id').references(() => timetableSlots.id),

  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  room: varchar('room', { length: 50 }),
  notes: text('notes'),
});

// New table for timetable activities (meetings, duties, planning time, etc.)
export const timetableActivities = pgTable('timetable_activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  timetableSlotId: integer('timetable_slot_id').notNull().references(() => timetableSlots.id),
  
  activityType: varchar('activity_type', { length: 20 }).notNull(), // 'meeting', 'duty', 'planning', 'other'
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 100 }),
  color: varchar('color', { length: 10 }),
  
  dayOfWeek: varchar('day_of_week', { length: 10 }).notNull(),
  weekNumber: integer('week_number').notNull().default(1),
  
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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

export const timetableActivitiesRelations = relations(timetableActivities, ({ one }) => ({
  user: one(users, {
    fields: [timetableActivities.userId],
    references: [users.id],
  }),
  timetableSlot: one(timetableSlots, {
    fields: [timetableActivities.timetableSlotId],
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
  color: varchar('color', { length: 10 }),
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
  color: varchar('color', { length: 10 }),
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
  color: varchar('color', { length: 10 }),
  // Recurrence fields
  isRecurring: integer('is_recurring').notNull().default(0),
  recurrenceType: varchar('recurrence_type', { length: 20 }), // 'daily', 'weekly', 'monthly', 'week1', 'week2'
  recurrenceEndDate: timestamp('recurrence_end_date'),
  parentEventId: integer('parent_event_id'), // For tracking recurring event series
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  parentEvent: one(events, {
    fields: [events.parentEventId],
    references: [events.id],
    relationName: 'parentEvent',
  }),
  childEvents: many(events, {
    relationName: 'parentEvent',
  }),
}));

// ACADEMIC YEARS
export const academicYears = pgTable('academic_years', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  weekCycleStartDate: date('week_cycle_start_date').notNull(), // Date when Week 1 starts
  skipHolidayWeeks: integer('skip_holiday_weeks').notNull().default(1), // 0 = include holidays, 1 = skip holidays
  isActive: integer('is_active').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const academicYearsRelations = relations(academicYears, ({ one, many }) => ({
  user: one(users, {
    fields: [academicYears.userId],
    references: [users.id],
  }),
  holidays: many(holidays),
}));

// HOLIDAYS
export const holidays = pgTable('holidays', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  academicYearId: integer('academic_year_id').notNull().references(() => academicYears.id),
  name: varchar('name', { length: 100 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('holiday'), // 'holiday', 'half_term', 'term_break', 'inset_day'
  color: varchar('color', { length: 10 }),
});

export const holidaysRelations = relations(holidays, ({ one }) => ({
  user: one(users, {
    fields: [holidays.userId],
    references: [users.id],
  }),
  academicYear: one(academicYears, {
    fields: [holidays.academicYearId],
    references: [academicYears.id],
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

export type AcademicYear = typeof academicYears.$inferSelect;
export type NewAcademicYear = typeof academicYears.$inferInsert;

export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
