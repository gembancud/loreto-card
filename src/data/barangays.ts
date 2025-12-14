export const LORETO_BARANGAYS = [
	"Binucayan",
	"Johnson",
	"Kasapa",
	"Katipunan",
	"Kauswagan",
	"Magaud",
	"Nueva Gracia",
	"Poblacion",
	"Sabud",
	"San Isidro",
	"San Mariano",
	"San Vicente",
	"Santa Teresa",
	"Santo Nino",
	"Santo Tomas",
	"Violanta",
	"Waloe",
] as const;

export type LoretoBarangay = (typeof LORETO_BARANGAYS)[number];
