// Shared ID Card JSX Components
// These components can be used both for server-side PNG generation (via satori)
// and client-side preview rendering

import type { Person } from "@/data/people";
import type { IdCardConfig } from "./id-card-config";

// Helper functions
export function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-PH", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	});
}

export function formatDateMMYY(dateStr: string): string {
	const date = new Date(dateStr);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = String(date.getFullYear()).slice(-2);
	return `${month}/${year}`;
}

export function getFullName(person: Person): string {
	const parts = [person.lastName];
	parts.push(",");
	parts.push(person.firstName);
	if (person.middleName) {
		parts.push(person.middleName);
	}
	if (person.suffix) {
		parts.push(person.suffix);
	}
	return parts.join(" ").replace(" ,", ",");
}

export function getFullAddress(person: Person): string {
	const parts: string[] = [];
	if (person.address.purok) {
		parts.push(`PUROK ${person.address.purok}`);
	}
	parts.push(person.address.barangay.toUpperCase());
	parts.push("LORETO");
	parts.push("AGUSAN DEL SUR");
	return parts.join(", ");
}

// Check if person is a senior citizen (60+ years old)
export function isSeniorCitizen(birthdate: string): boolean {
	const today = new Date();
	const birth = new Date(birthdate);
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age >= 60;
}

// Format emergency contact name as "LAST NAME, FIRST NAME"
export function formatEmergencyContactName(name: string | undefined): string {
	if (!name) return "—";
	const parts = name.trim().split(/\s+/);
	if (parts.length < 2) return name.toUpperCase();

	// Handle common Filipino compound surnames (Dela, De, Del, Delos, etc.)
	const compoundPrefixes = [
		"dela",
		"de",
		"del",
		"delos",
		"san",
		"sta",
		"santo",
	];
	let lastNameParts: string[] = [];
	let firstNameParts: string[] = [];

	// Check if second-to-last word is a compound prefix
	if (parts.length >= 3) {
		const secondToLast = parts[parts.length - 2].toLowerCase();
		if (compoundPrefixes.includes(secondToLast)) {
			// Compound surname: e.g., "Dela Cruz"
			lastNameParts = parts.slice(-2);
			firstNameParts = parts.slice(0, -2);
		} else {
			// Simple surname
			lastNameParts = [parts[parts.length - 1]];
			firstNameParts = parts.slice(0, -1);
		}
	} else {
		// Only 2 parts: first name + last name
		lastNameParts = [parts[parts.length - 1]];
		firstNameParts = parts.slice(0, -1);
	}

	const lastName = lastNameParts.join(" ").toUpperCase();
	const firstName = firstNameParts.join(" ").toUpperCase();
	return `${lastName}, ${firstName}`;
}

// Props for ID card components
export interface IdCardFrontProps {
	person: Person;
	qrDataUrl: string;
	profilePhotoDataUrl: string | null;
	config: IdCardConfig;
	// Asset data URLs (base64 encoded)
	backgroundDataUrl: string;
	sealDataUrl: string;
	logoDataUrl: string;
}

export interface IdCardBackProps {
	person: Person;
	config: IdCardConfig;
	backgroundDataUrl: string;
}

// Terms text constant
export const TERMS_TEXT =
	"By signing or using this card, the cardholder agrees to be bound by the LORECARD Terms and Conditions. Please present this card when availing of any services from the Local Government Unit of Loreto, Agusan del Sur or partner establishments. Tampering invalidates this card. A card is deemed tampered when there are alterations or erasures apparent on the card itself. If you find a lost card, please return to the Municipal Information Office located at the Municipal Hall, Zone 8, Poblacion, Loreto, Agusan del Sur.";

