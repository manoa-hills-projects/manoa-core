import * as schema from "@/shared/database/schemas";
import { buildSingleData } from "@/shared/utils/api-reponse";
import { count, eq, isNull, like, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { QueryAiInput } from "./dto/query-ai.dto";

// --- Types for Cloudflare Workers AI Tools ---

type ToolDefinition = {
	name: string;
	description: string;
	parameters: {
		type: "object";
		properties: Record<string, unknown>;
		required?: string[];
	};
};

type ToolCall = {
	name: string;
	arguments: Record<string, unknown>;
};

type AiBinding = {
	run: (
		model: string,
		input: {
			messages: Array<{
				role: "system" | "user" | "tool" | "assistant";
				content?: string;
				tool_calls?: ToolCall[];
				name?: string;
			}>;
			tools?: ToolDefinition[];
		},
	) => Promise<{
		response?: string;
		tool_calls?: ToolCall[];
	}>;
};

type InsightsSnapshot = {
	totalCitizens: number;
	totalFamilies: number;
	totalHouses: number;
	citizensWithoutFamily: number;
	familiesWithoutHead: number;
	householdHeads: number;
	genderBreakdown: Array<{ gender: string; total: number }>;
};

const getInsightsSnapshot = async (
	db: DrizzleD1Database<typeof schema>,
): Promise<InsightsSnapshot> => {
	const [
		[{ totalCitizens }],
		[{ totalFamilies }],
		[{ totalHouses }],
		[{ citizensWithoutFamily }],
		[{ familiesWithoutHead }],
		[{ householdHeads }],
		genderRows,
	] = await Promise.all([
		db.select({ totalCitizens: count() }).from(schema.citizens),
		db.select({ totalFamilies: count() }).from(schema.families),
		db.select({ totalHouses: count() }).from(schema.houses),
		db
			.select({ citizensWithoutFamily: count() })
			.from(schema.citizens)
			.where(isNull(schema.citizens.familyId)),
		db
			.select({ familiesWithoutHead: count() })
			.from(schema.families)
			.where(isNull(schema.families.headId)),
		db
			.select({ householdHeads: count() })
			.from(schema.citizens)
			.where(eq(schema.citizens.isHeadOfHousehold, true)),
		db
			.select({
				gender: sql<string>`COALESCE(LOWER(${schema.citizens.gender}), 'sin_definir')`,
				total: count(),
			})
			.from(schema.citizens)
			.groupBy(sql`LOWER(${schema.citizens.gender})`),
	]);

	return {
		totalCitizens,
		totalFamilies,
		totalHouses,
		citizensWithoutFamily,
		familiesWithoutHead,
		householdHeads,
		genderBreakdown: genderRows,
	};
};

const getFamilyMembers = async (
	db: DrizzleD1Database<typeof schema>,
	familyName: string,
) => {
	// Simple fuzzy search
	// Note: In D1/SQLite 'like' is case-insensitive by default for ASCII characters only.
	// Ideally we would normalize, but let's keep it simple for now or use lower().
	const family = await db
		.select()
		.from(schema.families)
		.where(like(schema.families.name, `%${familyName}%`))
		.get();

	if (!family) {
		return { found: false, message: `No encontré ninguna familia que coincida con "${familyName}".` };
	}

	const members = await db
		.select({
			firstName: schema.citizens.firstName,
			lastName: schema.citizens.lastName,
			isHead: schema.citizens.isHeadOfHousehold,
		})
		.from(schema.citizens)
		.where(eq(schema.citizens.familyId, family.id));

	return {
		found: true,
		familyName: family.name,
		totalMembers: members.length,
		members: members.map((m) => ({
			name: `${m.firstName} ${m.lastName}`,
			role: m.isHead ? "Jefe de Hogar" : "Miembro",
		})),
	};
};

// --- Tools Configuration ---

const AI_TOOLS: ToolDefinition[] = [
	{
		name: "getManoaStats",
		description:
			"Get real-time statistics about Manoa Core database: citizen counts, families, houses, and demographic breakdowns. Use this whenever the user asks for 'stats', 'totals', 'how many', or database metrics.",
		parameters: {
			type: "object",
			properties: {},
		},
	},
	{
		name: "getFamilyDetails",
		description:
			"Search for a specific family by name and retrieve its members list. Use this when the user asks 'who lives in family X', 'members of family Y', or specific questions about a family composition.",
		parameters: {
			type: "object",
			properties: {
				familyName: {
					type: "string",
					description: "The name of the family to search for (e.g. 'Perez', 'Familia Gomez').",
				},
			},
			required: ["familyName"],
		},
	},
];

// --- Main Handler ---

/**
 * Handles AI queries using Cloudflare Workers AI with Function Calling (Tools).
 * 
 * Flow:
 * 1. User asks a question.
 * 2. LLM analyzes question and decides if it needs 'getManoaStats'.
 * 3. If yes -> Executes DB query -> Returns JSON to LLM -> LLM summarizes.
 * 4. If no  -> LLM answers directly.
 */
export const queryAssistant = async (
	db: DrizzleD1Database<typeof schema>,
	data: QueryAiInput,
	options: {
		ai: any;
		model: string;
	},
) => {
	const ai = options.ai as AiBinding;
	const messages = [
		{
			role: "system" as const,
			content: `You are Manoa Assistant, a helpful AI for the Manoa Core community dashboard.
Current Date: ${new Date().toLocaleDateString("es-ES")}.
You have access to real-time tools. 
- ALWAYS use 'getManoaStats' if the user asks for numbers or statistics about citizens, families, or houses.
- ALWAYS use 'getFamilyDetails' if the user asks about a specific family, who lives there, or their members.
If you use a tool, summarize the data in Spanish naturally.
Do not make up data. If you don't know, say so.`,
		},
		{
			role: "user" as const,
			content: data.question,
		},
	];

	try {
		// 1. First Pass: Call LLM with Tools
		const response1 = await ai.run(options.model, {
			messages,
			tools: AI_TOOLS,
		});

		console.log("Model Response 1:", JSON.stringify(response1, null, 2));

		// 2. Check for Tool Calls
		if (response1.tool_calls && response1.tool_calls.length > 0) {
			const toolCall = response1.tool_calls[0]; // Handle first tool call
			console.log("Executing Tool:", toolCall.name);
			
			let toolResult = "";

			if (toolCall.name === "getManoaStats") {
				// Execute Stats Tool
				const stats = await getInsightsSnapshot(db);
				toolResult = JSON.stringify(stats);
			} else if (toolCall.name === "getFamilyDetails") {
				// Execute Family Search Tool
				// Note: arguments is usually an object, but sometimes can be a string depending on model quirk.
				const args = toolCall.arguments as unknown as { familyName: string };
				const details = await getFamilyMembers(db, args.familyName);
				toolResult = JSON.stringify(details);
			}

			if (toolResult) {
				// Append tool interaction to history
				const newMessages = [
					...messages,
					{
						role: "assistant" as const,
						content: "",
						tool_calls: response1.tool_calls,
					},
					{
						role: "tool" as const,
						name: toolCall.name,
						content: toolResult,
					},
				];

				// 3. Second Pass: Get Final Answer
				const response2 = await ai.run(options.model, {
					messages: newMessages,
				});

				return buildSingleData({
					answer:
						response2.response ||
						"No pude generar una respuesta con los datos obtenidos.",
					intent: "tool_execution",
				});
			}
		}

		// 3. No Tool Needed: Return direct response
		return buildSingleData({
			answer:
				response1.response ||
				"Lo siento, no pude procesar tu solicitud. Intenta preguntar de otra forma.",
			intent: "general_chat",
		});
	} catch (error) {
		console.error("AI Assistant Error:", error);
		// Fallback safe response
		return buildSingleData({
			answer:
				"Hubo un error interno al conectar con el asistente. Por favor intenta más tarde.",
			intent: "error",
		});
	}
};
