/**
 * LeetCode API Functions
 */
import { createClient } from "@/utils/supabase/client";
import {
  LeetCodeProblem,
  CreateLeetCodeProblemInput,
  UpdateLeetCodeProblemInput,
  GetProblemsOptions,
  ProblemsResponse,
} from "@/types/leetcode";

const supabase = createClient();

/**
 * Get problems with pagination and filters
 */
export async function getProblems(
  options: GetProblemsOptions = {}
): Promise<ProblemsResponse> {
  const {
    page = 1,
    pageSize = 10,
    difficulty,
    tags,
    status = "published",
    search,
  } = options;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leetcode_problems")
    .select("*", { count: "exact" });

  // Apply filters
  if (status) {
    query = query.eq("status", status);
  }

  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  if (tags && tags.length > 0) {
    query = query.contains("tags", tags);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching problems:", error);
    throw error;
  }

  return {
    problems: (data as LeetCodeProblem[]) || [],
    count: count || 0,
  };
}

/**
 * Get a single problem by ID
 */
export async function getProblemById(
  id: number
): Promise<LeetCodeProblem | null> {
  const { data, error } = await supabase
    .from("leetcode_problems")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching problem:", error);
    throw error;
  }

  return data as LeetCodeProblem;
}

/**
 * Create a new problem
 */
export async function createProblem(
  input: CreateLeetCodeProblemInput
): Promise<LeetCodeProblem> {
  const { data, error } = await supabase
    .from("leetcode_problems")
    .insert([input])
    .select()
    .single();

  if (error) {
    console.error("Error creating problem:", error);
    throw error;
  }

  return data as LeetCodeProblem;
}

/**
 * Update an existing problem
 */
export async function updateProblem(
  id: number,
  input: UpdateLeetCodeProblemInput
): Promise<LeetCodeProblem> {
  const { data, error } = await supabase
    .from("leetcode_problems")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating problem:", error);
    throw error;
  }

  return data as LeetCodeProblem;
}

/**
 * Delete a problem
 */
export async function deleteProblem(id: number): Promise<void> {
  const { error } = await supabase
    .from("leetcode_problems")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting problem:", error);
    throw error;
  }
}

/**
 * Get all unique tags from problems
 */
export async function getAllTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from("leetcode_problems")
    .select("tags")
    .eq("status", "published");

  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }

  const tagsSet = new Set<string>();
  data.forEach((problem) => {
    if (problem.tags) {
      problem.tags.forEach((tag: string) => tagsSet.add(tag));
    }
  });

  return Array.from(tagsSet).sort();
}

/**
 * Search problems for admin
 */
export async function searchProblemsAdmin(
  keyword: string,
  options: GetProblemsOptions = {}
): Promise<ProblemsResponse> {
  const { page = 1, pageSize = 10, difficulty, tags, status } = options;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leetcode_problems")
    .select("*", { count: "exact" });

  // Apply filters
  if (status) {
    query = query.eq("status", status);
  }

  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  if (tags && tags.length > 0) {
    query = query.contains("tags", tags);
  }

  if (keyword) {
    query = query.or(
      `title.ilike.%${keyword}%,description.ilike.%${keyword}%,solution.ilike.%${keyword}%`
    );
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error searching problems:", error);
    throw error;
  }

  return {
    problems: (data as LeetCodeProblem[]) || [],
    count: count || 0,
  };
}
