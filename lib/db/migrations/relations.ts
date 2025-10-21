import { relations } from "drizzle-orm/relations";
import { users, classes, lessons, subjects, timetableSlots, timetableEntries, events, tasks, academicYears, holidays } from "./schema";

export const classesRelations = relations(classes, ({one, many}) => ({
	user: one(users, {
		fields: [classes.userId],
		references: [users.id]
	}),
	lessons: many(lessons),
	timetableEntries: many(timetableEntries),
}));

export const usersRelations = relations(users, ({many}) => ({
	classes: many(classes),
	lessons: many(lessons),
	subjects: many(subjects),
	timetableSlots: many(timetableSlots),
	timetableEntries: many(timetableEntries),
	events: many(events),
	tasks: many(tasks),
	holidays: many(holidays),
	academicYears: many(academicYears),
}));

export const lessonsRelations = relations(lessons, ({one}) => ({
	class: one(classes, {
		fields: [lessons.classId],
		references: [classes.id]
	}),
	subject: one(subjects, {
		fields: [lessons.subjectId],
		references: [subjects.id]
	}),
	timetableSlot: one(timetableSlots, {
		fields: [lessons.timetableSlotId],
		references: [timetableSlots.id]
	}),
	user: one(users, {
		fields: [lessons.userId],
		references: [users.id]
	}),
}));

export const subjectsRelations = relations(subjects, ({one, many}) => ({
	lessons: many(lessons),
	user: one(users, {
		fields: [subjects.userId],
		references: [users.id]
	}),
	timetableEntries: many(timetableEntries),
}));

export const timetableSlotsRelations = relations(timetableSlots, ({one, many}) => ({
	lessons: many(lessons),
	user: one(users, {
		fields: [timetableSlots.userId],
		references: [users.id]
	}),
	timetableEntries: many(timetableEntries),
}));

export const timetableEntriesRelations = relations(timetableEntries, ({one}) => ({
	class: one(classes, {
		fields: [timetableEntries.classId],
		references: [classes.id]
	}),
	subject: one(subjects, {
		fields: [timetableEntries.subjectId],
		references: [subjects.id]
	}),
	timetableSlot: one(timetableSlots, {
		fields: [timetableEntries.timetableSlotId],
		references: [timetableSlots.id]
	}),
	user: one(users, {
		fields: [timetableEntries.userId],
		references: [users.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	event: one(events, {
		fields: [events.parentEventId],
		references: [events.id],
		relationName: "events_parentEventId_events_id"
	}),
	events: many(events, {
		relationName: "events_parentEventId_events_id"
	}),
	user: one(users, {
		fields: [events.userId],
		references: [users.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one}) => ({
	user: one(users, {
		fields: [tasks.userId],
		references: [users.id]
	}),
}));

export const holidaysRelations = relations(holidays, ({one}) => ({
	academicYear: one(academicYears, {
		fields: [holidays.academicYearId],
		references: [academicYears.id]
	}),
	user: one(users, {
		fields: [holidays.userId],
		references: [users.id]
	}),
}));

export const academicYearsRelations = relations(academicYears, ({one, many}) => ({
	holidays: many(holidays),
	user: one(users, {
		fields: [academicYears.userId],
		references: [users.id]
	}),
}));