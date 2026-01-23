// ID Card Configuration
// All layout values extracted into a single config object for easy tweaking

import type { Person } from "@/data/people";

export interface IdCardConfig {
	// Global dimensions - CR80 standard at 300 DPI
	card: {
		width: number;
		height: number;
	};

	// Color palette
	colors: {
		blueBar: string;
		textDark: string;
		textLight: string;
		textWhite: string;
		redAccent: string;
	};

	// Front card layout
	front: {
		// Header area
		header: {
			height: number;
			paddingTop: number;
			province: { fontSize: number };
			municipality: { fontSize: number; marginTop: number };
			lorecard: { fontSize: number; letterSpacing: number; marginTop: number };
			subtitle: {
				fontSize: number;
				letterSpacing: number;
				marginTop: number;
			};
		};

		// Seal (top-left logo)
		seal: {
			x: number;
			y: number;
			size: number;
		};

		// SHINE logo (top-right)
		logo: {
			rightOffset: number;
			y: number;
			height: number;
		};

		// Blue "RESIDENT" bar (full width)
		residentBar: {
			y: number;
			height: number;
			paddingLeft: number;
			fontSize: number;
		};

		// Profile photo
		photo: {
			x: number;
			y: number;
			width: number;
			height: number;
			borderRadius: number;
		};

		// Person details section
		details: {
			x: number;
			y: number;
			nameLabel: { fontSize: number };
			nameValue: { fontSize: number; marginTop: number };
			fieldLabel: { fontSize: number };
			fieldValue: { fontSize: number; marginTop: number };
			nameGap: number;
			rowGap: number;
			columnGap: number;
			firstColumnWidth: number;
		};

		// QR code
		qrCode: {
			size: number;
			rightOffset: number;
			y: number;
		};

		// Address bar (bottom)
		addressBar: {
			height: number;
			paddingLeft: number;
			paddingTop: number;
			labelSize: number;
			valueSize: number;
			valueGap: number;
		};
	};

	// Back card layout
	back: {
		// Semi-transparent overlay
		overlay: { opacity: number };

		// Left column (personal info)
		leftColumn: {
			x: number;
			y: number;
			width: number;
			labelSize: number;
			fieldGap: number;
			bloodType: { valueSize: number; marginTop: number };
			gender: { valueSize: number; marginTop: number };
			contact: { valueSize: number; marginTop: number };
			pob: { valueSize: number; marginTop: number; maxWidth: number };
			philhealth: { valueSize: number; marginTop: number };
		};

		// Emergency contact (bottom-left)
		emergency: {
			x: number;
			bottomOffset: number;
			labelSize: number;
			nameSize: number;
			phoneSize: number;
			nameGap: number;
			phoneGap: number;
		};

		// Issuing authority (top-right)
		authority: {
			x: number;
			y: number;
			labelSize: number;
			nameSize: number;
			titleSize: number;
			deptSize: number;
			gaps: {
				afterLabel: number;
				afterName: number;
				afterTitle: number;
			};
		};

		// Terms and conditions (bottom-right)
		terms: {
			x: number;
			bottomOffset: number;
			width: number;
			headingSize: number;
			bodySize: number;
			lineHeight: number;
			gap: number;
		};
	};
}

export const defaultConfig: IdCardConfig = {
	card: {
		width: 1013,
		height: 638,
	},

	colors: {
		blueBar: "#0000fe",
		textDark: "#1a1a1a",
		textLight: "#4a4a4a",
		textWhite: "#ffffff",
		redAccent: "#dc2626",
	},

	front: {
		header: {
			height: 132,
			paddingTop: 56,
			province: { fontSize: 18 },
			municipality: { fontSize: 26, marginTop: -11 },
			lorecard: { fontSize: 72, letterSpacing: 11, marginTop: -24 },
			subtitle: { fontSize: 16, letterSpacing: 10, marginTop: -26 },
		},

		seal: {
			x: 58,
			y: 59,
			size: 133,
		},

		logo: {
			rightOffset: 50,
			y: 63,
			height: 130,
		},

		residentBar: {
			y: 221,
			height: 34,
			paddingLeft: 61,
			fontSize: 18,
		},

		photo: {
			x: 63,
			y: 283,
			width: 210,
			height: 213,
			borderRadius: 0,
		},

		details: {
			x: 300,
			y: 279,
			nameLabel: { fontSize: 17 },
			nameValue: { fontSize: 40, marginTop: -16 },
			fieldLabel: { fontSize: 16 },
			fieldValue: { fontSize: 26, marginTop: -9 },
			nameGap: 23,
			rowGap: 22,
			columnGap: 86,
			firstColumnWidth: 96,
		},

		qrCode: {
			size: 178,
			rightOffset: 62,
			y: 362,
		},

		addressBar: {
			height: 117,
			paddingLeft: 64,
			paddingTop: 8,
			labelSize: 17,
			valueSize: 25,
			valueGap: -7,
		},
	},

	back: {
		overlay: { opacity: 0.5 },

		leftColumn: {
			x: 40,
			y: 30,
			width: 350,
			labelSize: 14,
			fieldGap: 18,
			bloodType: { valueSize: 32, marginTop: 2 },
			gender: { valueSize: 26, marginTop: 2 },
			contact: { valueSize: 26, marginTop: 2 },
			pob: { valueSize: 20, marginTop: 2, maxWidth: 340 },
			philhealth: { valueSize: 24, marginTop: 2 },
		},

		emergency: {
			x: 40,
			bottomOffset: 40,
			labelSize: 14,
			nameSize: 24,
			phoneSize: 22,
			nameGap: 4,
			phoneGap: 4,
		},

		authority: {
			x: 480,
			y: 30,
			labelSize: 14,
			nameSize: 22,
			titleSize: 16,
			deptSize: 16,
			gaps: {
				afterLabel: 8,
				afterName: 4,
				afterTitle: 4,
			},
		},

		terms: {
			x: 480,
			bottomOffset: 40,
			width: 490,
			headingSize: 16,
			bodySize: 11,
			lineHeight: 1.5,
			gap: 6,
		},
	},
};

// Mock person data for testing/preview
export const mockPerson: Person = {
	id: "test-uuid-12345",
	firstName: "Juan",
	middleName: "Carlos",
	lastName: "Dela Cruz",
	suffix: undefined,
	birthdate: "2000-01-01",
	address: {
		street: "",
		purok: "8",
		barangay: "Poblacion",
	},
	phoneNumber: "639123456789",
	monthlyIncome: null,
	status: "active",
	profilePhoto: undefined,
	voter: { registered: false },
	philhealth: { registered: true, idNumber: "XX - XXXXXXXXX - X" },
	sss: { registered: false },
	fourPs: { registered: false },
	pwd: { registered: false },
	soloParent: { registered: false },
	pagibig: { registered: false },
	tin: { registered: false },
	barangayClearance: { registered: false },
	emergencyContactName: "Pedro Carlos Dela Cruz",
	emergencyContactPhone: "639123456780",
	bloodType: "O",
	gender: "Male",
	civilStatus: "Single",
	placeOfBirth: "Purok 8, Poblacion, Loreto, Agusan del Sur",
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};
