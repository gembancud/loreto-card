import { Link, useLocation } from "@tanstack/react-router";
import { Gift, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getSessionData } from "@/data/auth/session";
import type { SessionData } from "@/lib/session";

export default function BottomNav() {
	const location = useLocation();
	const [session, setSession] = useState<SessionData | null>(null);

	useEffect(() => {
		if (location.pathname) {
			getSessionData().then(setSession);
		}
	}, [location.pathname]);

	const isActive = (path: string) => {
		if (path === "/") {
			return (
				location.pathname === "/" || location.pathname.startsWith("/people")
			);
		}
		return location.pathname.startsWith(path);
	};

	// Don't render if not logged in
	if (!session) {
		return null;
	}

	const isBarangay =
		session.role === "barangay_admin" || session.role === "barangay_user";

	const navItems = isBarangay
		? ([{ to: "/", icon: Users, label: "People", path: "/" }] as const)
		: ([
				{ to: "/", icon: Users, label: "People", path: "/" },
				{
					to: "/vouchers",
					icon: Ticket,
					label: "Vouchers",
					path: "/vouchers",
				},
				{
					to: "/benefits",
					icon: Gift,
					label: "Benefits",
					path: "/benefits",
				},
			] as const);

	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white pb-safe">
			<div className="flex justify-around py-2">
				{navItems.map((item) => {
					const Icon = item.icon;
					const active = isActive(item.path);
					return (
						<Link
							key={item.path}
							to={item.to}
							className={`flex flex-col items-center gap-1 px-4 py-1 rounded-md transition-colors ${
								active
									? "text-gray-900 bg-muted"
									: "text-gray-500 hover:text-gray-900"
							}`}
						>
							<Icon className="h-5 w-5" />
							<span className="text-xs font-medium">{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
