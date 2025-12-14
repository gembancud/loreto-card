import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import {
	getPersonById,
	updatePerson,
	type PersonStatus,
	type GovServiceRecord,
} from "@/data/people";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
	middleName: string;
	lastName: string;
	suffix: string;
	birthdate: string;
	street: string;
	barangay: LoretoBarangay;
	phoneNumber: string;
	status: PersonStatus;
	profilePhoto: string | null;
	// Government services
	voter: GovServiceRecord;
	philhealth: GovServiceRecord;
	sss: GovServiceRecord;
	fourPs: GovServiceRecord;
	pwd: GovServiceRecord;
	soloParent: GovServiceRecord;
	pagibig: GovServiceRecord;
	tin: GovServiceRecord;
	barangayClearance: GovServiceRecord;
}

function EditPerson() {
	const person = Route.useLoaderData();
	const router = useRouter();
	const id = useId();

	const [formData, setFormData] = useState<EditPersonFormData>({
		firstName: "",
		middleName: "",
		lastName: "",
		suffix: "",
		birthdate: "",
		street: "",
		barangay: "Poblacion",
		phoneNumber: "",
		status: "pending",
		profilePhoto: null,
		voter: { registered: false },
		philhealth: { registered: false },
		sss: { registered: false },
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: { registered: false },
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Pre-populate form with person data
	useEffect(() => {
		setFormData({
			firstName: person.firstName,
			middleName: person.middleName ?? "",
			lastName: person.lastName,
			suffix: person.suffix ?? "",
			birthdate: person.birthdate,
			street: person.address.street,
			barangay: person.address.barangay,
			phoneNumber: person.phoneNumber,
			status: person.status,
			profilePhoto: person.profilePhoto ?? null,
			voter: person.voter,
			philhealth: person.philhealth,
			sss: person.sss,
			fourPs: person.fourPs,
			pwd: person.pwd,
			soloParent: person.soloParent,
			pagibig: person.pagibig,
			tin: person.tin,
			barangayClearance: person.barangayClearance,
		});
	}, [person]);

	const firstNameId = `${id}-firstName`;
	const middleNameId = `${id}-middleName`;
	const lastNameId = `${id}-lastName`;
	const suffixId = `${id}-suffix`;
	const birthdateId = `${id}-birthdate`;
	const phoneNumberId = `${id}-phoneNumber`;
	const streetId = `${id}-street`;
	const barangayId = `${id}-barangay`;
	const statusId = `${id}-status`;

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleGovServiceChange = (
		serviceName: keyof Pick<
			EditPersonFormData,
			| "voter"
			| "philhealth"
			| "sss"
			| "fourPs"
			| "pwd"
			| "soloParent"
			| "pagibig"
			| "tin"
			| "barangayClearance"
		>,
		field: keyof GovServiceRecord,
		value: boolean | string,
	) => {
		setFormData((prev) => ({
			...prev,
			[serviceName]: {
				...prev[serviceName],
				[field]: value,
			},
		}));
	};

	const handleStatusChange = (value: PersonStatus) => {
		setFormData((prev) => ({ ...prev, status: value }));
	};

	const handleBarangayChange = (value: LoretoBarangay) => {
		setFormData((prev) => ({ ...prev, barangay: value }));
	};

	const handleSuffixChange = (value: string) => {
		setFormData((prev) => ({ ...prev, suffix: value }));
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
						middleName: formData.middleName || undefined,
						lastName: formData.lastName,
						suffix: formData.suffix || undefined,
						birthdate: formData.birthdate,
						address: {
							street: formData.street,
							barangay: formData.barangay,
						},
						phoneNumber: formData.phoneNumber,
						status: formData.status,
						profilePhoto: formData.profilePhoto ?? undefined,
						voter: formData.voter,
						philhealth: formData.philhealth,
						sss: formData.sss,
						fourPs: formData.fourPs,
						pwd: formData.pwd,
						soloParent: formData.soloParent,
						pagibig: formData.pagibig,
						tin: formData.tin,
						barangayClearance: formData.barangayClearance,
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
			<div className="max-w-5xl mx-auto">
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
							<div className="flex flex-col lg:flex-row gap-8">
								{/* Left Column: Personal Info */}
								<div className="w-full lg:w-1/2 flex-shrink-0">
									<div className="grid gap-6">
										{/* Photo + 2x2 Name Grid */}
										<div className="flex gap-4">
											<ProfilePhotoUpload
												value={formData.profilePhoto}
												onChange={handlePhotoChange}
											/>
											<div className="flex-1 grid grid-cols-2 gap-4">
												{/* Row 1: First Name, Middle Name */}
												<div className="grid gap-2">
													<Label htmlFor={firstNameId}>First Name</Label>
													<Input
														id={firstNameId}
														name="firstName"
														value={formData.firstName}
														onChange={handleInputChange}
														placeholder="First name"
													/>
												</div>
												<div className="grid gap-2">
													<Label htmlFor={middleNameId}>Middle Name</Label>
													<Input
														id={middleNameId}
														name="middleName"
														value={formData.middleName}
														onChange={handleInputChange}
														placeholder="Middle (optional)"
													/>
												</div>
												{/* Row 2: Last Name, Suffix */}
												<div className="grid gap-2">
													<Label htmlFor={lastNameId}>Last Name</Label>
													<Input
														id={lastNameId}
														name="lastName"
														value={formData.lastName}
														onChange={handleInputChange}
														placeholder="Last name"
													/>
												</div>
												<div className="grid gap-2">
													<Label htmlFor={suffixId}>Suffix</Label>
													<Select
														value={formData.suffix || "none"}
														onValueChange={(value) =>
															handleSuffixChange(value === "none" ? "" : value)
														}
													>
														<SelectTrigger id={suffixId} className="w-full">
															<SelectValue placeholder="None" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">None</SelectItem>
															<SelectItem value="Jr.">Jr.</SelectItem>
															<SelectItem value="Sr.">Sr.</SelectItem>
															<SelectItem value="II">II</SelectItem>
															<SelectItem value="III">III</SelectItem>
															<SelectItem value="IV">IV</SelectItem>
															<SelectItem value="V">V</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
										</div>

										{/* Birthdate and Phone Number */}
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

										{/* Street and Barangay */}
										<div className="grid grid-cols-2 gap-4">
											<div className="grid gap-2">
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

										{/* Status */}
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
								</div>

								{/* Right Column: Government Services - scrollable on large screens */}
								<div className="w-full lg:w-1/2 mt-6 lg:mt-0 lg:max-h-[600px] lg:overflow-y-auto lg:border-l lg:pl-8">
									<div className="grid gap-6">
									<h3 className="font-semibold text-lg">Government Services</h3>

									{/* Voter Registration */}
									<div className="grid gap-3 p-4 border rounded-lg">
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`${id}-voter`}
												checked={formData.voter.registered}
												onCheckedChange={(checked) =>
													handleGovServiceChange("voter", "registered", !!checked)
												}
											/>
											<Label htmlFor={`${id}-voter`} className="font-medium cursor-pointer">
												Voter Registration
											</Label>
										</div>
										{formData.voter.registered && (
											<div className="grid grid-cols-2 gap-3 pl-6">
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">VIN Number</Label>
													<Input
														value={formData.voter.idNumber ?? ""}
														onChange={(e) =>
															handleGovServiceChange("voter", "idNumber", e.target.value)
														}
														placeholder="1234-5678A-B12CD3E"
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Issue Date</Label>
													<Input
														type="date"
														value={formData.voter.issueDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("voter", "issueDate", e.target.value)
														}
													/>
												</div>
											</div>
										)}
									</div>

									{/* PhilHealth */}
									<div className="grid gap-3 p-4 border rounded-lg">
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`${id}-philhealth`}
												checked={formData.philhealth.registered}
												onCheckedChange={(checked) =>
													handleGovServiceChange("philhealth", "registered", !!checked)
												}
											/>
											<Label htmlFor={`${id}-philhealth`} className="font-medium cursor-pointer">
												PhilHealth Member
											</Label>
										</div>
										{formData.philhealth.registered && (
											<div className="grid grid-cols-2 gap-3 pl-6">
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">PhilHealth PIN</Label>
													<Input
														value={formData.philhealth.idNumber ?? ""}
														onChange={(e) =>
															handleGovServiceChange("philhealth", "idNumber", e.target.value)
														}
														placeholder="01-234567890-1"
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Issue Date</Label>
													<Input
														type="date"
														value={formData.philhealth.issueDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("philhealth", "issueDate", e.target.value)
														}
													/>
												</div>
											</div>
										)}
									</div>

									{/* SSS */}
									<div className="grid gap-3 p-4 border rounded-lg">
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`${id}-sss`}
												checked={formData.sss.registered}
												onCheckedChange={(checked) =>
													handleGovServiceChange("sss", "registered", !!checked)
												}
											/>
											<Label htmlFor={`${id}-sss`} className="font-medium cursor-pointer">
												SSS Member
											</Label>
										</div>
										{formData.sss.registered && (
											<div className="grid grid-cols-2 gap-3 pl-6">
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">SSS Number</Label>
													<Input
														value={formData.sss.idNumber ?? ""}
														onChange={(e) =>
															handleGovServiceChange("sss", "idNumber", e.target.value)
														}
														placeholder="12-3456789-0"
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Issue Date</Label>
													<Input
														type="date"
														value={formData.sss.issueDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("sss", "issueDate", e.target.value)
														}
													/>
												</div>
											</div>
										)}
									</div>

									{/* Pag-IBIG */}
									<div className="grid gap-3 p-4 border rounded-lg">
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`${id}-pagibig`}
												checked={formData.pagibig.registered}
												onCheckedChange={(checked) =>
													handleGovServiceChange("pagibig", "registered", !!checked)
												}
											/>
											<Label htmlFor={`${id}-pagibig`} className="font-medium cursor-pointer">
												Pag-IBIG Member
											</Label>
										</div>
										{formData.pagibig.registered && (
											<div className="grid grid-cols-2 gap-3 pl-6">
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Pag-IBIG MID</Label>
													<Input
														value={formData.pagibig.idNumber ?? ""}
														onChange={(e) =>
															handleGovServiceChange("pagibig", "idNumber", e.target.value)
														}
														placeholder="123456789012"
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Issue Date</Label>
													<Input
														type="date"
														value={formData.pagibig.issueDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("pagibig", "issueDate", e.target.value)
														}
													/>
												</div>
											</div>
										)}
									</div>

									{/* TIN */}
									<div className="grid gap-3 p-4 border rounded-lg">
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`${id}-tin`}
												checked={formData.tin.registered}
												onCheckedChange={(checked) =>
													handleGovServiceChange("tin", "registered", !!checked)
												}
											/>
											<Label htmlFor={`${id}-tin`} className="font-medium cursor-pointer">
												Has TIN
											</Label>
										</div>
										{formData.tin.registered && (
											<div className="grid grid-cols-2 gap-3 pl-6">
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">TIN</Label>
													<Input
														value={formData.tin.idNumber ?? ""}
														onChange={(e) =>
															handleGovServiceChange("tin", "idNumber", e.target.value)
														}
														placeholder="123-456-789"
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Issue Date</Label>
													<Input
														type="date"
														value={formData.tin.issueDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("tin", "issueDate", e.target.value)
														}
													/>
												</div>
											</div>
										)}
									</div>

									{/* 4Ps */}
									<div className="grid gap-3 p-4 border rounded-lg">
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`${id}-fourPs`}
												checked={formData.fourPs.registered}
												onCheckedChange={(checked) =>
													handleGovServiceChange("fourPs", "registered", !!checked)
												}
											/>
											<Label htmlFor={`${id}-fourPs`} className="font-medium cursor-pointer">
												4Ps Beneficiary
											</Label>
										</div>
										{formData.fourPs.registered && (
											<div className="grid grid-cols-2 gap-3 pl-6">
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Household ID</Label>
													<Input
														value={formData.fourPs.idNumber ?? ""}
														onChange={(e) =>
															handleGovServiceChange("fourPs", "idNumber", e.target.value)
														}
														placeholder="4PS-2020-123456"
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Issue Date</Label>
													<Input
														type="date"
														value={formData.fourPs.issueDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("fourPs", "issueDate", e.target.value)
														}
													/>
												</div>
											</div>
										)}
									</div>

									{/* PWD */}
									<div className="grid gap-3 p-4 border rounded-lg">
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`${id}-pwd`}
												checked={formData.pwd.registered}
												onCheckedChange={(checked) =>
													handleGovServiceChange("pwd", "registered", !!checked)
												}
											/>
											<Label htmlFor={`${id}-pwd`} className="font-medium cursor-pointer">
												PWD Registered
											</Label>
										</div>
										{formData.pwd.registered && (
											<div className="grid grid-cols-3 gap-3 pl-6">
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">PWD ID</Label>
													<Input
														value={formData.pwd.idNumber ?? ""}
														onChange={(e) =>
															handleGovServiceChange("pwd", "idNumber", e.target.value)
														}
														placeholder="PWD-2020-123456"
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Issue Date</Label>
													<Input
														type="date"
														value={formData.pwd.issueDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("pwd", "issueDate", e.target.value)
														}
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Expiry Date</Label>
													<Input
														type="date"
														value={formData.pwd.expiryDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("pwd", "expiryDate", e.target.value)
														}
													/>
												</div>
											</div>
										)}
									</div>

									{/* Solo Parent */}
									<div className="grid gap-3 p-4 border rounded-lg">
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`${id}-soloParent`}
												checked={formData.soloParent.registered}
												onCheckedChange={(checked) =>
													handleGovServiceChange("soloParent", "registered", !!checked)
												}
											/>
											<Label htmlFor={`${id}-soloParent`} className="font-medium cursor-pointer">
												Solo Parent
											</Label>
										</div>
										{formData.soloParent.registered && (
											<div className="grid grid-cols-3 gap-3 pl-6">
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Solo Parent ID</Label>
													<Input
														value={formData.soloParent.idNumber ?? ""}
														onChange={(e) =>
															handleGovServiceChange("soloParent", "idNumber", e.target.value)
														}
														placeholder="SP-2020-123456"
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Issue Date</Label>
													<Input
														type="date"
														value={formData.soloParent.issueDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("soloParent", "issueDate", e.target.value)
														}
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Expiry Date</Label>
													<Input
														type="date"
														value={formData.soloParent.expiryDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("soloParent", "expiryDate", e.target.value)
														}
													/>
												</div>
											</div>
										)}
									</div>

									{/* Barangay Clearance */}
									<div className="grid gap-3 p-4 border rounded-lg">
										<div className="flex items-center space-x-2">
											<Checkbox
												id={`${id}-barangayClearance`}
												checked={formData.barangayClearance.registered}
												onCheckedChange={(checked) =>
													handleGovServiceChange("barangayClearance", "registered", !!checked)
												}
											/>
											<Label htmlFor={`${id}-barangayClearance`} className="font-medium cursor-pointer">
												Barangay Clearance
											</Label>
										</div>
										{formData.barangayClearance.registered && (
											<div className="grid grid-cols-3 gap-3 pl-6">
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Certificate No.</Label>
													<Input
														value={formData.barangayClearance.idNumber ?? ""}
														onChange={(e) =>
															handleGovServiceChange("barangayClearance", "idNumber", e.target.value)
														}
														placeholder="BC-2024-001234"
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Issue Date</Label>
													<Input
														type="date"
														value={formData.barangayClearance.issueDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("barangayClearance", "issueDate", e.target.value)
														}
													/>
												</div>
												<div className="grid gap-1">
													<Label className="text-xs text-muted-foreground">Expiry Date</Label>
													<Input
														type="date"
														value={formData.barangayClearance.expiryDate ?? ""}
														onChange={(e) =>
															handleGovServiceChange("barangayClearance", "expiryDate", e.target.value)
														}
													/>
												</div>
											</div>
										)}
									</div>
									</div>
								</div>
							</div>

							{/* Actions - outside two-column layout */}
							<div className="flex justify-end gap-3 pt-6 mt-6 border-t">
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
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