// Front card component
export function IdCardFront({
	person,
	qrDataUrl,
	profilePhotoDataUrl,
	config,
	backgroundDataUrl,
	sealDataUrl,
	logoDataUrl,
}: IdCardFrontProps) {
	const { card, colors, front } = config;

	const fullName = getFullName(person);
	const displayName =
		fullName.length > 30 ? `${fullName.slice(0, 30)}...` : fullName;
	const today = new Date();
	const validUntil = new Date(today);
	validUntil.setFullYear(validUntil.getFullYear() + 1);

	return (
		<div
			style={{
				width: card.width,
				height: card.height,
				position: "relative",
				display: "flex",
				flexDirection: "column",
				fontFamily: "Montserrat",
			}}
		>
			{/* Background */}
			<img
				src={backgroundDataUrl}
				alt=""
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: card.width,
					height: card.height,
				}}
			/>

			{/* Header area */}
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					position: "relative",
					width: "100%",
					height: front.header.height,
				}}
			>
				{/* Seal (top-left) */}
				<img
					src={sealDataUrl}
					alt="Loreto Seal"
					style={{
						position: "absolute",
						left: front.seal.x,
						top: front.seal.y,
						width: front.seal.size,
						height: front.seal.size,
					}}
				/>

				{/* Logo (top-right) */}
				<img
					src={logoDataUrl}
					alt="SHINE Loreto Logo"
					style={{
						position: "absolute",
						right: front.logo.rightOffset,
						top: front.logo.y,
						height: front.logo.height,
					}}
				/>

				{/* Header text */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						width: "100%",
						paddingTop: front.header.paddingTop,
					}}
				>
					<span
						style={{
							fontSize: front.header.province.fontSize,
							fontWeight: 700,
							color: colors.textDark,
						}}
					>
						PROVINCE OF AGUSAN DEL SUR
					</span>
					<span
						style={{
							fontSize: front.header.municipality.fontSize,
							fontWeight: 700,
							color: colors.textDark,
							marginTop: front.header.municipality.marginTop,
						}}
					>
						MUNICIPALITY OF LORETO
					</span>
					<span
						style={{
							fontSize: front.header.lorecard.fontSize,
							fontWeight: 700,
							color: colors.textDark,
							marginTop: front.header.lorecard.marginTop,
							letterSpacing: front.header.lorecard.letterSpacing,
						}}
					>
						LORECARD
					</span>
					<span
						style={{
							fontSize: front.header.subtitle.fontSize,
							color: colors.textDark,
							letterSpacing: front.header.subtitle.letterSpacing,
							marginTop: front.header.subtitle.marginTop,
						}}
					>
						LORETO RESIDENTIAL CARD
					</span>
				</div>
			</div>

			{/* Status bar - layout depends on senior/PWD status */}
			{(() => {
				const isSenior = isSeniorCitizen(person.birthdate);
				const isPwd = person.pwd.registered;
				const hasSpecialStatus = isSenior || isPwd;
				const residencyColor =
					person.residencyStatus === "nonResident"
						? colors.nonResidentBar
						: colors.blueBar;

				// Widths depend on scenario:
				// - Neither: 100% residency
				// - Senior only: 35% residency, 65% yellow with "SENIOR CITIZEN"
				// - PWD only: 35% residency, 65% green with "PERSON WITH DISABILITY"
				// - Both: 27% residency, 22% yellow (no text), 50% green with combined text
				const residencyWidth = !hasSpecialStatus
					? "100%"
					: isSenior && isPwd
						? "27%"
						: "35%";

				return (
					<div
						style={{
							position: "absolute",
							top: front.residentBar.y,
							left: 0,
							width: "100%",
							height: front.residentBar.height,
							display: "flex",
						}}
					>
						{/* Residency status */}
						<div
							style={{
								width: residencyWidth,
								backgroundColor: residencyColor,
								display: "flex",
								alignItems: "center",
								paddingLeft: front.residentBar.paddingLeft,
							}}
						>
							<span
								style={{
									color: colors.textWhite,
									fontSize: front.residentBar.fontSize,
									fontWeight: 700,
									whiteSpace: "nowrap",
								}}
							>
								{person.residencyStatus === "nonResident"
									? "NON-RESIDENT"
									: "RESIDENT"}
							</span>
						</div>

						{/* Senior citizen band (yellow) */}
						{isSenior && (
							<div
								style={{
									width: isPwd ? "22%" : "65%",
									backgroundColor: colors.seniorBar,
									display: "flex",
									alignItems: "center",
									justifyContent: isPwd ? "center" : "flex-end",
									paddingRight: isPwd ? 0 : front.residentBar.paddingLeft,
								}}
							>
								{/* Text only if senior-only (not both) */}
								{!isPwd && (
									<span
										style={{
											color: colors.textWhite,
											fontSize: front.residentBar.fontSize,
											fontWeight: 700,
											whiteSpace: "nowrap",
										}}
									>
										SENIOR CITIZEN
									</span>
								)}
							</div>
						)}

						{/* PWD band (green) */}
						{isPwd && (
							<div
								style={{
									width: isSenior ? "51%" : "65%",
									backgroundColor: colors.pwdBar,
									display: "flex",
									alignItems: "center",
									justifyContent: "flex-end",
									paddingRight: front.residentBar.paddingLeft,
								}}
							>
								<span
									style={{
										color: colors.textWhite,
										fontSize: front.residentBar.fontSize,
										fontWeight: 700,
										whiteSpace: "nowrap",
									}}
								>
									{isSenior
										? "SENIOR CITIZEN | PERSON WITH DISABILITY"
										: "PERSON WITH DISABILITY"}
								</span>
							</div>
						)}
					</div>
				);
			})()}

			{/* Main content area */}
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					position: "absolute",
					top: front.photo.y,
					left: 0,
					width: "100%",
				}}
			>
				{/* Profile photo (left side) */}
				<div
					style={{
						marginLeft: front.photo.x,
						width: front.photo.width,
						height: front.photo.height,
						backgroundColor: profilePhotoDataUrl ? "transparent" : "#e5e7eb",
						borderRadius: front.photo.borderRadius,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						overflow: "hidden",
					}}
				>
					{profilePhotoDataUrl ? (
						<img
							src={profilePhotoDataUrl}
							alt="Portrait"
							style={{
								width: front.photo.width,
								height: front.photo.height,
								objectFit: "cover",
								borderRadius: front.photo.borderRadius,
							}}
						/>
					) : (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
							}}
						>
							{/* Silhouette head */}
							<div
								style={{
									width: 70,
									height: 70,
									borderRadius: 35,
									backgroundColor: "#9ca3af",
								}}
							/>
							{/* Silhouette body */}
							<div
								style={{
									width: 100,
									height: 60,
									borderRadius: "50px 50px 0 0",
									backgroundColor: "#9ca3af",
									marginTop: 10,
								}}
							/>
						</div>
					)}
				</div>

				{/* Person details (right of photo) */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						marginLeft: front.details.x - front.photo.x - front.photo.width,
						marginTop: front.details.y - front.photo.y,
						flex: 1,
					}}
				>
					{/* Name */}
					<span
						style={{
							fontSize: front.details.nameLabel.fontSize,
							color: colors.textLight,
						}}
					>
						Last Name, First Name, Middle Name
					</span>
					<span
						style={{
							fontSize: front.details.nameValue.fontSize,
							fontWeight: 700,
							color: colors.textDark,
							marginTop: front.details.nameValue.marginTop,
						}}
					>
						{displayName.toUpperCase()}
					</span>

					{/* Civil Status and DOB row */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							marginTop: front.details.nameGap,
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								width: front.details.firstColumnWidth,
							}}
						>
							<span
								style={{
									fontSize: front.details.fieldLabel.fontSize,
									color: colors.textLight,
								}}
							>
								Civil Status
							</span>
							<span
								style={{
									fontSize: front.details.fieldValue.fontSize,
									fontWeight: 700,
									color: colors.textDark,
									marginTop: front.details.fieldValue.marginTop,
								}}
							>
								{person.civilStatus?.toUpperCase() || "—"}
							</span>
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								marginLeft: front.details.columnGap,
							}}
						>
							<span
								style={{
									fontSize: front.details.fieldLabel.fontSize,
									color: colors.textLight,
								}}
							>
								Date of Birth
							</span>
							<span
								style={{
									fontSize: front.details.fieldValue.fontSize,
									fontWeight: 700,
									color: colors.textDark,
									marginTop: front.details.fieldValue.marginTop,
								}}
							>
								{formatDate(person.birthdate)}
							</span>
						</div>
					</div>

					{/* Date Issued and Valid Until row */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							marginTop: front.details.rowGap,
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								width: front.details.firstColumnWidth,
							}}
						>
							<span
								style={{
									fontSize: front.details.fieldLabel.fontSize,
									color: colors.textLight,
								}}
							>
								Date Issued
							</span>
							<span
								style={{
									fontSize: front.details.fieldValue.fontSize,
									fontWeight: 700,
									color: colors.textDark,
									marginTop: front.details.fieldValue.marginTop,
								}}
							>
								{formatDate(today.toISOString())}
							</span>
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								marginLeft: front.details.columnGap,
							}}
						>
							<span
								style={{
									fontSize: front.details.fieldLabel.fontSize,
									color: colors.textLight,
								}}
							>
								Valid Until
							</span>
							<span
								style={{
									fontSize: front.details.fieldValue.fontSize,
									fontWeight: 700,
									color: colors.textDark,
									marginTop: front.details.fieldValue.marginTop,
								}}
							>
								{formatDateMMYY(validUntil.toISOString())}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* QR Code (absolute positioned) */}
			<img
				src={qrDataUrl}
				alt="QR Code"
				style={{
					position: "absolute",
					top: front.qrCode.y,
					right: front.qrCode.rightOffset,
					width: front.qrCode.size,
					height: front.qrCode.size,
				}}
			/>

			{/* Address bar (bottom) */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					width: "100%",
					height: front.addressBar.height,
					display: "flex",
					flexDirection: "column",
					paddingLeft: front.addressBar.paddingLeft,
					paddingTop: front.addressBar.paddingTop,
				}}
			>
				<span
					style={{
						fontSize: front.addressBar.labelSize,
						color: colors.textLight,
					}}
				>
					Address
				</span>
				<span
					style={{
						fontSize: front.addressBar.valueSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: front.addressBar.valueGap,
					}}
				>
					{getFullAddress(person)}
				</span>
			</div>
		</div>
	);
}

