import { Badge } from "@/components/ui/badge";
import type { PersonStatus } from "@/data/people";

interface PersonStatusBadgeProps {
	status: PersonStatus;
}

export function PersonStatusBadge({ status }: PersonStatusBadgeProps) {
	const variants: Record<PersonStatus, { className: string; label: string }> = {
		active: {
			className:
				"bg-green-100 text-green-700 border-green-300 hover:bg-green-200",
			label: "Active",
		},
		inactive: {
			className: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
			label: "Inactive",
		},
		pending: {
			className:
				"bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200",
			label: "Pending",
		},
		deleted: {
			className: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200",
			label: "Deleted",
		},
	};

	const variant = variants[status];

	return (
		<Badge variant="outline" className={variant.className}>
			{variant.label}
		</Badge>
	);
}
