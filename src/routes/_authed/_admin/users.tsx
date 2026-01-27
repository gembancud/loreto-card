import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Pencil, Plus } from "lucide-react";
import { useId, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
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
import {
	type DepartmentListItem,
	getActiveDepartments,
} from "@/data/departments";
import type { UserRole } from "@/db/schema";

export const Route = createFileRoute("/_authed/_admin/users")({
	component: UsersPage,
	loader: async () => {
		const [users, currentUser, departments] = await Promise.all([
			getUsers(),
			getCurrentUser(),
			getActiveDepartments(),
		]);
		return { users, currentUser, departments };
	},
});

function UsersPage() {
	const {
		users: initialUsers,
		currentUser,
		departments,
	} = Route.useLoaderData();
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
									departments={departments}
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
						{/* Mobile card view */}
						<div className="md:hidden space-y-3">
							{users.length === 0 ? (
								<p className="text-center text-muted-foreground py-8">
									No users found
								</p>
							) : (
								users.map((user) => (
									<div
										key={user.id}
										className="rounded-lg border bg-card p-4 space-y-2"
									>
										{/* Header: Name + Status */}
										<div className="flex items-start justify-between gap-2">
											<span className="font-medium">
												{user.firstName} {user.lastName}
											</span>
											<span
												className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
													user.isActive
														? "bg-green-100 text-green-700"
														: "bg-red-100 text-red-700"
												}`}
											>
												{user.isActive ? "Active" : "Inactive"}
											</span>
										</div>

										{/* Phone */}
										<div className="text-sm text-muted-foreground">
											{user.phoneNumber}
										</div>

										{/* Email */}
										{user.email && (
											<div className="text-sm text-muted-foreground flex items-center gap-1">
												<Mail className="h-3 w-3" />
												{user.email}
											</div>
										)}

										{/* Department */}
										{user.departmentName && (
											<div className="text-sm text-muted-foreground">
												{user.departmentName}
											</div>
										)}

										{/* Role */}
										<div className="text-sm">
											Role: <span className="capitalize">{user.role}</span>
										</div>

										{/* Actions (superuser only) */}
										{isSuperuser && (
											<div className="pt-2 border-t flex items-center justify-between">
												<Dialog
													open={editingUser?.id === user.id}
													onOpenChange={(open) =>
														setEditingUser(open ? user : null)
													}
												>
													<DialogTrigger asChild>
														<Button variant="ghost" size="sm">
															<Pencil className="h-4 w-4 mr-2" />
															Edit
														</Button>
													</DialogTrigger>
													<DialogContent>
														<EditUserForm
															user={user}
															departments={departments}
															onSuccess={handleUserUpdated}
															onCancel={() => setEditingUser(null)}
														/>
													</DialogContent>
												</Dialog>
												{user.id !== currentUser?.id && (
													<Switch
														checked={user.isActive}
														onCheckedChange={() => handleToggleActive(user)}
														aria-label={
															user.isActive
																? "Deactivate user"
																: "Activate user"
														}
													/>
												)}
											</div>
										)}
									</div>
								))
							)}
						</div>

						{/* Desktop table view */}
						<div className="hidden md:block overflow-auto rounded-md border">
							<Table className="table-fixed">
								<TableHeader>
									<TableRow>
										<TableHead className="w-[20%]">Name</TableHead>
										<TableHead className="w-[120px]">Phone</TableHead>
										<TableHead className="w-[20%]">Email</TableHead>
										<TableHead className="w-[20%]">Department</TableHead>
										<TableHead className="w-[100px]">Role</TableHead>
										<TableHead className="w-[80px]">Status</TableHead>
										{isSuperuser && (
											<TableHead className="w-[100px]">Actions</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={isSuperuser ? 7 : 6}
												className="text-center text-muted-foreground py-8"
											>
												No users found
											</TableCell>
										</TableRow>
									) : (
										users.map((user) => (
											<TableRow key={user.id}>
												<TableCell className="font-medium truncate">
													{user.firstName} {user.lastName}
												</TableCell>
												<TableCell>{user.phoneNumber}</TableCell>
												<TableCell className="text-muted-foreground truncate">
													{user.email ?? "—"}
												</TableCell>
												<TableCell className="text-muted-foreground truncate">
													{user.departmentName ?? "—"}
												</TableCell>
												<TableCell className="capitalize">
													{user.role}
												</TableCell>
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
														<div className="flex items-center gap-2">
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
																		departments={departments}
																		onSuccess={handleUserUpdated}
																		onCancel={() => setEditingUser(null)}
																	/>
																</DialogContent>
															</Dialog>
															{user.id !== currentUser?.id && (
																<Switch
																	checked={user.isActive}
																	onCheckedChange={() =>
																		handleToggleActive(user)
																	}
																	aria-label={
																		user.isActive
																			? "Deactivate user"
																			: "Activate user"
																	}
																/>
															)}
														</div>
													</TableCell>
												)}
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

interface AddUserFormProps {
	departments: DepartmentListItem[];
	onSuccess: (user: UserListItem) => void;
	onCancel: () => void;
}

function AddUserForm({ departments, onSuccess, onCancel }: AddUserFormProps) {
	const id = useId();
	const [phoneNumber, setPhoneNumber] = useState("");
	const [email, setEmail] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [role, setRole] = useState<UserRole>("user");
	const [departmentId, setDepartmentId] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isDirty = useMemo(() => {
		return (
			phoneNumber !== "" ||
			email !== "" ||
			firstName !== "" ||
			lastName !== "" ||
			role !== "user" ||
			departmentId !== ""
		);
	}, [phoneNumber, email, firstName, lastName, role, departmentId]);

	const handleCancel = () => {
		if (isDirty) {
			if (
				!confirm("You have unsaved changes. Are you sure you want to close?")
			) {
				return;
			}
		}
		onCancel();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const result = await createUser({
				data: {
					phoneNumber,
					email: email || undefined,
					firstName,
					lastName,
					role,
					departmentId: departmentId || undefined,
				},
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
				<div className="grid gap-2">
					<Label htmlFor={`${id}-email`}>Email (Optional)</Label>
					<Input
						id={`${id}-email`}
						type="email"
						placeholder="user@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
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
					<Label htmlFor={`${id}-department`}>Department</Label>
					<Select value={departmentId} onValueChange={setDepartmentId}>
						<SelectTrigger>
							<SelectValue placeholder="Select department" />
						</SelectTrigger>
						<SelectContent>
							{departments.map((dept) => (
								<SelectItem key={dept.id} value={dept.id}>
									{dept.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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
				<Button type="button" variant="outline" onClick={handleCancel}>
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
	departments: DepartmentListItem[];
	onSuccess: (user: UserListItem) => void;
	onCancel: () => void;
}

function EditUserForm({
	user,
	departments,
	onSuccess,
	onCancel,
}: EditUserFormProps) {
	const id = useId();
	const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
	const [email, setEmail] = useState(user.email ?? "");
	const [firstName, setFirstName] = useState(user.firstName);
	const [lastName, setLastName] = useState(user.lastName);
	const [role, setRole] = useState<UserRole>(user.role);
	const [departmentId, setDepartmentId] = useState<string>(
		user.departmentId ?? "",
	);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const initialValues = useMemo(
		() => ({
			phoneNumber: user.phoneNumber,
			email: user.email ?? "",
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
			departmentId: user.departmentId ?? "",
		}),
		[user],
	);

	const isDirty = useMemo(() => {
		return (
			phoneNumber !== initialValues.phoneNumber ||
			email !== initialValues.email ||
			firstName !== initialValues.firstName ||
			lastName !== initialValues.lastName ||
			role !== initialValues.role ||
			departmentId !== initialValues.departmentId
		);
	}, [
		phoneNumber,
		email,
		firstName,
		lastName,
		role,
		departmentId,
		initialValues,
	]);

	const handleCancel = () => {
		if (isDirty) {
			if (
				!confirm("You have unsaved changes. Are you sure you want to close?")
			) {
				return;
			}
		}
		onCancel();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const result = await updateUser({
				data: {
					userId: user.id,
					updates: {
						phoneNumber,
						email: email || null,
						firstName,
						lastName,
						role,
						departmentId: departmentId || null,
					},
				},
			});
			if (result.success) {
				const selectedDept = departments.find((d) => d.id === departmentId);
				onSuccess({
					...user,
					phoneNumber,
					email: email || null,
					firstName,
					lastName,
					role,
					departmentId: departmentId || null,
					departmentName: selectedDept?.name ?? null,
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
				<div className="grid gap-2">
					<Label htmlFor={`${id}-email`}>Email (Optional)</Label>
					<Input
						id={`${id}-email`}
						type="email"
						placeholder="user@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
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
					<Label htmlFor={`${id}-department`}>Department</Label>
					<Select value={departmentId} onValueChange={setDepartmentId}>
						<SelectTrigger>
							<SelectValue placeholder="Select department" />
						</SelectTrigger>
						<SelectContent>
							{departments.map((dept) => (
								<SelectItem key={dept.id} value={dept.id}>
									{dept.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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
				<Button type="button" variant="outline" onClick={handleCancel}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : "Save Changes"}
				</Button>
			</DialogFooter>
		</form>
	);
}
