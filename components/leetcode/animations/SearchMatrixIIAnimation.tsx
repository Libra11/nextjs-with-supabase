"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, StepForward, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type StepDecision = "less" | "greater" | "found" | "done" | "empty";

interface StepDetail {
  index: number;
  row: number | null;
  col: number | null;
  value: number | null;
  decision: StepDecision;
  description: string;
  visitedCells: Array<{ row: number; col: number }>;
}

const DEFAULT_MATRIX: number[][] = [
  [1, 4, 7, 11, 15],
  [2, 5, 8, 12, 19],
  [3, 6, 9, 16, 22],
  [10, 13, 14, 17, 24],
  [18, 21, 23, 26, 30],
];

const DEFAULT_TARGET = 5;
const DEFAULT_MATRIX_INPUT = DEFAULT_MATRIX.map((row) => row.join(", ")).join("\n");
const MAX_ROWS = 8;
const MAX_COLS = 8;
const STEP_INTERVAL = 1500;

const DECISION_LABEL: Record<StepDecision, string> = {
  less: "向下移动",
  greater: "向左移动",
  found: "找到目标",
  done: "遍历结束",
  empty: "无有效矩阵",
};

const parseMatrixInput = (input: string): number[][] => {
  const lines = input
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("请输入至少一行矩阵数据。");
  }

  if (lines.length > MAX_ROWS) {
    throw new Error(`矩阵行数不能超过 ${MAX_ROWS} 行。`);
  }

  const matrix = lines.map((line, rowIndex) => {
    const segments = line
      .split(/[\s,，]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (!segments.length) {
      throw new Error(`第 ${rowIndex + 1} 行为空，请补充数字。`);
    }

    if (segments.length > MAX_COLS) {
      throw new Error(`第 ${rowIndex + 1} 行的列数超过 ${MAX_COLS} 列限制。`);
    }

    const numbers = segments.map((segment) => {
      const value = Number(segment);
      if (Number.isNaN(value)) {
        throw new Error(`第 ${rowIndex + 1} 行包含无效数字 "${segment}"。`);
      }
      return value;
    });

    return numbers;
  });

  const columnLength = matrix[0].length;
  matrix.forEach((row, idx) => {
    if (row.length !== columnLength) {
      throw new Error(`第 ${idx + 1} 行的列数 ${row.length} 与第一行 ${columnLength} 不一致。`);
    }
  });

  return matrix;
};

const buildSteps = (matrix: number[][], target: number): StepDetail[] => {
  if (!matrix.length || !matrix[0]?.length) {
    return [
      {
        index: 1,
        row: null,
        col: null,
        value: null,
        decision: "empty",
        description: "矩阵为空，无法执行搜索。",
        visitedCells: [],
      },
    ];
  }

  const steps: StepDetail[] = [];
  const visited: Array<{ row: number; col: number }> = [];
  const rowCount = matrix.length;
  const colCount = matrix[0].length;
  let row = 0;
  let col = colCount - 1;
  let lastRow: number | null = null;
  let lastCol: number | null = null;

  while (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
    lastRow = row;
    lastCol = col;
    const value = matrix[row][col];
    visited.push({ row, col });

    if (value === target) {
      steps.push({
        index: steps.length + 1,
        row,
        col,
        value,
        decision: "found",
        description: `在位置 (${row}, ${col}) 找到了目标值 ${target}，搜索结束。`,
        visitedCells: [...visited],
      });
      return steps;
    }

    if (value > target) {
      steps.push({
        index: steps.length + 1,
        row,
        col,
        value,
        decision: "greater",
        description: `当前位置 (${row}, ${col}) 的值 ${value} 大于目标 ${target}，向左移动到列 ${col - 1}。`,
        visitedCells: [...visited],
      });
      col -= 1;
    } else {
      steps.push({
        index: steps.length + 1,
        row,
        col,
        value,
        decision: "less",
        description: `当前位置 (${row}, ${col}) 的值 ${value} 小于目标 ${target}，向下移动到行 ${row + 1}。`,
        visitedCells: [...visited],
      });
      row += 1;
    }
  }

  steps.push({
    index: steps.length + 1,
    row: lastRow,
    col: lastCol,
    value: lastRow !== null && lastCol !== null ? matrix[lastRow][lastCol] : null,
    decision: "done",
    description: `指针已越界 (row=${row}, col=${col})，遍历结束且未找到目标值 ${target}。`,
    visitedCells: [...visited],
  });

  return steps;
};

