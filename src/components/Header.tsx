import { Link } from "@tanstack/react-router";

export default function Header() {
	return (
		<header className="border-b bg-white px-6 py-4">
			<Link to="/" className="text-xl font-semibold text-gray-900">
				Loreto Card
			</Link>
		</header>
	);
}
