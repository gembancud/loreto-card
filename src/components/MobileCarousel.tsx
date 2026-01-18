import type { ReactNode } from "react";

interface MobileCarouselProps {
	children: ReactNode;
}

export function MobileCarousel({ children }: MobileCarouselProps) {
	return (
		<div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
			<div className="flex gap-3 pb-2">{children}</div>
		</div>
	);
}

interface CarouselItemProps {
	children: ReactNode;
}

export function CarouselItem({ children }: CarouselItemProps) {
	return <div className="shrink-0 w-[80vw] snap-start">{children}</div>;
}
