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
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, StepForward } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ARRAY = "3, 4, -1, 1";
const MAX_LENGTH = 10;

type Stage = "arrange" | "scan" | "final";
type StepAction = "evaluate" | "swap" | "placed" | "scan-compare" | "final";

interface StepState {
  stage: Stage;
  action: StepAction;
  index: number | null;
  targetIndex: number | null;
  arraySnapshot: number[];
  consideredValue: number | null;
  missingCandidate: number | null;
  description: string;
  swapPerformed?: boolean;
}

interface StepLog {
  step: number;
  action: StepAction;
  description: string;
}

const ACTION_LABELS: Record<StepAction, string> = {
  evaluate: "检查位置",
  swap: "交换元素",
  placed: "定位完成",
  "scan-compare": "扫描验证",
  final: "完成",
};

const STAGE_LABELS: Record<Stage, string> = {
  arrange: "放置阶段",
  scan: "扫描阶段",
  final: "最终结果",
};

const parseNumberList = (input: string): number[] | null => {
  const segments = input
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) return [];

  const values: number[] = [];
  for (const segment of segments) {
    const parsed = Number(segment);
    if (Number.isNaN(parsed)) {
      return null;
    }
    values.push(parsed);
  }

  return values;
};

const formatArray = (array: number[]): string =>
  `[${array.map((value) => String(value)).join(", ")}]`;

const buildSteps = (nums: number[]): StepState[] => {
  const n = nums.length;
  if (!n) return [];

  const arr = [...nums];
  const steps: StepState[] = [];

  for (let index = 0; index < n; index++) {
    // Attempt to place arr[index] in its correct position.
    while (true) {
      const value = arr[index];
      const correctIndex = value - 1;
      const shouldSwap =
        value >= 1 && value <= n && arr[correctIndex] !== value;

      steps.push({
        stage: "arrange",
        action: "evaluate",
        index,
        targetIndex: shouldSwap ? correctIndex : null,
        arraySnapshot: [...arr],
        consideredValue: value,
        missingCandidate: null,
        description: shouldSwap
          ? `值 ${value} 应位于索引 ${correctIndex}，准备交换。`
          : value >= 1 && value <= n
            ? `值 ${value} 已在正确位置，无需交换。`
            : `值 ${value} 不在 1..${n} 范围内，保持当前位置。`,
      });

      if (shouldSwap) {
        const swappedArray = [...arr];
        [swappedArray[index], swappedArray[correctIndex]] = [
          swappedArray[correctIndex],
          swappedArray[index],
        ];
        arr[index] = swappedArray[index];
        arr[correctIndex] = swappedArray[correctIndex];

        steps.push({
          stage: "arrange",
          action: "swap",
          index,
          targetIndex: correctIndex,
          arraySnapshot: swappedArray,
          consideredValue: value,
          missingCandidate: null,
          description: `交换索引 ${index} 与 ${correctIndex}，数组变为 ${formatArray(
            swappedArray,
          )}。`,
          swapPerformed: true,
        });

        // Continue to evaluate the new value at index.
        continue;
      }

      steps.push({
        stage: "arrange",
        action: "placed",
        index,
        targetIndex: null,
        arraySnapshot: [...arr],
        consideredValue: value,
        missingCandidate: null,
        description: `索引 ${index} 已处理完毕，当前数组 ${formatArray(arr)}。`,
        swapPerformed: false,
      });
      break;
    }
  }

  let missing: number | null = null;
  for (let index = 0; index < n; index++) {
    const expected = index + 1;
    const matches = arr[index] === expected;

    steps.push({
      stage: "scan",
      action: "scan-compare",
      index,
      targetIndex: null,
      arraySnapshot: [...arr],
      consideredValue: arr[index],
      missingCandidate: matches ? null : expected,
      description: matches
        ? `索引 ${index} 正确放置了 ${expected}。`
        : `索引 ${index} 处元素 ${arr[index]} ≠ ${expected}，缺失值为 ${expected}。`,
    });

    if (!matches) {
      missing = expected;
      break;
    }
  }

  if (missing === null) {
    missing = n + 1;
    steps.push({
      stage: "final",
      action: "final",
      index: null,
      targetIndex: null,
      arraySnapshot: [...arr],
      consideredValue: null,
      missingCandidate: missing,
      description: `数组位置全部正确，缺失的最小正数为 ${missing}。`,
    });
  } else {
    steps.push({
      stage: "final",
      action: "final",
      index: null,
      targetIndex: null,
      arraySnapshot: [...arr],
      consideredValue: null,
      missingCandidate: missing,
      description: `确定缺失的最小正数为 ${missing}。`,
    });
  }

  return steps;
};

