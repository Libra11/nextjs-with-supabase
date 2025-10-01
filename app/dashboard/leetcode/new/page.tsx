/**
 * Create New LeetCode Problem Page
 */
import { ProblemForm } from "@/components/leetcode/problem-form";

export default function NewProblemPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">新建 LeetCode 题目</h1>
      <ProblemForm mode="create" />
    </div>
  );
}
