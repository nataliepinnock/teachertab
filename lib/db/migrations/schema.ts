import { pgTable, foreignKey, serial, integer, varchar, text, date, timestamp, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const classes = pgTable("classes", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	numberOfStudents: integer("number_of_students").default(0).notNull(),
	notes: text(),
	isArchived: integer("is_archived").default(0).notNull(),
	color: varchar({ length: 10 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "classes_user_id_users_id_fk"
		}),
]);

export const lessons = pgTable("lessons", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	classId: integer("class_id").notNull(),
	subjectId: integer("subject_id").notNull(),
	timetableSlotId: integer("timetable_slot_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	date: date().notNull(),
	lessonPlan: text("lesson_plan"),
	planCompleted: integer("plan_completed").default(0).notNull(),
	color: varchar({ length: 10 }),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "lessons_class_id_classes_id_fk"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "lessons_subject_id_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.timetableSlotId],
			foreignColumns: [timetableSlots.id],
			name: "lessons_timetable_slot_id_timetable_slots_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "lessons_user_id_users_id_fk"
		}),
]);

export const subjects = pgTable("subjects", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	color: varchar({ length: 10 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subjects_user_id_users_id_fk"
		}),
]);

export const timetableSlots = pgTable("timetable_slots", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	dayOfWeek: varchar("day_of_week", { length: 10 }).notNull(),
	weekNumber: integer("week_number").default(1).notNull(),
	startTime: varchar("start_time", { length: 5 }).notNull(),
	endTime: varchar("end_time", { length: 5 }).notNull(),
	label: varchar({ length: 100 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "timetable_slots_user_id_users_id_fk"
		}),
]);

export const timetableEntries = pgTable("timetable_entries", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	classId: integer("class_id"),
	subjectId: integer("subject_id"),
	dayOfWeek: varchar("day_of_week", { length: 10 }).notNull(),
	weekNumber: integer("week_number").default(1).notNull(),
	timetableSlotId: integer("timetable_slot_id"),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	room: varchar({ length: 50 }),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "timetable_entries_class_id_classes_id_fk"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "timetable_entries_subject_id_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.timetableSlotId],
			foreignColumns: [timetableSlots.id],
			name: "timetable_entries_timetable_slot_id_timetable_slots_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "timetable_entries_user_id_users_id_fk"
		}),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	location: varchar({ length: 255 }),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	allDay: integer("all_day").default(0).notNull(),
	color: varchar({ length: 10 }),
	isRecurring: integer("is_recurring").default(0).notNull(),
	recurrenceType: varchar("recurrence_type", { length: 20 }),
	recurrenceEndDate: timestamp("recurrence_end_date", { mode: 'string' }),
	parentEventId: integer("parent_event_id"),
}, (table) => [
	foreignKey({
			columns: [table.parentEventId],
			foreignColumns: [table.id],
			name: "events_parent_event_id_events_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "events_user_id_users_id_fk"
		}),
]);

export const tasks = pgTable("tasks", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	priority: varchar({ length: 20 }),
	completed: integer().default(0).notNull(),
	tags: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	color: varchar({ length: 10 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "tasks_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	teacherType: varchar("teacher_type", { length: 20 }).notNull(),
	timetableCycle: varchar("timetable_cycle", { length: 10 }).default('weekly').notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	stripeProductId: text("stripe_product_id"),
	planName: varchar("plan_name", { length: 50 }),
	subscriptionStatus: varchar("subscription_status", { length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_stripe_customer_id_unique").on(table.stripeCustomerId),
	unique("users_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const holidays = pgTable("holidays", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	academicYearId: integer("academic_year_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	type: varchar({ length: 20 }).default('holiday').notNull(),
	color: varchar({ length: 10 }),
}, (table) => [
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "holidays_academic_year_id_academic_years_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "holidays_user_id_users_id_fk"
		}),
]);

export const academicYears = pgTable("academic_years", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	weekCycleStartDate: date("week_cycle_start_date").notNull(),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	skipHolidayWeeks: integer("skip_holiday_weeks").default(1).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "academic_years_user_id_users_id_fk"
		}),
]);
