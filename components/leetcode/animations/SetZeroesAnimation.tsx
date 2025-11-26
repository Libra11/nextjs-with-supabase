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

const DEFAULT_MATRIX = "1,1,1\n1,0,1\n1,1,1";
const MAX_ROWS = 6;
const MAX_COLS = 6;

type Stage =
  | "inspect-first"
  | "mark-first"
  | "propagate"
  | "zero-internal"
  | "zero-first"
  | "final";

type StepAction =
  | "scan-row"
  | "scan-col"
  | "mark"
  | "inspect-cell"
  | "zero-cell"
  | "zero-first-row"
  | "zero-first-col"
  | "finish";

interface StepState {
  stage: Stage;
  action: StepAction;
  matrixSnapshot: number[][];
  row: number | null;
  col: number | null;
  firstRowHasZero: boolean;
  firstColHasZero: boolean;
  description: string;
  highlightRow?: number | null;
  highlightCol?: number | null;
}

interface StepLog {
  step: number;
  action: StepAction;
  description: string;
}

const ACTION_LABELS: Record<StepAction, string> = {
  "scan-row": "检查第一行",
  "scan-col": "检查第一列",
  mark: "标记行列",
  "inspect-cell": "检查单元",
  "zero-cell": "置零单元",
  "zero-first-row": "置零第一行",
  "zero-first-col": "置零第一列",
  finish: "完成",
};

const STAGE_LABELS: Record<Stage, string> = {
  "inspect-first": "检查首行首列",
  "mark-first": "标记阶段",
  propagate: "标记传播",
  "zero-internal": "置零内部",
  "zero-first": "置零首行首列",
  final: "结果",
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

  let firstRowHasZero = false;
  let firstColHasZero = false;

  for (let col = 0; col < cols; col++) {
    const cell = matrix[0][col];
    steps.push({
      stage: "inspect-first",
      action: "scan-row",
      matrixSnapshot: cloneMatrix(matrix),
      row: 0,
      col,
      firstRowHasZero,
      firstColHasZero,
      description:
        cell === 0
          ? `第一行第 ${col} 列存在 0，记录 firstRowHasZero = true。`
          : `第一行第 ${col} 列不是 0，继续遍历。`,
      highlightRow: 0,
      highlightCol: col,
    });

    if (cell === 0) {
      firstRowHasZero = true;
    }
  }

  for (let row = 0; row < rows; row++) {
    const cell = matrix[row][0];
    steps.push({
      stage: "inspect-first",
      action: "scan-col",
      matrixSnapshot: cloneMatrix(matrix),
      row,
      col: 0,
      firstRowHasZero,
      firstColHasZero,
      description:
        cell === 0
          ? `第一列第 ${row} 行存在 0，记录 firstColHasZero = true。`
          : `第一列第 ${row} 行不是 0，继续遍历。`,
      highlightRow: row,
      highlightCol: 0,
    });

    if (cell === 0) {
      firstColHasZero = true;
    }
  }

  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      const cell = matrix[row][col];
      steps.push({
        stage: "propagate",
        action: "inspect-cell",
        matrixSnapshot: cloneMatrix(matrix),
        row,
        col,
        firstRowHasZero,
        firstColHasZero,
        description:
          cell === 0
            ? `元素 ( ${row}, ${col} ) 为 0，标记所在行列：matrix[${row}][0] 和 matrix[0][${col}] 置 0。`
            : `元素 ( ${row}, ${col} ) 非 0，无需标记。`,
        highlightRow: row,
        highlightCol: col,
      });

      if (cell === 0) {
        matrix[row][0] = 0;
        matrix[0][col] = 0;

        steps.push({
          stage: "mark-first",
          action: "mark",
          matrixSnapshot: cloneMatrix(matrix),
          row,
          col,
          firstRowHasZero,
          firstColHasZero,
          description: `更新标记行列：matrix[${row}][0] 和 matrix[0][${col}] 已置 0。`,
          highlightRow: row,
          highlightCol: col,
        });
      }
    }
  }

  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      const shouldZero = matrix[row][0] === 0 || matrix[0][col] === 0;

      steps.push({
        stage: "zero-internal",
        action: shouldZero ? "zero-cell" : "inspect-cell",
        matrixSnapshot: cloneMatrix(matrix),
        row,
        col,
        firstRowHasZero,
        firstColHasZero,
        description: shouldZero
          ? `标记显示第 ${row} 行或第 ${col} 列需置零，将元素 ( ${row}, ${col} ) 置 0。`
          : `标记显示行列均保持原值，元素 ( ${row}, ${col} ) 保持 ${matrix[row][col]}。`,
        highlightRow: row,
        highlightCol: col,
      });

      if (shouldZero) {
        matrix[row][col] = 0;
      }
    }
  }

  if (firstRowHasZero) {
    for (let col = 0; col < cols; col++) {
      steps.push({
        stage: "zero-first",
        action: "zero-first-row",
        matrixSnapshot: cloneMatrix(matrix),
        row: 0,
        col,
        firstRowHasZero,
        firstColHasZero,
        description: `firstRowHasZero 为真，将第一行第 ${col} 列置 0。`,
        highlightRow: 0,
        highlightCol: col,
      });
      matrix[0][col] = 0;
    }
  }

  if (firstColHasZero) {
    for (let row = 0; row < rows; row++) {
      steps.push({
        stage: "zero-first",
        action: "zero-first-col",
        matrixSnapshot: cloneMatrix(matrix),
        row,
        col: 0,
        firstRowHasZero,
        firstColHasZero,
        description: `firstColHasZero 为真，将第一列第 ${row} 行置 0。`,
        highlightRow: row,
        highlightCol: 0,
      });
      matrix[row][0] = 0;
    }
  }

  steps.push({
    stage: "final",
    action: "finish",
    matrixSnapshot: cloneMatrix(matrix),
    row: null,
    col: null,
    firstRowHasZero,
    firstColHasZero,
    description: `算法结束，矩阵结果：${formatMatrix(matrix)}。`,
  });

  return steps;
};

