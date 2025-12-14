import { Badge } from "@/components/ui/badge";
import type { Person } from "@/data/people";
import { type ActiveService, getActiveServices } from "@/lib/govServices";

interface GovServiceBadgesProps {
	person: Person;
	maxDisplay?: number;
}

function ServiceBadge({ service }: { service: ActiveService }) {
	const baseClasses = "text-sm px-2 py-0.5";

	if (service.expired) {
		return (
			<Badge
				variant="outline"
				className={`${baseClasses} bg-red-50 text-red-700 border-red-300`}
				title={`${service.config.label} (Expired)`}
			>
				{service.config.emoji} {service.config.shortLabel}
			</Badge>
		);
	}

	return (
		<Badge
			variant="outline"
			className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-300`}
			title={service.config.label}
		>
			{service.config.emoji} {service.config.shortLabel}
		</Badge>
	);
}

export function GovServiceBadges({
	person,
	maxDisplay = 3,
}: GovServiceBadgesProps) {
	const activeServices = getActiveServices(person);

	if (activeServices.length === 0) {
		return (
			<span className="text-sm text-muted-foreground italic">None</span>
		);
	}

	const displayedServices = activeServices.slice(0, maxDisplay);
	const overflowCount = activeServices.length - maxDisplay;
	const overflowServices = activeServices.slice(maxDisplay);

	// Build tooltip text for overflow indicator
	const overflowTooltip = overflowServices
		.map((s) => {
			const label = s.config.label;
			return s.expired ? `${label} (Expired)` : label;
		})
		.join(", ");

	return (
		<div className="flex flex-wrap gap-1 items-center">
			{displayedServices.map((service) => (
				<ServiceBadge key={service.key} service={service} />
			))}
			{overflowCount > 0 && (
				<Badge
					variant="outline"
					className="text-sm px-2 py-0.5 bg-gray-100 text-gray-600 border-gray-300 cursor-help"
					title={overflowTooltip}
				>
					+{overflowCount} more
				</Badge>
			)}
		</div>
	);
}
