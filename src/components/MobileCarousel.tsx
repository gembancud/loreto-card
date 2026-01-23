import { Children, type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MobileCarouselProps {
	children: ReactNode;
	showIndicators?: boolean;
}

export function MobileCarousel({
	children,
	showIndicators = false,
}: MobileCarouselProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const childCount = Children.count(children);

	const handleScroll = () => {
		if (!scrollRef.current) return;
		const { scrollLeft, clientWidth } = scrollRef.current;
		// Each item is 80vw + 12px gap (gap-3 = 0.75rem = 12px)
		const itemWidth = clientWidth * 0.8 + 12;
		const index = Math.round(scrollLeft / itemWidth);
		setActiveIndex(Math.min(index, childCount - 1));
	};

	return (
		<div>
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
			>
				<div className="flex gap-3 pb-2">{children}</div>
			</div>
			{showIndicators && childCount > 1 && (
				<div className="flex justify-center gap-1.5 pt-3">
					{Array.from({ length: childCount }, (_, index) => ({
						key: `indicator-${index}`,
						index,
					})).map((dot) => (
						<div
							key={dot.key}
							className={cn(
								"h-1.5 w-1.5 rounded-full transition-colors",
								dot.index === activeIndex
									? "bg-primary"
									: "bg-muted-foreground/30",
							)}
						/>
					))}
				</div>
			)}
		</div>
	);
}

interface CarouselItemProps {
	children: ReactNode;
}

export function CarouselItem({ children }: CarouselItemProps) {
	return <div className="shrink-0 w-[80vw] snap-start">{children}</div>;
}
