import { useId, useState } from "react";
import { UserPlus } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
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
import { Button } from "@/components/ui/button";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import type { PersonStatus } from "@/data/people";
import { LORETO_BARANGAYS, type LoretoBarangay } from "@/data/barangays";

interface AddPersonFormData {
	firstName: string;
	lastName: string;
	birthdate: string;
	street: string;
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
	barangay: "",
	phoneNumber: "",
	status: "pending",
	profilePhoto: null,
};

export function AddPersonDialog() {
	const id = useId();
	const [open, setOpen] = useState(false);
	const [formData, setFormData] = useState<AddPersonFormData>(initialFormData);

	const firstNameId = `${id}-firstName`;
	const lastNameId = `${id}-lastName`;
	const birthdateId = `${id}-birthdate`;
	const phoneNumberId = `${id}-phoneNumber`;
	const streetId = `${id}-street`;
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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Form submitted:", formData);
		resetForm();
		setOpen(false);
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
									<Label htmlFor={firstNameId}>First Name</Label>
									<Input
										id={firstNameId}
										name="firstName"
										value={formData.firstName}
										onChange={handleInputChange}
										placeholder="Enter first name"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={lastNameId}>Last Name</Label>
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

						{/* Row 2: Birthdate and Phone Number */}
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor={birthdateId}>Birthdate</Label>
								<Input
									id={birthdateId}
									name="birthdate"
									type="date"
									value={formData.birthdate}
									onChange={handleInputChange}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor={phoneNumberId}>Phone Number</Label>
								<Input
									id={phoneNumberId}
									name="phoneNumber"
									value={formData.phoneNumber}
									onChange={handleInputChange}
									placeholder="Enter phone number"
								/>
							</div>
						</div>

						{/* Row 3: Street and Barangay */}
						<div className="grid grid-cols-3 gap-4">
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
								<Label htmlFor={barangayId}>Barangay</Label>
								<Select
									value={formData.barangay}
									onValueChange={handleBarangayChange}
								>
									<SelectTrigger id={barangayId} className="w-full">
										<SelectValue placeholder="Select" />
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
						<Button type="button" variant="outline" onClick={handleCancel}>
							Cancel
						</Button>
						<Button type="submit">Add Person</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
