import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/data/auth/session";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async () => {
		const user = await getCurrentUser();
		if (!user) {
			throw redirect({ to: "/login" });
		}
		return { user };
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	return <Outlet />;
}
