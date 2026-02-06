import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/data/auth/session";

export const Route = createFileRoute("/_authed/_admin")({
	beforeLoad: async () => {
		const user = await getCurrentUser();
		if (!user) {
			throw redirect({ to: "/login" });
		}
		if (
			user.role !== "department_admin" &&
			user.role !== "superuser" &&
			user.role !== "barangay_admin"
		) {
			throw redirect({ to: "/" });
		}
		return { user };
	},
	component: AdminLayout,
});

function AdminLayout() {
	return <Outlet />;
}
