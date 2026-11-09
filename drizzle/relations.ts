import { relations } from "drizzle-orm/relations";
import { posts, postComments, adminUsers, adminRoles, notifications, userPermissions, permissions } from "./schema";

export const postCommentsRelations = relations(postComments, ({one}) => ({
	post: one(posts, {
		fields: [postComments.postId],
		references: [posts.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	postComments: many(postComments),
	adminUser: one(adminUsers, {
		fields: [posts.authorId],
		references: [adminUsers.id]
	}),
}));

export const adminUsersRelations = relations(adminUsers, ({one, many}) => ({
	posts: many(posts),
	adminRole: one(adminRoles, {
		fields: [adminUsers.roleId],
		references: [adminRoles.id]
	}),
	notifications: many(notifications),
	userPermissions: many(userPermissions),
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