// Back card component
export function IdCardBack({
	person,
	config,
	backgroundDataUrl,
}: IdCardBackProps) {
	const { card, colors, back } = config;

	const phoneDisplay = person.phoneNumber.startsWith("63")
		? `+${person.phoneNumber}`
		: person.phoneNumber;
	const pob = person.placeOfBirth?.toUpperCase() || "—";
	const ecName = formatEmergencyContactName(person.emergencyContactName);
	const ecPhone = person.emergencyContactPhone
		? person.emergencyContactPhone.startsWith("63")
			? `+${person.emergencyContactPhone}`
			: person.emergencyContactPhone
		: "";

	return (
		<div
			style={{
				width: card.width,
				height: card.height,
				position: "relative",
				display: "flex",
				fontFamily: "Montserrat",
			}}
		>
			{/* Background */}
			<img
				src={backgroundDataUrl}
				alt=""
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: card.width,
					height: card.height,
				}}
			/>

			{/* Semi-transparent overlay */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: card.width,
					height: card.height,
					backgroundColor: `rgba(255,255,255,${back.overlay.opacity})`,
				}}
			/>

			{/* Left column */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					position: "absolute",
					top: back.leftColumn.y,
					left: back.leftColumn.x,
				}}
			>
				{/* Blood Type */}
				<span
					style={{
						fontSize: back.leftColumn.labelSize,
						color: colors.textLight,
					}}
				>
					Blood Type
				</span>
				<span
					style={{
						fontSize: back.leftColumn.bloodType.valueSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: back.leftColumn.bloodType.marginTop,
					}}
				>
					{person.bloodType || "—"}
				</span>

				{/* Gender */}
				<span
					style={{
						fontSize: back.leftColumn.labelSize,
						color: colors.textLight,
						marginTop: back.leftColumn.fieldGap,
					}}
				>
					Gender
				</span>
				<span
					style={{
						fontSize: back.leftColumn.gender.valueSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: back.leftColumn.gender.marginTop,
					}}
				>
					{person.gender?.toUpperCase() || "—"}
				</span>

				{/* Contact Number */}
				<span
					style={{
						fontSize: back.leftColumn.labelSize,
						color: colors.textLight,
						marginTop: back.leftColumn.fieldGap,
					}}
				>
					Contact Number
				</span>
				<span
					style={{
						fontSize: back.leftColumn.contact.valueSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: back.leftColumn.contact.marginTop,
					}}
				>
					{phoneDisplay}
				</span>

				{/* Place of Birth */}
				<span
					style={{
						fontSize: back.leftColumn.labelSize,
						color: colors.textLight,
						marginTop: back.leftColumn.fieldGap,
					}}
				>
					Place of Birth
				</span>
				<span
					style={{
						fontSize: back.leftColumn.pob.valueSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: back.leftColumn.pob.marginTop,
						maxWidth: back.leftColumn.pob.maxWidth,
						display: "flex",
						flexWrap: "wrap",
					}}
				>
					{pob}
				</span>

				{/* PhilHealth ID */}
				<span
					style={{
						fontSize: back.leftColumn.labelSize,
						color: colors.textLight,
						marginTop: back.leftColumn.fieldGap,
					}}
				>
					PhilHealth ID
				</span>
				<span
					style={{
						fontSize: back.leftColumn.philhealth.valueSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: back.leftColumn.philhealth.marginTop,
					}}
				>
					{person.philhealth.idNumber || "—"}
				</span>
			</div>

			{/* Emergency Contact (bottom left) */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					position: "absolute",
					bottom: back.emergency.bottomOffset,
					left: back.emergency.x,
				}}
			>
				<span
					style={{
						fontSize: back.emergency.labelSize,
						color: colors.textLight,
					}}
				>
					Emergency Contact
				</span>
				<span
					style={{
						fontSize: back.emergency.nameSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: back.emergency.nameGap,
					}}
				>
					{ecName}
				</span>
				<span
					style={{
						fontSize: back.emergency.phoneSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: back.emergency.phoneGap,
					}}
				>
					{ecPhone}
				</span>
			</div>

			{/* Right side - Issuing Authority */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					position: "absolute",
					top: back.authority.y,
					left: back.authority.x,
					width: back.authority.width,
				}}
			>
				<span
					style={{
						fontSize: back.authority.labelSize,
						color: colors.textLight,
						whiteSpace: "nowrap",
					}}
				>
					Issuing Authority
				</span>
				<span
					style={{
						fontSize: back.authority.nameSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: back.authority.gaps.afterLabel,
						whiteSpace: "nowrap",
					}}
				>
					(SGD) ALVIN ANGCHANGCO OTAZA, RCE
				</span>
				<span
					style={{
						fontSize: back.authority.titleSize,
						color: colors.textLight,
						marginTop: back.authority.gaps.afterName,
						whiteSpace: "nowrap",
					}}
				>
					Municipal Mayor
				</span>
				<span
					style={{
						fontSize: back.authority.deptSize,
						fontWeight: 700,
						color: colors.textDark,
						marginTop: back.authority.gaps.afterTitle,
						whiteSpace: "nowrap",
					}}
				>
					LOCAL GOVERNMENT UNIT OF LORETO
				</span>
			</div>

			{/* General Terms and Conditions */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					position: "absolute",
					bottom: back.terms.bottomOffset,
					left: back.terms.x,
					width: back.terms.width,
				}}
			>
				<span
					style={{
						fontSize: back.terms.headingSize,
						fontWeight: 700,
						color: colors.textDark,
						textAlign: "center",
					}}
				>
					GENERAL TERMS AND CONDITION
				</span>
				<span
					style={{
						fontSize: back.terms.bodySize,
						color: colors.textDark,
						marginTop: back.terms.gap,
						lineHeight: back.terms.lineHeight,
						textAlign: "center",
					}}
				>
					{TERMS_TEXT}
				</span>
			</div>
		</div>
	);
}
