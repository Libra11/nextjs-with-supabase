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
const MAX_SIZE = 6;

type Stage = "transpose" | "reverse" | "final";
type StepAction =
  | "inspect-pair"
  | "swap-pair"
  | "reverse-inspect"
  | "reverse-swap"
  | "finish";

interface StepState {
  stage: Stage;
  action: StepAction;
  matrixSnapshot: number[][];
  i: number | null;
  j: number | null;
  pair: { row: number; col: number } | null;
  pairTarget: { row: number; col: number } | null;
  description: string;
}

interface StepLog {
  step: number;
  action: StepAction;
  description: string;
}

const ACTION_LABELS: Record<StepAction, string> = {
  "inspect-pair": "检查对称单元",
  "swap-pair": "转置交换",
  "reverse-inspect": "检查行内对称",
  "reverse-swap": "水平交换",
  finish: "完成",
};

const STAGE_LABELS: Record<Stage, string> = {
  transpose: "步骤一：转置矩阵",
  reverse: "步骤二：水平翻转",
  final: "旋转完成",
};

const parseMatrix = (input: string): number[][] | null => {
  const rows = input
    .split(/\n+/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (!rows.length) return [];

  const matrix: number[][] = [];
  for (const row of rows.slice(0, MAX_SIZE)) {
    const cols = row
      .split(/[,，\s]+/)
      .map((cell) => cell.trim())
      .filter(Boolean);

    if (!cols.length) return null;

    if (matrix.length > 0 && cols.length !== matrix[0].length) {
      return null;
    }

    if (cols.length > MAX_SIZE) {
      cols.length = MAX_SIZE;
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

  if (matrix.length !== matrix[0]?.length) {
    return null;
  }

  return matrix;
};

const cloneMatrix = (matrix: number[][]): number[][] =>
  matrix.map((row) => [...row]);

const formatMatrix = (matrix: number[][]): string =>
  matrix.map((row) => `[${row.join(", ")}]`).join(", ");

const buildSteps = (input: number[][]): StepState[] => {
  if (!input.length) return [];

  const matrix = cloneMatrix(input);
  const n = matrix.length;
  const steps: StepState[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const pair = { row: i, col: j };
      const target = { row: j, col: i };
      const sameCell = i === j;

      steps.push({
        stage: "transpose",
        action: "inspect-pair",
        matrixSnapshot: cloneMatrix(matrix),
        i,
        j,
        pair,
        pairTarget: target,
        description: sameCell
          ? `检查对角线元素 (${i}, ${j})，保持不动。`
          : `检查对称元素 (${i}, ${j}) 与 (${j}, ${i})，准备交换。`,
      });

      if (!sameCell) {
        const swapped = cloneMatrix(matrix);
        [swapped[i][j], swapped[j][i]] = [swapped[j][i], swapped[i][j]];
        matrix[i][j] = swapped[i][j];
        matrix[j][i] = swapped[j][i];

        steps.push({
          stage: "transpose",
          action: "swap-pair",
          matrixSnapshot: swapped,
          i,
          j,
          pair,
          pairTarget: target,
          description: `交换 (${i}, ${j}) ↔ (${j}, ${i})，矩阵更新为 ${formatMatrix(
            swapped,
          )}。`,
        });
      }
    }
  }

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < Math.floor(n / 2); col++) {
      const opposite = n - 1 - col;
      const pair = { row, col };
      const target = { row, col: opposite };

      steps.push({
        stage: "reverse",
        action: "reverse-inspect",
        matrixSnapshot: cloneMatrix(matrix),
        i: row,
        j: col,
        pair,
        pairTarget: target,
        description: `检查行 ${row} 中的元素 (${row}, ${col}) 与 (${row}, ${opposite})，准备交换。`,
      });

      const swapped = cloneMatrix(matrix);
      [swapped[row][col], swapped[row][opposite]] = [
        swapped[row][opposite],
        swapped[row][col],
      ];
      matrix[row][col] = swapped[row][col];
      matrix[row][opposite] = swapped[row][opposite];

      steps.push({
        stage: "reverse",
        action: "reverse-swap",
        matrixSnapshot: swapped,
        i: row,
        j: col,
        pair,
        pairTarget: target,
        description: `交换 (${row}, ${col}) ↔ (${row}, ${opposite})，矩阵更新为 ${formatMatrix(
          swapped,
        )}。`,
      });
    }
  }

  steps.push({
    stage: "final",
    action: "finish",
    matrixSnapshot: cloneMatrix(matrix),
    i: null,
    j: null,
    pair: null,
    pairTarget: null,
    description: `旋转完成，结果矩阵：${formatMatrix(matrix)}。`,
  });

  return steps;
};

export default function RotateImageAnimation() {
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

    if (
      parsed === null ||
      parsed.length === 0 ||
      parsed[0]?.length === 0 ||
      parsed.length !== parsed[0]?.length
    ) {
      setMatrixError(
        "请输入有效的方阵，例如：1,2,3\\n4,5,6\\n7,8,9。确保行列数相同且不超过 6。"
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

  const highlightOne = displayedStep?.pair ?? null;
  const highlightTwo = displayedStep?.pairTarget ?? null;

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/60 to-muted/20 p-6">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">自定义方阵</h3>
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
                  使用换行分隔行，逗号或空格分隔列，矩阵需为 n × n，n ≤ {MAX_SIZE}。
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
                    : "顺时针旋转 90°"}
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
                    点击播放或单步执行，查看转置与翻转过程。
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
                const isPrimary =
                  highlightOne &&
                  highlightOne.row === rowIndex &&
                  highlightOne.col === colIndex;
                const isSecondary =
                  highlightTwo &&
                  highlightTwo.row === rowIndex &&
                  highlightTwo.col === colIndex;

                let highlightClass = "border-muted bg-muted/30 text-foreground";
                if (isPrimary) {
                  highlightClass = "border-primary bg-primary/15 text-primary";
                } else if (isSecondary) {
                  highlightClass =
                    "border-emerald-500 bg-emerald-500/10 text-emerald-600";
                }

                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}-${stepIndex}`}
                    layout
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-lg border-2 text-lg font-semibold transition-all duration-200",
                      highlightClass,
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
                    当前阶段
                  </div>
                  <div className="font-semibold">
                    {STAGE_LABELS[displayedStep.stage]}
                  </div>
                </div>
                {displayedStep.pair && (
                  <div className="rounded-lg border px-3 py-2">
                    <div className="text-xs text-muted-foreground">
                      处理单元
                    </div>
                    <div className="font-semibold">
                      ({displayedStep.pair.row}, {displayedStep.pair.col})
                      {displayedStep.pairTarget
                        ? ` ↔ (${displayedStep.pairTarget.row}, ${displayedStep.pairTarget.col})`
                        : ""}
                    </div>
                  </div>
                )}
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
                点击播放或单步执行，查看矩阵如何被旋转。
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

