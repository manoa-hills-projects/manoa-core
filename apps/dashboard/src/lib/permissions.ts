import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
	...defaultStatements,
	project: ["create", "update", "delete", "vote", "read"],
	document: ["create", "read", "delete"],
	census: ["create", "read", "update", "delete"],
	houses: ["read"],
	families: ["read"],
	citizens: ["read"],
	requests: ["create", "read", "approve", "reject", "download"],
	laws: ["read", "sync"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
	project: ["read", "vote"],
	document: ["read"],
	houses: ["read"],
	families: ["read"],
	citizens: ["read"],
	requests: ["create", "read", "download"],
	laws: ["read"],
});

export const admin = ac.newRole({
	...adminAc.statements,
	project: ["create", "update", "delete", "read", "vote"],
	document: ["create", "read", "delete"],
	census: ["create", "read", "update", "delete"],
	houses: ["read"],
	families: ["read"],
	citizens: ["read"],
	requests: ["create", "read", "approve", "reject", "download"],
	laws: ["read", "sync"],
});

export const superadmin = ac.newRole({
	...adminAc.statements,
	user: ["impersonate", ...(adminAc.statements.user || [])],
	project: ["create", "update", "delete", "read", "vote"],
	document: ["create", "read", "delete"],
	census: ["create", "read", "update", "delete"],
	houses: ["read"],
	families: ["read"],
	citizens: ["read"],
	requests: ["create", "read", "approve", "reject", "download"],
	laws: ["read", "sync"],
});
