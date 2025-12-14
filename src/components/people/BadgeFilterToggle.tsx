import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	GOV_SERVICE_CONFIG,
	GOV_SERVICE_KEYS,
	type GovServiceKey,
} from "@/lib/govServices";

interface BadgeFilterToggleProps {
	selectedBadges: Set<GovServiceKey>;
	onToggleBadge: (key: GovServiceKey) => void;
	filterMode: "any" | "all";
	onFilterModeChange: (mode: "any" | "all") => void;
}

export function BadgeFilterToggle({
	selectedBadges,
	onToggleBadge,
	filterMode,
	onFilterModeChange,
}: BadgeFilterToggleProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="text-sm text-muted-foreground whitespace-nowrap">
				Services:
			</span>
			<div className="flex flex-wrap gap-1">
				{GOV_SERVICE_KEYS.map((key) => {
					const config = GOV_SERVICE_CONFIG[key];
					const isSelected = selectedBadges.has(key);

					return (
						<Badge
							key={key}
							variant={isSelected ? "default" : "outline"}
							className={`cursor-pointer text-sm px-2 py-0.5 transition-colors ${
								isSelected
									? "bg-primary text-primary-foreground hover:bg-primary/90"
									: "bg-background hover:bg-muted"
							}`}
							onClick={() => onToggleBadge(key)}
							title={config.label}
						>
							{config.emoji} {config.shortLabel}
						</Badge>
					);
				})}
			</div>
			{selectedBadges.size > 1 && (
				<div className="flex items-center gap-1 ml-2">
					<Button
						variant={filterMode === "any" ? "default" : "outline"}
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={() => onFilterModeChange("any")}
					>
						Any
					</Button>
					<Button
						variant={filterMode === "all" ? "default" : "outline"}
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={() => onFilterModeChange("all")}
					>
						All
					</Button>
				</div>
			)}
		</div>
	);
}
