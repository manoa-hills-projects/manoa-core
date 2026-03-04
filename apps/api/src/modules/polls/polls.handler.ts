import * as schema from "@/shared/database/schemas";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { count, eq, sql } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import type { CreatePollInput, PollQueryParams, UpdatePollStatusInput, VoteInput } from "./dto";

export const createPoll = async (
  db: DrizzleD1Database<typeof schema>,
  data: CreatePollInput
) => {
  const [poll] = await db
    .insert(schema.polls)
    .values({
      title: data.title,
      description: data.description,
    })
    .returning();

  if (poll && data.options.length > 0) {
    const optionsToInsert = data.options.map((opt) => ({
      pollId: poll.id,
      text: opt,
    }));
    await db.insert(schema.pollOptions).values(optionsToInsert);
  }

  return buildSingleData(poll);
};

export const findAllPolls = async (
  db: DrizzleD1Database<typeof schema>,
  queryParams: PollQueryParams,
  userId?: string
) => {
  const { limit, page, search } = queryParams;

  const whereClause = search
    ? sql`LOWER(${schema.polls.title}) LIKE ${`%${search.toLowerCase()}%`}`
    : undefined;

  const pollsData = await db.query.polls.findMany({
    limit,
    offset: (page - 1) * limit,
    where: whereClause,
    orderBy: (polls, { desc }) => [desc(polls.createdAt)],
    with: {
      options: {
        with: {
          votes: true,
        },
      },
      votes: true,
    },
  });

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.polls)
    .where(whereClause);

  const mappedData = pollsData.map((poll) => {
    const totalVotes = poll.votes.length;
    const hasVoted = userId ? poll.votes.some((v) => v.userId === userId) : false;
    const userVote = userId ? poll.votes.find((v) => v.userId === userId)?.optionId : null;

    return {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      createdAt: poll.createdAt,
      totalVotes,
      hasVoted,
      userVote,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        votesCount: opt.votes.length,
      })),
    };
  });

  return buildPaginatedData(mappedData, total, page, limit);
};

export const findOnePoll = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
  userId?: string
) => {
  const poll = await db.query.polls.findFirst({
    where: eq(schema.polls.id, id),
    with: {
      options: {
        with: {
          votes: true,
        },
      },
      votes: true,
    },
  });

  if (!poll) return { data: null };

  const totalVotes = poll.votes.length;
  const hasVoted = userId ? poll.votes.some((v) => v.userId === userId) : false;
  const userVote = userId ? poll.votes.find((v) => v.userId === userId)?.optionId : null;

  const mappedData = {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    status: poll.status,
    createdAt: poll.createdAt,
    totalVotes,
    hasVoted,
    userVote,
    options: poll.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      votesCount: opt.votes.length,
    })),
  };

  return { data: mappedData };
};

export const updatePollStatus = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
  data: UpdatePollStatusInput
) => {
  const [result] = await db
    .update(schema.polls)
    .set({ status: data.status })
    .where(eq(schema.polls.id, id))
    .returning();

  return buildSingleData(result);
};

export const deletePoll = async (
  db: DrizzleD1Database<typeof schema>,
  id: string
) => {
  await db.delete(schema.polls).where(eq(schema.polls.id, id)).run();
  return { message: "Asamblea eliminada correctamente" };
};

export const voteOnPoll = async (
  db: DrizzleD1Database<typeof schema>,
  pollId: string,
  userId: string,
  data: VoteInput
) => {
  const poll = await db
    .select({ status: schema.polls.status })
    .from(schema.polls)
    .where(eq(schema.polls.id, pollId))
    .get();

  if (!poll) {
    throw new Error("La asamblea no existe");
  }

  if (poll.status !== "open") {
    throw new Error("La asamblea ya se encuentra cerrada");
  }

  try {
    await db.insert(schema.votes).values({
      pollId,
      userId,
      optionId: data.option_id,
    });
    return { message: "Voto registrado exitosamente" };
  } catch (error: any) {
    if (error.message && (error.message.includes("UNIQUE") || error.message.includes("constraint"))) {
      throw new Error("Ya has emitido tu voto en esta asamblea");
    }
    throw error;
  }
};