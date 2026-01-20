import { useRouter } from "@tanstack/react-router";
import { Loader2, UserPlus } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
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
import { LORETO_BARANGAYS, type LoretoBarangay } from "@/data/barangays";
import type { PersonStatus } from "@/data/people";
import { createPerson } from "@/data/people";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

interface AddPersonFormData {
	firstName: string;
	lastName: string;
	birthdate: string;
	street: string;
	purok: string;
	barangay: LoretoBarangay | "";
	phoneNumber: string;
	status: PersonStatus;
	profilePhoto: string | null;
}

const initialFormData: AddPersonFormData = {
	firstName: "",
	lastName: "",
	birthdate: "",
	street: "",
	purok: "",
	barangay: "",
	phoneNumber: "",
	status: "pending",
	profilePhoto: null,
};

export function AddPersonDialog() {
	const id = useId();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [formData, setFormData] = useState<AddPersonFormData>(initialFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const firstNameId = `${id}-firstName`;
	const lastNameId = `${id}-lastName`;
	const birthdateId = `${id}-birthdate`;
	const phoneNumberId = `${id}-phoneNumber`;
	const streetId = `${id}-street`;
	const purokId = `${id}-purok`;
	const barangayId = `${id}-barangay`;
	const statusId = `${id}-status`;

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleStatusChange = (value: PersonStatus) => {
		setFormData((prev) => ({ ...prev, status: value }));
	};

	const handleBarangayChange = (value: LoretoBarangay) => {
		setFormData((prev) => ({ ...prev, barangay: value }));
	};

	const handlePhotoChange = (dataUrl: string | null) => {
		setFormData((prev) => ({ ...prev, profilePhoto: dataUrl }));
	};

	const resetForm = () => {
		setFormData(initialFormData);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const missingFields: string[] = [];
		if (!formData.firstName) missingFields.push("First Name");
		if (!formData.lastName) missingFields.push("Last Name");
		if (!formData.birthdate) missingFields.push("Birthdate");
		if (!formData.barangay) missingFields.push("Barangay");

		if (missingFields.length > 0) {
			toast.error(`Missing required fields: ${missingFields.join(", ")}`);
			return;
		}

		setIsSubmitting(true);
		try {
			await createPerson({
				data: {
					firstName: formData.firstName,
					lastName: formData.lastName,
					birthdate: formData.birthdate,
					address: {
						street: formData.street,
						purok: formData.purok || undefined,
						barangay: formData.barangay as LoretoBarangay,
					},
					phoneNumber: formData.phoneNumber,
					status: formData.status,
					profilePhoto: formData.profilePhoto || undefined,
				},
			});

			toast.success(
				`${formData.firstName} ${formData.lastName} added successfully`,
			);
			await router.invalidate();
			resetForm();
			setOpen(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to add person");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		resetForm();
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<UserPlus className="h-4 w-4" />
					Add Person
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Add New Person</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						{/* Row 1: Photo + First Name and Last Name */}
						<div className="flex gap-4">
							<ProfilePhotoUpload
								value={formData.profilePhoto}
								onChange={handlePhotoChange}
							/>
							<div className="flex-1 grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor={firstNameId}>
										First Name <span className="text-destructive">*</span>
									</Label>
									<Input
										id={firstNameId}
										name="firstName"
										value={formData.firstName}
										onChange={handleInputChange}
										placeholder="Enter first name"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={lastNameId}>
										Last Name <span className="text-destructive">*</span>
									</Label>
									<Input
										id={lastNameId}
										name="lastName"
										value={formData.lastName}
										onChange={handleInputChange}
										placeholder="Enter last name"
									/>
								</div>
							</div>
						</div>

						{/* Row 2: Birthdate and Barangay (required fields) */}
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor={birthdateId}>
									Birthdate <span className="text-destructive">*</span>
								</Label>
								<Input
									id={birthdateId}
									name="birthdate"
									type="date"
									value={formData.birthdate}
									onChange={handleInputChange}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor={barangayId}>
									Barangay <span className="text-destructive">*</span>
								</Label>
								<Select
									value={formData.barangay}
									onValueChange={handleBarangayChange}
								>
									<SelectTrigger id={barangayId} className="w-full">
										<SelectValue placeholder="Select barangay" />
									</SelectTrigger>
									<SelectContent>
										{LORETO_BARANGAYS.map((barangay) => (
											<SelectItem key={barangay} value={barangay}>
												{barangay}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Row 3: Street, Purok, and Phone Number (optional fields) */}
						<div className="grid grid-cols-5 gap-4">
							<div className="col-span-2 grid gap-2">
								<Label htmlFor={streetId}>Street</Label>
								<Input
									id={streetId}
									name="street"
									value={formData.street}
									onChange={handleInputChange}
									placeholder="Enter street address"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor={purokId}>Purok</Label>
								<Input
									id={purokId}
									name="purok"
									value={formData.purok}
									onChange={handleInputChange}
									placeholder="#"
								/>
							</div>
							<div className="col-span-2 grid gap-2">
								<Label htmlFor={phoneNumberId}>Phone</Label>
								<Input
									id={phoneNumberId}
									name="phoneNumber"
									value={formData.phoneNumber}
									onChange={handleInputChange}
									placeholder="Phone number"
								/>
							</div>
						</div>

						{/* Row 4: Status */}
						<div className="grid gap-2">
							<Label htmlFor={statusId}>Status</Label>
							<Select
								value={formData.status}
								onValueChange={handleStatusChange}
							>
								<SelectTrigger id={statusId} className="w-full">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Adding...
								</>
							) : (
								"Add Person"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
