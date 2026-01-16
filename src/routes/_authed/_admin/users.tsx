import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus, UserCheck, UserX } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/data/auth/session";
import {
	createUser,
	getUsers,
	type UserListItem,
	updateUser,
} from "@/data/auth/users";
import type { UserRole } from "@/db/schema";

export const Route = createFileRoute("/_authed/_admin/users")({
	component: UsersPage,
	loader: async () => {
		const [users, currentUser] = await Promise.all([
			getUsers(),
			getCurrentUser(),
		]);
		return { users, currentUser };
	},
});

function UsersPage() {
	const { users: initialUsers, currentUser } = Route.useLoaderData();
	const [users, setUsers] = useState(initialUsers);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

	const isSuperuser = currentUser?.role === "superuser";

	const handleUserCreated = (newUser: UserListItem) => {
		setUsers((prev) => [...prev, newUser]);
		setIsAddDialogOpen(false);
	};

	const handleUserUpdated = (updatedUser: UserListItem) => {
		setUsers((prev) =>
			prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
		);
		setEditingUser(null);
	};

	const handleToggleActive = async (user: UserListItem) => {
		const result = await updateUser({
			data: {
				userId: user.id,
				updates: { isActive: !user.isActive },
			},
		});
		if (result.success) {
			setUsers((prev) =>
				prev.map((u) =>
					u.id === user.id ? { ...u, isActive: !u.isActive } : u,
				),
			);
		}
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-4xl mx-auto">
				<div className="mb-6 flex items-center justify-between">
					<Link to="/">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
					</Link>

					{isSuperuser && (
						<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
							<DialogTrigger asChild>
								<Button className="gap-2">
									<Plus className="h-4 w-4" />
									Add User
								</Button>
							</DialogTrigger>
							<DialogContent>
								<AddUserForm
									onSuccess={handleUserCreated}
									onCancel={() => setIsAddDialogOpen(false)}
								/>
							</DialogContent>
						</Dialog>
					)}
				</div>

				<Card>
					<CardHeader>
						<CardTitle>User Management</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
									{isSuperuser && <TableHead>Actions</TableHead>}
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={isSuperuser ? 5 : 4}
											className="text-center text-muted-foreground py-8"
										>
											No users found
										</TableCell>
									</TableRow>
								) : (
									users.map((user) => (
										<TableRow key={user.id}>
											<TableCell className="font-medium">
												{user.firstName} {user.lastName}
											</TableCell>
											<TableCell>{user.phoneNumber}</TableCell>
											<TableCell className="capitalize">{user.role}</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
														user.isActive
															? "bg-green-100 text-green-700"
															: "bg-red-100 text-red-700"
													}`}
												>
													{user.isActive ? "Active" : "Inactive"}
												</span>
											</TableCell>
											{isSuperuser && (
												<TableCell>
													<div className="flex gap-2">
														<Dialog
															open={editingUser?.id === user.id}
															onOpenChange={(open) =>
																setEditingUser(open ? user : null)
															}
														>
															<DialogTrigger asChild>
																<Button variant="ghost" size="icon">
																	<Pencil className="h-4 w-4" />
																</Button>
															</DialogTrigger>
															<DialogContent>
																<EditUserForm
																	user={user}
																	onSuccess={handleUserUpdated}
																	onCancel={() => setEditingUser(null)}
																/>
															</DialogContent>
														</Dialog>
														{user.id !== currentUser?.id && (
															<Button
																variant="ghost"
																size="icon"
																onClick={() => handleToggleActive(user)}
																title={
																	user.isActive
																		? "Deactivate user"
																		: "Activate user"
																}
															>
																{user.isActive ? (
																	<UserX className="h-4 w-4 text-red-500" />
																) : (
																	<UserCheck className="h-4 w-4 text-green-500" />
																)}
															</Button>
														)}
													</div>
												</TableCell>
											)}
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

interface AddUserFormProps {
	onSuccess: (user: UserListItem) => void;
	onCancel: () => void;
}

function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
	const id = useId();
	const [phoneNumber, setPhoneNumber] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [role, setRole] = useState<UserRole>("user");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const result = await createUser({
				data: { phoneNumber, firstName, lastName, role },
			});
			if (result.success && result.user) {
				onSuccess(result.user);
			} else {
				setError(result.error ?? "Failed to create user");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<DialogHeader>
				<DialogTitle>Add New User</DialogTitle>
				<DialogDescription>
					Create a new user account. They will be able to sign in using their
					phone number.
				</DialogDescription>
			</DialogHeader>
			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor={`${id}-phone`}>Phone Number</Label>
					<Input
						id={`${id}-phone`}
						type="tel"
						placeholder="09171234567"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value)}
						required
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label htmlFor={`${id}-firstName`}>First Name</Label>
						<Input
							id={`${id}-firstName`}
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`${id}-lastName`}>Last Name</Label>
						<Input
							id={`${id}-lastName`}
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							required
						/>
					</div>
				</div>
				<div className="grid gap-2">
					<Label htmlFor={`${id}-role`}>Role</Label>
					<Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="user">User</SelectItem>
							<SelectItem value="admin">Admin</SelectItem>
							<SelectItem value="superuser">Superuser</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{error && <p className="text-sm text-destructive">{error}</p>}
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Creating..." : "Create User"}
				</Button>
			</DialogFooter>
		</form>
	);
}

interface EditUserFormProps {
	user: UserListItem;
	onSuccess: (user: UserListItem) => void;
	onCancel: () => void;
}

function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
	const id = useId();
	const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
	const [firstName, setFirstName] = useState(user.firstName);
	const [lastName, setLastName] = useState(user.lastName);
	const [role, setRole] = useState<UserRole>(user.role);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const result = await updateUser({
				data: {
					userId: user.id,
					updates: { phoneNumber, firstName, lastName, role },
				},
			});
			if (result.success) {
				onSuccess({
					...user,
					phoneNumber,
					firstName,
					lastName,
					role,
				});
			} else {
				setError(result.error ?? "Failed to update user");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<DialogHeader>
				<DialogTitle>Edit User</DialogTitle>
				<DialogDescription>Update user information.</DialogDescription>
			</DialogHeader>
			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor={`${id}-phone`}>Phone Number</Label>
					<Input
						id={`${id}-phone`}
						type="tel"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value)}
						required
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label htmlFor={`${id}-firstName`}>First Name</Label>
						<Input
							id={`${id}-firstName`}
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`${id}-lastName`}>Last Name</Label>
						<Input
							id={`${id}-lastName`}
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							required
						/>
					</div>
				</div>
				<div className="grid gap-2">
					<Label htmlFor={`${id}-role`}>Role</Label>
					<Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="user">User</SelectItem>
							<SelectItem value="admin">Admin</SelectItem>
							<SelectItem value="superuser">Superuser</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{error && <p className="text-sm text-destructive">{error}</p>}
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : "Save Changes"}
				</Button>
			</DialogFooter>
		</form>
	);
}
