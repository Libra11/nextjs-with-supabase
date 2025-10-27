"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, StepForward } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_MATRIX = "1,2,3\n4,5,6\n7,8,9";
const MAX_ROWS = 6;
const MAX_COLS = 6;

type Direction = "right" | "down" | "left" | "up";
type StepAction = "visit" | "shrink";

interface StepState {
  direction: Direction | null;
  action: StepAction;
  matrixSnapshot: number[][];
  top: number;
  bottom: number;
  left: number;
  right: number;
  currentRow: number | null;
  currentCol: number | null;
  resultSnapshot: number[];
  description: string;
}

interface StepLog {
  step: number;
  action: StepAction;
  description: string;
}

const DIRECTION_LABELS: Record<Direction, string> = {
  right: "向右遍历顶部行",
  down: "向下遍历右侧列",
  left: "向左遍历底部行",
  up: "向上遍历左侧列",
};

const ACTION_LABELS: Record<StepAction, string> = {
  visit: "访问元素",
  shrink: "收缩边界",
};

const parseMatrix = (input: string): number[][] | null => {
  const rows = input
    .split(/\n+/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (!rows.length) return [];

  const matrix: number[][] = [];
  for (const row of rows.slice(0, MAX_ROWS)) {
    const cols = row
      .split(/[,，\s]+/)
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (!cols.length) return null;

    if (matrix.length > 0 && cols.length !== matrix[0].length) {
      return null;
    }
    if (cols.length > MAX_COLS) {
      cols.length = MAX_COLS;
    }

    const parsedRow: number[] = [];
    for (const cell of cols) {
      const parsed = Number(cell);
      if (Number.isNaN(parsed)) {
        return null;
      }
      parsedRow.push(parsed);
    }
    matrix.push(parsedRow);
  }

  return matrix;
};

const cloneMatrix = (matrix: number[][]): number[][] =>
  matrix.map((row) => [...row]);

const formatMatrix = (matrix: number[][]): string =>
  matrix.map((row) => `[${row.join(", ")}]`).join(", ");

const buildSteps = (input: number[][]): StepState[] => {
  if (!input.length || !input[0]?.length) return [];

  const matrix = cloneMatrix(input);
  const rows = matrix.length;
  const cols = matrix[0].length;

  const steps: StepState[] = [];
  const result: number[] = [];

  let top = 0;
  let bottom = rows - 1;
  let left = 0;
  let right = cols - 1;

  const pushVisitStep = (
    direction: Direction,
    row: number,
    col: number,
    description: string,
  ) => {
    result.push(matrix[row][col]);
    steps.push({
      direction,
      action: "visit",
      matrixSnapshot: cloneMatrix(matrix),
      top,
      bottom,
      left,
      right,
      currentRow: row,
      currentCol: col,
      resultSnapshot: [...result],
      description,
    });
  };

  const pushShrinkStep = (
    description: string,
    direction: Direction,
  ) => {
    steps.push({
      direction,
      action: "shrink",
      matrixSnapshot: cloneMatrix(matrix),
      top,
      bottom,
      left,
      right,
      currentRow: null,
      currentCol: null,
      resultSnapshot: [...result],
      description,
    });
  };

  while (left <= right && top <= bottom) {
    for (let col = left; col <= right; col++) {
      pushVisitStep(
        "right",
        top,
        col,
        `访问顶部行元素 matrix[${top}][${col}] = ${matrix[top][col]}。`,
      );
    }
    top += 1;
    pushShrinkStep(`完成顶部行，top 边界收缩为 ${top}。`, "right");
    if (top > bottom) break;

    for (let row = top; row <= bottom; row++) {
      pushVisitStep(
        "down",
        row,
        right,
        `访问右侧列元素 matrix[${row}][${right}] = ${matrix[row][right]}。`,
      );
    }
    right -= 1;
    pushShrinkStep(`完成右侧列，right 边界收缩为 ${right}。`, "down");
    if (left > right) break;

    for (let col = right; col >= left; col--) {
      pushVisitStep(
        "left",
        bottom,
        col,
        `访问底部行元素 matrix[${bottom}][${col}] = ${matrix[bottom][col]}。`,
      );
    }
    bottom -= 1;
    pushShrinkStep(`完成底部行，bottom 边界收缩为 ${bottom}。`, "left");
    if (top > bottom) break;

    for (let row = bottom; row >= top; row--) {
      pushVisitStep(
        "up",
        row,
        left,
        `访问左侧列元素 matrix[${row}][${left}] = ${matrix[row][left]}。`,
      );
    }
    left += 1;
    pushShrinkStep(`完成左侧列，left 边界收缩为 ${left}。`, "up");
  }

  steps.push({
    direction: null,
    action: "shrink",
    matrixSnapshot: cloneMatrix(matrix),
    top,
    bottom,
    left,
    right,
    currentRow: null,
    currentCol: null,
    resultSnapshot: [...result],
    description: `遍历结束，螺旋序列为 [${result.join(", ")}]。`,
  });

  return steps;
};

export default function SpiralOrderAnimation() {
  const [matrixInput, setMatrixInput] = useState(DEFAULT_MATRIX);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  const [matrix, setMatrix] = useState<number[][]>([]);
  const [steps, setSteps] = useState<StepState[]>([]);

  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepState | null>(null);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const processedStepRef = useRef(-1);

  const initialize = useCallback((values: number[][], autoplay = false) => {
    setMatrix(values);
    const generatedSteps = buildSteps(values);
    setSteps(generatedSteps);
    setStepIndex(0);
    setIsPlaying(autoplay && generatedSteps.length > 0);
    setCurrentStep(null);
    setLogs([]);
    processedStepRef.current = -1;
  }, []);

  useEffect(() => {
    const defaults = parseMatrix(DEFAULT_MATRIX) ?? [];
    initialize(defaults);
  }, [initialize]);

  const activeSteps = steps;
  const displayedStep =
    currentStep ?? (activeSteps.length ? activeSteps[0] : null);

  const nextStep = useCallback(() => {
    if (!activeSteps.length) return;

    setStepIndex((prev) => {
      if (prev >= activeSteps.length) {
        setIsPlaying(false);
        return prev;
      }

      const alreadyProcessed = processedStepRef.current === prev;
      const nextIdx = prev + 1;

      if (!alreadyProcessed) {
        processedStepRef.current = prev;
        const step = activeSteps[prev];
        setCurrentStep(step);
        setLogs((prevLogs) => {
          const nextLogs = [
            ...prevLogs,
            {
              step: prev + 1,
              action: step.action,
              description: step.description,
            },
          ];
          return nextLogs.slice(-18);
        });
      }

      if (nextIdx >= activeSteps.length) {
        setIsPlaying(false);
      }

      return nextIdx;
    });
  }, [activeSteps]);

  useEffect(() => {
    if (!isPlaying) return;
    if (!activeSteps.length) {
      setIsPlaying(false);
      return;
    }
    if (stepIndex >= activeSteps.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      nextStep();
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, activeSteps.length, nextStep]);

  const togglePlay = () => {
    if (!activeSteps.length) return;
    const finished = stepIndex >= activeSteps.length;

    if (finished) {
      setStepIndex(0);
      setIsPlaying(true);
      setCurrentStep(null);
      setLogs([]);
      processedStepRef.current = -1;
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  const resetPlayback = () => {
    setStepIndex(0);
    setIsPlaying(false);
    setCurrentStep(null);
    setLogs([]);
    processedStepRef.current = -1;
  };

  const progress = useMemo(() => {
    if (!activeSteps.length) return 0;
    return Math.min(stepIndex / activeSteps.length, 1);
  }, [stepIndex, activeSteps.length]);

  const isComplete =
    activeSteps.length > 0 && stepIndex >= activeSteps.length;

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseMatrix(matrixInput);

    if (parsed === null || parsed.length === 0 || parsed[0]?.length === 0) {
      setMatrixError(
        "请输入有效的矩阵，例如：1,2,3\\n4,5,6\\n7,8,9。确保每行列数一致。"
      );
      return;
    }

    setMatrixError(null);
    initialize(parsed);
  };

  const handleUseDefault = () => {
    setMatrixInput(DEFAULT_MATRIX);
    setMatrixError(null);
    const defaults = parseMatrix(DEFAULT_MATRIX) ?? [];
    initialize(defaults);
  };

  const matrixSnapshot =
    displayedStep?.matrixSnapshot ??
    (matrix.length ? cloneMatrix(matrix) : []);

  const highlightRow = displayedStep?.currentRow ?? null;
  const highlightCol = displayedStep?.currentCol ?? null;
  const resultSnapshot = displayedStep?.resultSnapshot ?? [];
  const directionLabel = displayedStep?.direction
    ? DIRECTION_LABELS[displayedStep.direction]
    : null;

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/60 to-muted/20 p-6">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">自定义矩阵</h3>
            <form className="space-y-4" onSubmit={handleApply}>
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  输入矩阵
                </label>
                <Textarea
                  value={matrixInput}
                  onChange={(event) => {
                    setMatrixInput(event.target.value);
                    setMatrixError(null);
                  }}
                  placeholder={"示例：\n1,2,3\n4,5,6\n7,8,9"}
                  className="min-h-[120px] font-mono whitespace-pre"
                />
                <p className="text-xs text-muted-foreground">
                  使用换行分隔行，逗号或空格分隔列，最多 {MAX_ROWS}×
                  {MAX_COLS}。
                </p>
                {matrixError && (
                  <p className="text-xs text-destructive">{matrixError}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="flex items-center gap-2">
                  应用矩阵
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseDefault}
                >
                  使用默认示例
                </Button>
              </div>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              当前矩阵：{matrixSnapshot.length ? formatMatrix(matrixSnapshot) : "空"}
            </p>
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  {directionLabel ?? "螺旋遍历"}
                </span>
                <span className="text-xs text-muted-foreground">
                  步骤 {Math.min(stepIndex + 1, activeSteps.length || 1)} /{" "}
                  {activeSteps.length || 1}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={togglePlay}
                  disabled={!activeSteps.length}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      暂停
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      {isComplete ? "重新播放" : "播放"}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => nextStep()}
                  variant="outline"
                  disabled={isPlaying || !activeSteps.length || isComplete}
                  className="flex items-center gap-2"
                >
                  <StepForward className="h-4 w-4" />
                  单步
                </Button>
                <Button
                  onClick={resetPlayback}
                  type="button"
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  重置
                </Button>
              </div>

              <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                ></div>
              </div>

              <AnimatePresence mode="wait">
                {displayedStep ? (
                  <motion.div
                    key={`${displayedStep.direction ?? "done"}-${displayedStep.action}-${stepIndex}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-primary text-sm"
                  >
                    <div className="text-xs uppercase tracking-wide">
                      {ACTION_LABELS[displayedStep.action]}
                    </div>
                    <p className="text-primary/90">{displayedStep.description}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="rounded-lg border border-muted px-3 py-2 text-muted-foreground text-sm"
                  >
                    点击播放或单步执行，查看螺旋遍历过程。
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background/80 p-6 shadow-sm">
          <div
            className="grid gap-2 justify-center"
            style={{
              gridTemplateColumns: `repeat(${matrixSnapshot[0]?.length ?? 0}, minmax(0, 1fr))`,
            }}
          >
            {matrixSnapshot.flatMap((row, rowIndex) =>
              row.map((value, colIndex) => {
                const isCurrent =
                  highlightRow === rowIndex && highlightCol === colIndex;
                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}-${stepIndex}`}
                    layout
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-lg border-2 text-lg font-semibold transition-all duration-200",
                      isCurrent
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-muted bg-muted/30 text-foreground"
                    )}
                  >
                    {value}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">状态速览</h4>
            {displayedStep ? (
              <div className="grid gap-3 text-sm">
                <div className="rounded-lg border px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    当前边界
                  </div>
                  <div className="font-semibold">
                    top={displayedStep.top}, bottom={displayedStep.bottom}, left=
                    {displayedStep.left}, right={displayedStep.right}
                  </div>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    螺旋路径
                  </div>
                  <div className="font-semibold">
                    [{displayedStep.resultSnapshot.join(", ")}]
                  </div>
                </div>
                {displayedStep.currentRow != null &&
                  displayedStep.currentCol != null && (
                    <div className="rounded-lg border px-3 py-2">
                      <div className="text-xs text-muted-foreground">
                        当前元素
                      </div>
                      <div className="font-semibold">
                        matrix[{displayedStep.currentRow}][
                        {displayedStep.currentCol}] ={" "}
                        {
                          displayedStep.matrixSnapshot[
                            displayedStep.currentRow
                          ][displayedStep.currentCol]
                        }
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                点击播放或单步执行，查看边界变化。
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">执行日志</h4>
            <div className="h-56 overflow-auto rounded-lg bg-muted/20 p-3">
              {logs.length ? (
                <ul className="space-y-2 text-xs leading-relaxed">
                  {logs.map((log) => (
                    <li key={log.step} className="rounded-md bg-background/70 p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">
                          步骤 {log.step}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {ACTION_LABELS[log.action]}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {log.description}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  暂无日志
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