const matrixToInput = (matrix: number[][]) =>
  matrix.map((row) => row.join(", ")).join("\n");

export default function SearchMatrixIIAnimation() {
  const [matrix, setMatrix] = useState<number[][]>([...DEFAULT_MATRIX]);
  const [target, setTarget] = useState<number>(DEFAULT_TARGET);
  const [matrixInput, setMatrixInput] = useState<string>(DEFAULT_MATRIX_INPUT);
  const [targetInput, setTargetInput] = useState<string>(String(DEFAULT_TARGET));
  const [steps, setSteps] = useState<StepDetail[]>(() =>
    buildSteps(DEFAULT_MATRIX, DEFAULT_TARGET)
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, STEP_INTERVAL);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, steps.length]);

  const currentStep = steps[stepIndex] ?? null;

  const visitedSet = useMemo(() => {
    if (!currentStep) {
      return new Set<string>();
    }

    return new Set(
      currentStep.visitedCells.map(({ row, col }) => `${row}-${col}`)
    );
  }, [currentStep]);

  const progress = useMemo(() => {
    if (!steps.length) return 0;
    if (steps.length === 1) return stepIndex >= steps.length - 1 ? 1 : 0;
    return stepIndex / (steps.length - 1);
  }, [stepIndex, steps.length]);

  const columnCount = useMemo(() => {
    return matrix.reduce(
      (max, row) => Math.max(max, row.length),
      matrix[0]?.length || 0
    );
  }, [matrix]);

  const applyParsedData = (grid: number[][], newTarget: number) => {
    setMatrix(grid);
    setTarget(newTarget);
    const nextSteps = buildSteps(grid, newTarget);
    setSteps(nextSteps);
    setStepIndex(0);
    setIsPlaying(false);
    setMatrixInput(matrixToInput(grid));
    setTargetInput(String(newTarget));
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (stepIndex >= steps.length - 1) {
      setStepIndex(0);
    }

    setIsPlaying(true);
  };

  const handleReset = () => {
    setStepIndex(0);
    setIsPlaying(false);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleApplyInputs = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPlaying(false);

    try {
      const parsedMatrix = parseMatrixInput(matrixInput);
      const trimmedTarget = targetInput.trim();
      if (!trimmedTarget) {
        throw new Error("请输入目标值。");
      }

      const parsedTarget = Number(trimmedTarget);
      if (Number.isNaN(parsedTarget)) {
        throw new Error("目标值必须是数字。");
      }

      applyParsedData(parsedMatrix, parsedTarget);
      setInputError(null);
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message);
      } else {
        setInputError("输入解析失败，请检查格式。");
      }
    }
  };

  const handleRestoreDefaults = () => {
    applyParsedData([...DEFAULT_MATRIX.map((row) => [...row])], DEFAULT_TARGET);
    setInputError(null);
  };

  const hasMatrix = matrix.length > 0 && columnCount > 0;

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">搜索二维矩阵 II - 指针移动演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          从右上角出发，根据比较结果决定向左还是向下移动，直至找到目标或越界。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(m + n) · 空间复杂度 O(1)</span>
          {currentStep && (
            <span>
              步骤 {currentStep.index} / {steps.length}
            </span>
          )}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 flex-grow">
        <div className="bg-card/80 border border-border/60 rounded-xl p-5 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-foreground">
                <Target className="w-4 h-4 text-primary" />
                <span>
                  目标值: <span className="font-semibold">{target}</span>
                </span>
              </div>
              {currentStep && currentStep.row !== null && currentStep.col !== null && (
                <span className="text-muted-foreground">
                  当前指针 → row {currentStep.row}, col {currentStep.col}, 值{" "}
                  <span className="font-medium text-foreground">
                    {currentStep.value}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="block w-3 h-3 rounded-sm bg-primary/20 border border-primary/50" />
                当前指针
              </span>
              <span className="flex items-center gap-1">
                <span className="block w-3 h-3 rounded-sm bg-primary/10 border border-primary/30" />
                已访问
              </span>
              <span className="flex items-center gap-1">
                <span className="block w-3 h-3 rounded-sm bg-muted border border-border/70" />
                未访问
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {hasMatrix ? (
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${columnCount}, minmax(0, 70px))`,
                }}
              >
                {matrix.map((rowValues, rowIndex) =>
                  rowValues.map((value, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const isCurrent =
                      currentStep &&
                      currentStep.row === rowIndex &&
                      currentStep.col === colIndex &&
                      currentStep.decision !== "empty";
                    const isFound =
                      isCurrent && currentStep?.decision === "found";
                    const isVisited = visitedSet.has(key);

                    return (
                      <motion.div
                        key={key}
                        className={cn(
                          "relative flex items-center justify-center aspect-square min-w-[60px] rounded-lg border-2 text-lg font-semibold transition-all duration-300",
                          isFound
                            ? "bg-emerald-500/25 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/20"
                            : isCurrent
                              ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20"
                              : isVisited
                                ? "bg-primary/10 border-primary/40 text-primary"
                                : "bg-muted border-border/60 text-foreground"
                        )}
                        layout
                      >
                        {value}
                        <AnimatePresence>
                          {isCurrent && (
                            <motion.span
                              key="cursor"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              className="absolute -top-6 text-[10px] font-medium px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary shadow-sm"
                            >
                              指针
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <span className="absolute -bottom-5 text-[10px] text-muted-foreground">
                          ({rowIndex}, {colIndex})
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="w-full text-center text-sm text-muted-foreground">
                暂无有效矩阵，请在右侧输入区域提供数据。
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePlayToggle}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    暂停
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    播放
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                disabled={stepIndex >= steps.length - 1}
                className="flex items-center gap-2"
              >
                <StepForward className="w-4 h-4" />
                下一步
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              {currentStep ? DECISION_LABEL[currentStep.decision] : "等待输入"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card/80 border border-border/60 rounded-xl p-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              当前推理
            </p>
            {currentStep ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-primary">
                    {DECISION_LABEL[currentStep.decision]}
                  </span>
                  {currentStep.row !== null && currentStep.col !== null ? (
                    <span className="text-sm text-foreground">
                      matrix[{currentStep.row}][{currentStep.col}] ={" "}
                      <span className="font-semibold">{currentStep.value}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-foreground">
                      无有效指针位置
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {currentStep.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                等待计算步骤，输入矩阵后点击应用即可开始演示。
              </p>
            )}
          </div>

          <div className="bg-card/80 border border-border/60 rounded-xl p-4 flex-1">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              关键步骤记录
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {steps
                  .slice(0, stepIndex + 1)
                  .map(({ index, description, decision }) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="border border-border/60 bg-background/80 rounded-lg px-3 py-2 text-sm"
                    >
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        步骤 {index} · {DECISION_LABEL[decision]}
                      </p>
                      <p className="text-sm text-foreground">{description}</p>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-card/80 border border-border/60 rounded-xl p-4">
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              自定义数据
            </p>
            <form onSubmit={handleApplyInputs} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  矩阵（每行一行，支持逗号或空格分隔）
                </label>
                <Textarea
                  value={matrixInput}
                  onChange={(event) => setMatrixInput(event.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                  placeholder="示例：1, 4, 7&#10;2, 5, 8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  目标值
                </label>
                <Input
                  value={targetInput}
                  onChange={(event) => setTargetInput(event.target.value)}
                  placeholder="例如：5"
                />
              </div>
              {inputError && (
                <p className="text-xs text-destructive">{inputError}</p>
              )}
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  应用数据
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRestoreDefaults}
                >
                  恢复默认
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
