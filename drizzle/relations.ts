import { relations } from "drizzle-orm/relations";
import { boards, dateSheets, institutes, adminUsers, blogPosts, programs, categories, careerPaths, cities, admissions, adminRoles, news, programComparisons, programCurriculum, programFaqs, programPrerequisites, notifications, programOfferings, degrees, pageViews, programReviews, scholarships, sessions, programSkills, results, admissionOfferings, levels, resultOfferings, userPermissions, permissions } from "./schema";

export const dateSheetsRelations = relations(dateSheets, ({one}) => ({
	board: one(boards, {
		fields: [dateSheets.boardId],
		references: [boards.id]
	}),
	institute: one(institutes, {
		fields: [dateSheets.instituteId],
		references: [institutes.id]
	}),
}));

export const boardsRelations = relations(boards, ({one, many}) => ({
	dateSheets: many(dateSheets),
	city: one(cities, {
		fields: [boards.cityId],
		references: [cities.id]
	}),
	news: many(news),
	results: many(results),
}));

export const institutesRelations = relations(institutes, ({one, many}) => ({
	dateSheets: many(dateSheets),
	admissions: many(admissions),
	news: many(news),
	city: one(cities, {
		fields: [institutes.cityId],
		references: [cities.id]
	}),
	programOfferings: many(programOfferings),
	scholarships: many(scholarships),
	results: many(results),
}));

export const blogPostsRelations = relations(blogPosts, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [blogPosts.authorId],
		references: [adminUsers.id]
	}),
	program: one(programs, {
		fields: [blogPosts.programId],
		references: [programs.id]
	}),
	category: one(categories, {
		fields: [blogPosts.categoryId],
		references: [categories.id]
	}),
}));

export const adminUsersRelations = relations(adminUsers, ({one, many}) => ({
	blogPosts: many(blogPosts),
	adminRole: one(adminRoles, {
		fields: [adminUsers.roleId],
		references: [adminRoles.id]
	}),
	notifications: many(notifications),
	pageViews: many(pageViews),
	sessions: many(sessions),
	userPermissions: many(userPermissions),
}));

export const programsRelations = relations(programs, ({one, many}) => ({
	blogPosts: many(blogPosts),
	careerPaths: many(careerPaths),
	news: many(news),
	programComparisons_program1Id: many(programComparisons, {
		relationName: "programComparisons_program1Id_programs_id"
	}),
	programComparisons_program2Id: many(programComparisons, {
		relationName: "programComparisons_program2Id_programs_id"
	}),
	programCurricula: many(programCurriculum),
	programFaqs: many(programFaqs),
	programPrerequisites: many(programPrerequisites),
	programOfferings: many(programOfferings),
	programSkills: many(programSkills),
	category: one(categories, {
		fields: [programs.categoryId],
		references: [categories.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	blogPosts: many(blogPosts),
	programs: many(programs),
}));

export const careerPathsRelations = relations(careerPaths, ({one}) => ({
	program: one(programs, {
		fields: [careerPaths.programId],
		references: [programs.id]
	}),
}));

export const citiesRelations = relations(cities, ({many}) => ({
	boards: many(boards),
	news: many(news),
	institutes: many(institutes),
}));

export const admissionsRelations = relations(admissions, ({one, many}) => ({
	institute: one(institutes, {
		fields: [admissions.instituteId],
		references: [institutes.id]
	}),
	admissionOfferings: many(admissionOfferings),
}));

export const adminRolesRelations = relations(adminRoles, ({many}) => ({
	adminUsers: many(adminUsers),
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

export const programComparisonsRelations = relations(programComparisons, ({one}) => ({
	program_program1Id: one(programs, {
		fields: [programComparisons.program1Id],
		references: [programs.id],
		relationName: "programComparisons_program1Id_programs_id"
	}),
	program_program2Id: one(programs, {
		fields: [programComparisons.program2Id],
		references: [programs.id],
		relationName: "programComparisons_program2Id_programs_id"
	}),
}));

export const programCurriculumRelations = relations(programCurriculum, ({one}) => ({
	program: one(programs, {
		fields: [programCurriculum.programId],
		references: [programs.id]
	}),
}));

export const programFaqsRelations = relations(programFaqs, ({one}) => ({
	program: one(programs, {
		fields: [programFaqs.programId],
		references: [programs.id]
	}),
}));

export const programPrerequisitesRelations = relations(programPrerequisites, ({one}) => ({
	program: one(programs, {
		fields: [programPrerequisites.programId],
		references: [programs.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [notifications.userId],
		references: [adminUsers.id]
	}),
}));

export const programOfferingsRelations = relations(programOfferings, ({one, many}) => ({
	program: one(programs, {
		fields: [programOfferings.programId],
		references: [programs.id]
	}),
	degree: one(degrees, {
		fields: [programOfferings.degreeId],
		references: [degrees.id]
	}),
	institute: one(institutes, {
		fields: [programOfferings.instituteId],
		references: [institutes.id]
	}),
	programReviews: many(programReviews),
	admissionOfferings: many(admissionOfferings),
	resultOfferings: many(resultOfferings),
}));

export const degreesRelations = relations(degrees, ({one, many}) => ({
	programOfferings: many(programOfferings),
	level: one(levels, {
		fields: [degrees.levelId],
		references: [levels.id]
	}),
}));

export const pageViewsRelations = relations(pageViews, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [pageViews.userId],
		references: [adminUsers.id]
	}),
}));

export const programReviewsRelations = relations(programReviews, ({one}) => ({
	programOffering: one(programOfferings, {
		fields: [programReviews.offeringId],
		references: [programOfferings.id]
	}),
}));

export const scholarshipsRelations = relations(scholarships, ({one}) => ({
	institute: one(institutes, {
		fields: [scholarships.instituteId],
		references: [institutes.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [sessions.userId],
		references: [adminUsers.id]
	}),
}));

export const programSkillsRelations = relations(programSkills, ({one}) => ({
	program: one(programs, {
		fields: [programSkills.programId],
		references: [programs.id]
	}),
}));

export const resultsRelations = relations(results, ({one, many}) => ({
	institute: one(institutes, {
		fields: [results.instituteId],
		references: [institutes.id]
	}),
	board: one(boards, {
		fields: [results.boardId],
		references: [boards.id]
	}),
	resultOfferings: many(resultOfferings),
}));

export const admissionOfferingsRelations = relations(admissionOfferings, ({one}) => ({
	admission: one(admissions, {
		fields: [admissionOfferings.admissionId],
		references: [admissions.id]
	}),
	programOffering: one(programOfferings, {
		fields: [admissionOfferings.offeringId],
		references: [programOfferings.id]
	}),
}));

export const levelsRelations = relations(levels, ({many}) => ({
	degrees: many(degrees),
}));

export const resultOfferingsRelations = relations(resultOfferings, ({one}) => ({
	result: one(results, {
		fields: [resultOfferings.resultId],
		references: [results.id]
	}),
	programOffering: one(programOfferings, {
		fields: [resultOfferings.offeringId],
		references: [programOfferings.id]
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