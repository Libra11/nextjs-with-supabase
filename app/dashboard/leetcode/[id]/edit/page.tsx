/**
 * Edit LeetCode Problem Page
 */
import { getProblemById } from "@/lib/leetcode";
import { ProblemForm } from "@/components/leetcode/problem-form";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProblemPage({ params }: PageProps) {
  const { id } = await params;
  const problemId = parseInt(id);

  if (isNaN(problemId)) {
    notFound();
  }

  const problem = await getProblemById(problemId);

  if (!problem) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">编辑 LeetCode 题目</h1>
      <ProblemForm mode="edit" initialData={problem} />
    </div>
  );
}
