export interface PollOption {
	id: string;
	text: string;
	votesCount: number;
}

export interface Poll {
	id: string;
	title: string;
	description: string | null;
	status: "open" | "closed";
	createdAt: string; // or Date depending on how it's parsed, usually string from API
	totalVotes: number;
	hasVoted: boolean;
	userVote: string | null;
	options: PollOption[];
}

export interface PollQueryParams {
	limit?: number;
	page?: number;
	search?: string;
}

export interface CreatePollPayload {
	title: string;
	description?: string;
	options: string[];
}

export interface UpdatePollStatusPayload {
	status: "open" | "closed";
}

export interface VotePollPayload {
	option_id: string;
}
