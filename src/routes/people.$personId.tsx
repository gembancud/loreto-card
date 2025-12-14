import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { getPersonById, updatePerson, type PersonStatus } from "@/data/people";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ProfilePhotoUpload } from "@/components/people/ProfilePhotoUpload";
import { LORETO_BARANGAYS, type LoretoBarangay } from "@/data/barangays";
import { ArrowLeft, Save } from "lucide-react";

export const Route = createFileRoute("/people/$personId")({
	component: EditPerson,
	loader: async ({ params }) => await getPersonById({ data: params.personId }),
});

interface EditPersonFormData {
	firstName: string;
	lastName: string;
	birthdate: string;
	street: string;
	barangay: LoretoBarangay;
	phoneNumber: string;
	status: PersonStatus;
	profilePhoto: string | null;
}

function EditPerson() {
	const person = Route.useLoaderData();
	const router = useRouter();
	const id = useId();

	const [formData, setFormData] = useState<EditPersonFormData>({
		firstName: "",
		lastName: "",
		birthdate: "",
		street: "",
		barangay: "Poblacion",
		phoneNumber: "",
		status: "pending",
		profilePhoto: null,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Pre-populate form with person data
	useEffect(() => {
		setFormData({
			firstName: person.firstName,
			lastName: person.lastName,
			birthdate: person.birthdate,
			street: person.address.street,
			barangay: person.address.barangay,
			phoneNumber: person.phoneNumber,
			status: person.status,
			profilePhoto: person.profilePhoto ?? null,
		});
	}, [person]);

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			await updatePerson({
				data: {
					personId: person.id,
					updates: {
						firstName: formData.firstName,
						lastName: formData.lastName,
						birthdate: formData.birthdate,
						address: {
							street: formData.street,
							barangay: formData.barangay,
						},
						phoneNumber: formData.phoneNumber,
						status: formData.status,
						profilePhoto: formData.profilePhoto ?? undefined,
					},
				},
			});
			router.navigate({ to: "/" });
		} catch (error) {
			console.error("Failed to update person:", error);
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		router.navigate({ to: "/" });
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-2xl mx-auto">
				<div className="mb-6">
					<Link to="/">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back to People
						</Button>
					</Link>
				</div>

				<Card>
					<CardContent className="pt-6">
						<form onSubmit={handleSubmit}>
							<div className="grid gap-6">
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

								{/* Actions */}
								<div className="flex justify-end gap-3 pt-4 border-t">
									<Button
										type="button"
										variant="outline"
										onClick={handleCancel}
										disabled={isSubmitting}
									>
										Cancel
									</Button>
									<Button type="submit" disabled={isSubmitting} className="gap-2">
										<Save className="h-4 w-4" />
										{isSubmitting ? "Saving..." : "Save Changes"}
									</Button>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
