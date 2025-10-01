/**
 * LeetCode Problem Types
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type ProblemStatus = 'published' | 'draft';

export interface LeetCodeProblem {
  id: number;
  title: string;
  difficulty: Difficulty;
  description: string;
  solution: string | null;
  code: string | null;
  tags: string[];
  leetcode_id: number | null;
  animation_component: string | null;
  status: ProblemStatus;
  time_complexity: string | null;
  space_complexity: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeetCodeProblemInput {
  title: string;
  difficulty: Difficulty;
  description: string;
  solution?: string;
  code?: string;
  tags?: string[];
  leetcode_id?: number;
  animation_component?: string;
  status?: ProblemStatus;
  time_complexity?: string;
  space_complexity?: string;
}

export interface UpdateLeetCodeProblemInput {
  title?: string;
  difficulty?: Difficulty;
  description?: string;
  solution?: string;
  code?: string;
  tags?: string[];
  leetcode_id?: number;
  animation_component?: string;
  status?: ProblemStatus;
  time_complexity?: string;
  space_complexity?: string;
}

export interface GetProblemsOptions {
  page?: number;
  pageSize?: number;
  difficulty?: Difficulty;
  tags?: string[];
  status?: ProblemStatus;
  search?: string;
}

export interface ProblemsResponse {
  problems: LeetCodeProblem[];
  count: number;
}
