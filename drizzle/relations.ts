import { relations } from "drizzle-orm/relations";
import { cities, boards, degrees, programs, news, institutes, dateSheets, programCities, programInstitutes, admissions, levels, categories, results, admissionPrograms, adminRoles, adminUsers, notifications, resultPrograms, userPermissions, permissions, sessions, pageViews } from "./schema";

export const boardsRelations = relations(boards, ({one, many}) => ({
	city: one(cities, {
		fields: [boards.cityId],
		references: [cities.id]
	}),
	news: many(news),
	dateSheets: many(dateSheets),
	results: many(results),
}));

export const citiesRelations = relations(cities, ({many}) => ({
	boards: many(boards),
	news: many(news),
	institutes: many(institutes),
	programCities: many(programCities),
}));

export const programsRelations = relations(programs, ({one, many}) => ({
	degree: one(degrees, {
		fields: [programs.degreeId],
		references: [degrees.id]
	}),
	news: many(news),
	programCities: many(programCities),
	programInstitutes: many(programInstitutes),
	results: many(results),
	admissionPrograms: many(admissionPrograms),
	resultPrograms: many(resultPrograms),
}));

export const degreesRelations = relations(degrees, ({one, many}) => ({
	programs: many(programs),
	level: one(levels, {
		fields: [degrees.levelId],
		references: [levels.id]
	}),
	category: one(categories, {
		fields: [degrees.categoryId],
		references: [categories.id]
	}),
}));

export const newsRelations = relations(news, ({one}) => ({
	program: one(programs, {
		fields: [news.programId],
		references: [programs.id]
	}),
	institute: one(institutes, {
		fields: [news.instituteId],
		references: [institutes.id]
	}),
	board: one(boards, {
		fields: [news.boardId],
		references: [boards.id]
	}),
	city: one(cities, {
		fields: [news.cityId],
		references: [cities.id]
	}),
}));

export const institutesRelations = relations(institutes, ({one, many}) => ({
	news: many(news),
	city: one(cities, {
		fields: [institutes.cityId],
		references: [cities.id]
	}),
	dateSheets: many(dateSheets),
	programInstitutes: many(programInstitutes),
	admissions: many(admissions),
	results_universityId: many(results, {
		relationName: "results_universityId_institutes_id"
	}),
	results_instituteId: many(results, {
		relationName: "results_instituteId_institutes_id"
	}),
}));

export const dateSheetsRelations = relations(dateSheets, ({one}) => ({
	board: one(boards, {
		fields: [dateSheets.boardId],
		references: [boards.id]
	}),
	institute: one(institutes, {
		fields: [dateSheets.universityId],
		references: [institutes.id]
	}),
}));

export const programCitiesRelations = relations(programCities, ({one}) => ({
	program: one(programs, {
		fields: [programCities.programId],
		references: [programs.id]
	}),
	city: one(cities, {
		fields: [programCities.cityId],
		references: [cities.id]
	}),
}));

export const programInstitutesRelations = relations(programInstitutes, ({one}) => ({
	program: one(programs, {
		fields: [programInstitutes.programId],
		references: [programs.id]
	}),
	institute: one(institutes, {
		fields: [programInstitutes.instituteId],
		references: [institutes.id]
	}),
}));

export const admissionsRelations = relations(admissions, ({one, many}) => ({
	institute: one(institutes, {
		fields: [admissions.instituteId],
		references: [institutes.id]
	}),
	admissionPrograms: many(admissionPrograms),
}));

export const levelsRelations = relations(levels, ({many}) => ({
	degrees: many(degrees),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	degrees: many(degrees),
}));

export const resultsRelations = relations(results, ({one, many}) => ({
	board: one(boards, {
		fields: [results.boardId],
		references: [boards.id]
	}),
	institute_universityId: one(institutes, {
		fields: [results.universityId],
		references: [institutes.id],
		relationName: "results_universityId_institutes_id"
	}),
	program: one(programs, {
		fields: [results.programId],
		references: [programs.id]
	}),
	institute_instituteId: one(institutes, {
		fields: [results.instituteId],
		references: [institutes.id],
		relationName: "results_instituteId_institutes_id"
	}),
	resultPrograms: many(resultPrograms),
}));

export const admissionProgramsRelations = relations(admissionPrograms, ({one}) => ({
	admission: one(admissions, {
		fields: [admissionPrograms.admissionId],
		references: [admissions.id]
	}),
	program: one(programs, {
		fields: [admissionPrograms.programId],
		references: [programs.id]
	}),
}));

export const adminUsersRelations = relations(adminUsers, ({one, many}) => ({
	adminRole: one(adminRoles, {
		fields: [adminUsers.roleId],
		references: [adminRoles.id]
	}),
	notifications: many(notifications),
	userPermissions: many(userPermissions),
	sessions: many(sessions),
	pageViews: many(pageViews),
}));

export const adminRolesRelations = relations(adminRoles, ({many}) => ({
	adminUsers: many(adminUsers),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [notifications.userId],
		references: [adminUsers.id]
	}),
}));

export const resultProgramsRelations = relations(resultPrograms, ({one}) => ({
	result: one(results, {
		fields: [resultPrograms.resultId],
		references: [results.id]
	}),
	program: one(programs, {
		fields: [resultPrograms.programId],
		references: [programs.id]
	}),
}));

export const userPermissionsRelations = relations(userPermissions, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [userPermissions.userId],
		references: [adminUsers.id]
	}),
	permission: one(permissions, {
		fields: [userPermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	userPermissions: many(userPermissions),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [sessions.userId],
		references: [adminUsers.id]
	}),
}));

export const pageViewsRelations = relations(pageViews, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [pageViews.userId],
		references: [adminUsers.id]
	}),
}));