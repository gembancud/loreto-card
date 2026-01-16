import { useLayoutEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Person } from "@/data/people";
import { type ActiveService, getActiveServices } from "@/lib/govServices";

interface GovServiceBadgesProps {
	person: Person;
}

const GAP = 4; // gap-1 = 4px
const OVERFLOW_BADGE_WIDTH = 70; // "+N more" estimated width

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

export function GovServiceBadges({ person }: GovServiceBadgesProps) {
	const activeServices = getActiveServices(person);
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	const [maxDisplay, setMaxDisplay] = useState<number | null>(null);

	useLayoutEffect(() => {
		if (activeServices.length === 0) return;

		const container = containerRef.current;
		const measureContainer = measureRef.current;
		if (!container || !measureContainer) return;

		const calculateMaxDisplay = () => {
			const containerWidth = container.offsetWidth;
			const badgeElements = measureContainer.children;

			if (badgeElements.length === 0) return;

			// Collect badge widths
			const badgeWidths: number[] = [];
			for (let i = 0; i < badgeElements.length; i++) {
				badgeWidths.push((badgeElements[i] as HTMLElement).offsetWidth);
			}

			// Calculate how many badges fit
			let totalWidth = 0;
			let count = 0;

			for (let i = 0; i < badgeWidths.length; i++) {
				const badgeWidth = badgeWidths[i];
				const hasMoreBadges = i < badgeWidths.length - 1;
				const _remainingBadges = badgeWidths.length - 1 - i;

				// If this is the last badge that would fit, we don't need overflow indicator
				// If there are more badges after this, we need to reserve space for overflow
				const widthNeeded =
					totalWidth +
					badgeWidth +
					(hasMoreBadges ? GAP + OVERFLOW_BADGE_WIDTH : 0);

				if (widthNeeded <= containerWidth) {
					totalWidth += badgeWidth + GAP;
					count++;
				} else {
					// Can't fit this badge plus overflow indicator
					// Check if we can at least fit some badges with overflow
					break;
				}
			}

			// Always show at least 1 badge
			setMaxDisplay(Math.max(count, 1));
		};

		// Initial calculation
		calculateMaxDisplay();

		// Set up ResizeObserver for dynamic updates
		const resizeObserver = new ResizeObserver(() => {
			calculateMaxDisplay();
		});

		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
		};
	}, [activeServices]);

	if (activeServices.length === 0) {
		return <span className="text-sm text-muted-foreground italic">None</span>;
	}

	const displayCount = maxDisplay ?? activeServices.length;
	const displayedServices = activeServices.slice(0, displayCount);
	const overflowCount = activeServices.length - displayCount;
	const overflowServices = activeServices.slice(displayCount);

	// Build tooltip text for overflow indicator
	const overflowTooltip = overflowServices
		.map((s) => {
			const label = s.config.label;
			return s.expired ? `${label} (Expired)` : label;
		})
		.join(", ");

	return (
		<>
			{/* Hidden measurement container */}
			<div
				ref={measureRef}
				className="absolute invisible pointer-events-none flex gap-1"
				aria-hidden="true"
			>
				{activeServices.map((service) => (
					<ServiceBadge key={service.key} service={service} />
				))}
			</div>

			{/* Visible container */}
			<div ref={containerRef} className="flex gap-1 items-center min-w-0">
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
		</>
	);
}
