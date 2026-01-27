import { Badge } from "@/components/ui/badge";
import type { ResidencyStatus } from "@/data/people";

const variants: Record<ResidencyStatus, { className: string; label: string }> =
	{
		resident: {
			className:
				"bg-green-100 text-green-700 border-green-300 hover:bg-green-200",
			label: "Resident",
		},
		nonResident: {
			className: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
			label: "Non-Resident",
		},
	};

export function ResidencyBadge({ status }: { status: ResidencyStatus }) {
	const variant = variants[status];
	return (
		<Badge variant="outline" className={variant.className}>
			{variant.label}
		</Badge>
	);
}