export default function FirstMissingPositiveAnimation() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY);
  const [arrayError, setArrayError] = useState<string | null>(null);

  const [numbers, setNumbers] = useState<number[]>([]);
  const [steps, setSteps] = useState<StepState[]>([]);

  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepState | null>(null);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const processedStepRef = useRef(-1);

  const initialize = useCallback((values: number[], autoplay = false) => {
    const limited = values.slice(0, MAX_LENGTH);
    setNumbers(limited);
    const generatedSteps = buildSteps(limited);
    setSteps(generatedSteps);
    setStepIndex(0);
    setIsPlaying(autoplay && generatedSteps.length > 0);
    setCurrentStep(null);
    setLogs([]);
    processedStepRef.current = -1;
  }, []);

  useEffect(() => {
    const defaults = parseNumberList(DEFAULT_ARRAY) ?? [];
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
    const parsed = parseNumberList(arrayInput);

    if (parsed === null || !parsed.length) {
      setArrayError("请输入有效的数组元素，例如 3, 4, -1, 1。");
      return;
    }
    if (parsed.length > MAX_LENGTH) {
      setArrayError(`为便于展示，请输入不超过 ${MAX_LENGTH} 个数字。`);
      return;
    }

    setArrayError(null);
    initialize(parsed);
  };

  const handleUseDefault = () => {
    setArrayInput(DEFAULT_ARRAY);
    setArrayError(null);
    const defaults = parseNumberList(DEFAULT_ARRAY) ?? [];
    initialize(defaults);
  };

  const highlightClasses = (index: number): string => {
    if (!displayedStep || displayedStep.index === null) return "";
    if (displayedStep.stage === "arrange") {
      if (displayedStep.index === index && displayedStep.targetIndex === index) {
        return "border-primary bg-primary/15 text-primary";
      }
      if (displayedStep.index === index) {
        return "border-primary bg-primary/15 text-primary";
      }
      if (displayedStep.targetIndex === index) {
        return "border-emerald-500 bg-emerald-500/10 text-emerald-600";
      }
    } else if (displayedStep.stage === "scan") {
      if (displayedStep.index === index) {
        return "border-primary bg-primary/15 text-primary";
      }
    }
    return "";
  };

  const renderArray = () => {
    if (!numbers.length) {
      return (
        <div className="text-sm text-muted-foreground">
          暂无数组，请输入数据以开始动画。
        </div>
      );
    }

    const snapshot =
      displayedStep?.arraySnapshot ?? numbers.map((value) => value);

    return (
      <div className="flex flex-wrap justify-center gap-3">
        {snapshot.map((value, index) => (
          <motion.div
            key={`${value}-${index}-${stepIndex}`}
            layout
            className={cn(
              "relative flex h-20 w-16 flex-col items-center justify-center rounded-xl border-2 text-xl font-semibold transition-all duration-200",
              highlightClasses(index) || "border-muted bg-muted/30 text-foreground",
            )}
          >
            <span>{value}</span>
            <span className="absolute -bottom-5 text-[10px] tracking-wide text-muted-foreground">
              {index}
            </span>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    if (!displayedStep) {
      return (
        <p className="text-sm text-muted-foreground">
          点击播放或单步执行，查看算法步骤。
        </p>
      );
    }

    return (
      <div className="grid gap-3 text-sm">
        <div className="rounded-lg border px-3 py-2">
          <div className="text-xs text-muted-foreground">当前阶段</div>
          <div className="font-semibold">
            {STAGE_LABELS[displayedStep.stage]}
          </div>
        </div>
        {displayedStep.index != null && (
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">当前位置</div>
            <div className="font-semibold">{displayedStep.index}</div>
          </div>
        )}
        {displayedStep.targetIndex != null && (
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">目标索引</div>
            <div className="font-semibold">{displayedStep.targetIndex}</div>
          </div>
        )}
        {displayedStep.consideredValue != null && (
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">当前值</div>
            <div className="font-semibold">{displayedStep.consideredValue}</div>
          </div>
        )}
        {displayedStep.missingCandidate != null && (
          <div className="rounded-lg border px-3 py-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-700">
            <div className="text-xs uppercase tracking-wide">缺失候选</div>
            <div className="font-semibold">
              {displayedStep.missingCandidate}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/60 to-muted/20 p-6">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">自定义输入</h3>
            <form className="space-y-4" onSubmit={handleApply}>
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  数组元素
                </label>
                <Input
                  value={arrayInput}
                  onChange={(event) => {
                    setArrayInput(event.target.value);
                    setArrayError(null);
                  }}
                  placeholder="示例：3, 4, -1, 1"
                />
                <p className="text-xs text-muted-foreground">
                  使用逗号或空格分隔，最多 {MAX_LENGTH} 个数字。
                </p>
                {arrayError && (
                  <p className="text-xs text-destructive">{arrayError}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="flex items-center gap-2">
                  应用参数
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
              当前数组：[{numbers.join(", ")}]
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
                    点击播放或单步执行，体验原地交换的过程。
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background/80 p-6 shadow-sm">
          {renderArray()}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">状态速览</h4>
            {renderStats()}
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">执行日志</h4>
            <div className="h-56 overflow-auto rounded-lg bg-muted/20 p-3">
              {logs.length ? (
                <ul className="space-y-2 text-xs leading-relaxed">
                  {logs.map((log) => (
                    <li
                      key={log.step}
                      className="rounded-md bg-background/70 p-2"
                    >
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

