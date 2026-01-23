import { createFileRoute } from "@tanstack/react-router";
import { generateIdCardBackServer, mockPerson } from "@/lib/id-card-server";

export const Route = createFileRoute("/api/test-id-card/back")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const pngBuffer = await generateIdCardBackServer(mockPerson);
					return new Response(new Uint8Array(pngBuffer), {
						headers: {
							"Content-Type": "image/png",
							"Content-Disposition": 'inline; filename="id-back.png"',
						},
					});
				} catch (error) {
					console.error("Error generating ID card back:", error);
					return new Response(
						JSON.stringify({ error: "Failed to generate ID card" }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});
