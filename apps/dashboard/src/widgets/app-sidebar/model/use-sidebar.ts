import { useMemo } from "react";
import { NAV_ITEMS, NAV_SECONDARY } from "@/entities/navigation/config/menu";
import { authClient } from "@/lib/auth-client";

const getFilteredMenu = (items: typeof NAV_ITEMS, user: any) => {
	if (!user) return [];

	return items.filter((item) => {
		if (!item.permission) return true;

		return authClient.admin.checkRolePermission({
			role: (user.role as "user" | "admin" | "superadmin") || "user",
			permissions: item.permission,
		});
	});
};

export const useSidebarNav = () => {
	const { data: session, isPending } = authClient.useSession();
	const user = session?.user;

	const filteredNav = useMemo(() => getFilteredMenu(NAV_ITEMS, user), [user]);

	const filteredSecondary = useMemo(
		() => getFilteredMenu(NAV_SECONDARY, user),
		[user],
	);

	return {
		user,
		navItems: filteredNav,
		secondaryItems: filteredSecondary,
		isLoading: isPending,
	};
};