export default function SetZeroesAnimation() {
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
    }, 1400);

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
        "请输入有效的矩阵，例如：1,1,1\\n1,0,1\\n1,1,1。确保每行列数一致。"
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

  const highlightRow = displayedStep?.highlightRow ?? null;
  const highlightCol = displayedStep?.highlightCol ?? null;

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
                  placeholder={"示例：\n1,1,1\n1,0,1\n1,1,1"}
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
                  {displayedStep
                    ? STAGE_LABELS[displayedStep.stage]
                    : "准备阶段"}
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
                    key={`${displayedStep.stage}-${displayedStep.action}-${stepIndex}`}
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
                    点击播放或单步执行，查看原地标记与置零的过程。
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background/80 p-6 shadow-sm">
          <div
            className={cn(
              "grid gap-2 justify-center"
            )}
            style={{
              gridTemplateColumns: `repeat(${matrixSnapshot[0]?.length ?? 0}, minmax(0, 1fr))`,
            }}
          >
            {matrixSnapshot.flatMap((row, rowIndex) =>
              row.map((value, colIndex) => {
                const isHighlight =
                  (highlightRow === rowIndex && highlightCol === colIndex) ||
                  (highlightRow === rowIndex && highlightCol === null) ||
                  (highlightCol === colIndex && highlightRow === null);

                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}-${stepIndex}`}
                    layout
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-lg border-2 text-lg font-semibold transition-all duration-200",
                      isHighlight
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
                {displayedStep.row != null && displayedStep.col != null && (
                  <div className="rounded-lg border px-3 py-2">
                    <div className="text-xs text-muted-foreground">
                      当前单元
                    </div>
                    <div className="font-semibold">
                      ( {displayedStep.row}, {displayedStep.col} )
                    </div>
                  </div>
                )}
                <div className="rounded-lg border px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    firstRowHasZero
                  </div>
                  <div className="font-semibold">
                    {displayedStep.firstRowHasZero ? "true" : "false"}
                  </div>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    firstColHasZero
                  </div>
                  <div className="font-semibold">
                    {displayedStep.firstColHasZero ? "true" : "false"}
                  </div>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    当前矩阵
                  </div>
                  <div className="font-semibold">
                    {formatMatrix(displayedStep.matrixSnapshot)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                点击播放或单步执行，查看算法状态。
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
