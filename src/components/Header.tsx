import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { Gift, LogOut, Settings, Ticket, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { getSessionData, logout } from "@/data/auth/session";
import type { SessionData } from "@/lib/session";

export default function Header() {
	const router = useRouter();
	const location = useLocation();
	const [session, setSession] = useState<SessionData | null>(null);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	useEffect(() => {
		if (location.pathname) {
			getSessionData().then(setSession);
		}
	}, [location.pathname]);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await logout();
			router.navigate({ to: "/login" });
		} catch (err) {
			console.error(err);
		}
		setIsLoggingOut(false);
	};

	const isAdmin = session?.role === "admin" || session?.role === "superuser";

	return (
		<header className="border-b bg-white px-6 py-4">
			<div className="flex items-center justify-between">
				<Link to="/" className="text-xl font-semibold text-gray-900">
					Loreto Card
				</Link>

				{session && (
					<div className="flex items-center gap-3">
						<Link to="/vouchers">
							<Button variant="ghost" size="sm" className="gap-2">
								<Ticket className="h-4 w-4" />
								<span className="hidden sm:inline">Vouchers</span>
							</Button>
						</Link>

						<Link to="/benefits">
							<Button variant="ghost" size="sm" className="gap-2">
								<Gift className="h-4 w-4" />
								<span className="hidden sm:inline">Benefits</span>
							</Button>
						</Link>

						{isAdmin && (
							<Link to="/users">
								<Button variant="ghost" size="sm" className="gap-2">
									<Settings className="h-4 w-4" />
									<span className="hidden sm:inline">Users</span>
								</Button>
							</Link>
						)}

						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm" className="gap-2">
									<User className="h-4 w-4" />
									<span className="hidden sm:inline">
										{session.firstName} {session.lastName}
									</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-56">
								<div className="space-y-3">
									<div>
										<p className="font-medium">
											{session.firstName} {session.lastName}
										</p>
										<p className="text-sm text-muted-foreground">
											{session.phoneNumber}
										</p>
										<p className="text-xs text-muted-foreground capitalize">
											{session.role}
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										className="w-full gap-2"
										onClick={handleLogout}
										disabled={isLoggingOut}
									>
										<LogOut className="h-4 w-4" />
										{isLoggingOut ? "Signing out..." : "Sign out"}
									</Button>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				)}
			</div>
		</header>
	);
}
