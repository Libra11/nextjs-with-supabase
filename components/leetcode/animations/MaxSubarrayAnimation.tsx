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
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ARRAY = "-2, 1, -3, 4, -1, 2, 1, -5, 4";
const MAX_LENGTH = 10;

type AlgorithmMode = "kadane" | "divide";

type KadaneAction = "evaluate" | "update" | "final";
type DivideAction = "split" | "base" | "merge" | "final";

interface KadaneStep {
  algorithm: "kadane";
  action: KadaneAction;
  index: number;
  value: number;
  previousMaxEndingHere: number;
  maxEndingHere: number;
  currentRange: [number, number];
  candidateRange: [number, number];
  bestRange: [number, number];
  previousBestSum: number;
  bestSum: number;
  restarted: boolean;
  description: string;
}

interface SegmentResult {
  total: number;
  maxPrefixSum: number;
  prefixRange: [number, number];
  maxSuffixSum: number;
  suffixRange: [number, number];
  maxSubarraySum: number;
  subarrayRange: [number, number];
}

interface DivideStep {
  algorithm: "divide";
  action: DivideAction;
  range: [number, number];
  mid?: number;
  leftResult?: SegmentResult;
  rightResult?: SegmentResult;
  result?: SegmentResult;
  crossRange?: [number, number];
  crossSum?: number;
  bestSource?: "left" | "right" | "cross";
  description: string;
}

type VisualizationStep = KadaneStep | DivideStep;

interface StepLog {
  step: number;
  algorithm: AlgorithmMode;
  action: KadaneAction | DivideAction;
  description: string;
}

const KADANE_ACTION_LABELS: Record<KadaneAction, string> = {
  evaluate: "窗口评估",
  update: "更新答案",
  final: "完成",
};

const DIVIDE_ACTION_LABELS: Record<DivideAction, string> = {
  split: "拆分区间",
  base: "基线求解",
  merge: "合并结果",
  final: "完成",
};

const parseNumbers = (input: string): number[] => {
  return input
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => Number(segment));
};

const buildKadaneSteps = (numbers: number[]): KadaneStep[] => {
  if (!numbers.length) return [];

  const steps: KadaneStep[] = [];

  let maxEndingHere = numbers[0];
  let bestSum = numbers[0];
  let currentStart = 0;
  let bestRange: [number, number] = [0, 0];

  for (let i = 0; i < numbers.length; i++) {
    const value = numbers[i];
    const previousMaxEndingHere = i === 0 ? numbers[0] : maxEndingHere;
    const previousBestSum = bestSum;
    let restarted = false;

    if (i === 0) {
      maxEndingHere = value;
      steps.push({
        algorithm: "kadane",
        action: "evaluate",
        index: i,
        value,
        previousMaxEndingHere: value,
        maxEndingHere,
        currentRange: [0, 0],
        candidateRange: [0, 0],
        bestRange,
        previousBestSum,
        bestSum,
        restarted: false,
        description: `初始化：第一个元素 ${value} 作为起始窗口，当前和为 ${maxEndingHere}。`,
      });
    } else {
      const extend = maxEndingHere + value;
      const restart = value;

      if (restart >= extend) {
        maxEndingHere = restart;
        currentStart = i;
        restarted = true;
      } else {
        maxEndingHere = extend;
      }

      const currentRange: [number, number] = [currentStart, i];

      steps.push({
        algorithm: "kadane",
        action: "evaluate",
        index: i,
        value,
        previousMaxEndingHere,
        maxEndingHere,
        currentRange,
        candidateRange: currentRange,
        bestRange,
        previousBestSum,
        bestSum,
        restarted,
        description: restarted
          ? `当前元素 ${value} 单独更优，从索引 ${i} 重新开始窗口。`
          : `将 ${value} 加入当前窗口，累计和为 ${maxEndingHere}。`,
      });
    }

    if (maxEndingHere > bestSum) {
      bestSum = maxEndingHere;
      bestRange = [currentStart, i];
      steps.push({
        algorithm: "kadane",
        action: "update",
        index: i,
        value,
        previousMaxEndingHere: maxEndingHere,
        maxEndingHere,
        currentRange: [currentStart, i],
        candidateRange: [currentStart, i],
        bestRange,
        previousBestSum,
        bestSum,
        restarted: false,
        description: `更新最优答案：子数组 [${bestRange[0]}, ${bestRange[1]}] 的和为 ${bestSum}。`,
      });
    }
  }

  steps.push({
    algorithm: "kadane",
    action: "final",
    index: bestRange[1],
    value: numbers[bestRange[1]],
    previousMaxEndingHere: maxEndingHere,
    maxEndingHere,
    currentRange: bestRange,
    candidateRange: bestRange,
    bestRange,
    previousBestSum: bestSum,
    bestSum,
    restarted: false,
    description: `算法结束，最大子数组和为 ${bestSum}，区间 [${bestRange[0]}, ${bestRange[1]}]。`,
  });

  return steps;
};

const buildDivideSteps = (numbers: number[]): DivideStep[] => {
  if (!numbers.length) return [];

  const steps: DivideStep[] = [];

  const helper = (left: number, right: number): SegmentResult => {
    if (left === right) {
      const value = numbers[left];
      const result: SegmentResult = {
        total: value,
        maxPrefixSum: value,
        prefixRange: [left, left],
        maxSuffixSum: value,
        suffixRange: [left, left],
        maxSubarraySum: value,
        subarrayRange: [left, left],
      };
      steps.push({
        algorithm: "divide",
        action: "base",
        range: [left, right],
        result,
        description: `单元素区间 [${left}, ${right}] 的最大子数组为自身，和为 ${value}。`,
      });
      return result;
    }

    const mid = Math.floor((left + right) / 2);
    steps.push({
      algorithm: "divide",
      action: "split",
      range: [left, right],
      mid,
      description: `将区间 [${left}, ${right}] 拆分为 [${left}, ${mid}] 与 [${mid + 1}, ${right}]。`,
    });

    const leftResult = helper(left, mid);
    const rightResult = helper(mid + 1, right);

    const crossRange: [number, number] = [
      leftResult.suffixRange[0],
      rightResult.prefixRange[1],
    ];
    const crossSum = leftResult.maxSuffixSum + rightResult.maxPrefixSum;

    const total = leftResult.total + rightResult.total;

    let maxPrefixSum: number;
    let prefixRange: [number, number];
    if (
      leftResult.maxPrefixSum >=
      leftResult.total + rightResult.maxPrefixSum
    ) {
      maxPrefixSum = leftResult.maxPrefixSum;
      prefixRange = leftResult.prefixRange;
    } else {
      maxPrefixSum = leftResult.total + rightResult.maxPrefixSum;
      prefixRange = [left, rightResult.prefixRange[1]];
    }

    let maxSuffixSum: number;
    let suffixRange: [number, number];
    if (
      rightResult.maxSuffixSum >=
      rightResult.total + leftResult.maxSuffixSum
    ) {
      maxSuffixSum = rightResult.maxSuffixSum;
      suffixRange = rightResult.suffixRange;
    } else {
      maxSuffixSum = rightResult.total + leftResult.maxSuffixSum;
      suffixRange = [leftResult.suffixRange[0], right];
    }

    let maxSubarraySum = leftResult.maxSubarraySum;
    let subarrayRange = leftResult.subarrayRange;
    let bestSource: "left" | "right" | "cross" = "left";

    if (rightResult.maxSubarraySum > maxSubarraySum) {
      maxSubarraySum = rightResult.maxSubarraySum;
      subarrayRange = rightResult.subarrayRange;
      bestSource = "right";
    }
    if (crossSum > maxSubarraySum) {
      maxSubarraySum = crossSum;
      subarrayRange = crossRange;
      bestSource = "cross";
    }

    const result: SegmentResult = {
      total,
      maxPrefixSum,
      prefixRange,
      maxSuffixSum,
      suffixRange,
      maxSubarraySum,
      subarrayRange,
    };

    steps.push({
      algorithm: "divide",
      action: "merge",
      range: [left, right],
      mid,
      leftResult,
      rightResult,
      result,
      crossRange,
      crossSum,
      bestSource,
      description:
        bestSource === "left"
          ? `左半部分提供最优子数组，区间 [${subarrayRange[0]}, ${subarrayRange[1]}]，和为 ${maxSubarraySum}。`
          : bestSource === "right"
            ? `右半部分提供最优子数组，区间 [${subarrayRange[0]}, ${subarrayRange[1]}]，和为 ${maxSubarraySum}。`
            : `跨越中点的区间 [${subarrayRange[0]}, ${subarrayRange[1]}] 最优，和为 ${maxSubarraySum}。`,
    });

    return result;
  };

  const result = helper(0, numbers.length - 1);

  steps.push({
    algorithm: "divide",
    action: "final",
    range: [0, numbers.length - 1],
    result,
    description: `分治结束，区间 [${result.subarrayRange[0]}, ${result.subarrayRange[1]}] 的和 ${result.maxSubarraySum} 为全局最优。`,
  });

  return steps;
};

const getActionLabel = (step: VisualizationStep | StepLog) => {
  if (step.algorithm === "kadane") {
    return KADANE_ACTION_LABELS[step.action as KadaneAction];
  }
  return DIVIDE_ACTION_LABELS[step.action as DivideAction];
};

const formatRange = (range: [number, number] | null | undefined) => {
  if (!range || range[0] > range[1]) return "无";
  return `[${range[0]}, ${range[1]}]`;
};

export default function MaxSubarrayAnimation() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [arrayError, setArrayError] = useState<string | null>(null);

  const [kadaneSteps, setKadaneSteps] = useState<KadaneStep[]>([]);
  const [divideSteps, setDivideSteps] = useState<DivideStep[]>([]);
  const [mode, setMode] = useState<AlgorithmMode>("kadane");

  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<VisualizationStep | null>(
    null,
  );
  const [logs, setLogs] = useState<StepLog[]>([]);
  const processedStepRef = useRef(-1);

  const activeSteps = useMemo(
    () => (mode === "kadane" ? kadaneSteps : divideSteps),
    [mode, kadaneSteps, divideSteps],
  );

  const initialize = useCallback(
    (values: number[]) => {
      setNumbers(values);
      setKadaneSteps(buildKadaneSteps(values));
      setDivideSteps(buildDivideSteps(values));
    },
    [],
  );

  const resetPlayback = useCallback(() => {
    setStepIndex(0);
    setIsPlaying(false);
    setCurrentStep(null);
    setLogs([]);
    processedStepRef.current = -1;
  }, []);

  useEffect(() => {
    const defaultNumbers = parseNumbers(DEFAULT_ARRAY);
    initialize(defaultNumbers);
  }, [initialize]);

  useEffect(() => {
    resetPlayback();
  }, [mode, kadaneSteps, divideSteps, resetPlayback]);

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
              algorithm: step.algorithm,
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

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseNumbers(arrayInput);

    if (!parsed.length) {
      setArrayError("请至少输入一个数字。");
      return;
    }
    if (parsed.some((value) => Number.isNaN(value))) {
      setArrayError("检测到无效数字，请检查输入。");
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
    const defaults = parseNumbers(DEFAULT_ARRAY);
    initialize(defaults);
  };

  const togglePlay = () => {
    if (!activeSteps.length) return;
    const finished = stepIndex >= activeSteps.length;

    if (finished) {
      resetPlayback();
      setIsPlaying(true);
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  const progress = useMemo(() => {
    if (!activeSteps.length) return 0;
    return Math.min(stepIndex / activeSteps.length, 1);
  }, [stepIndex, activeSteps.length]);

  const highlightInfo = useMemo(() => {
    if (!currentStep) {
      return {
        activeRange: null as [number, number] | null,
        candidateRange: null as [number, number] | null,
        bestRange: null as [number, number] | null,
        currentIndex: -1,
      };
    }

    if (currentStep.algorithm === "kadane") {
      return {
        activeRange: currentStep.currentRange,
        candidateRange: currentStep.candidateRange,
        bestRange: currentStep.bestRange,
        currentIndex: currentStep.index,
      };
    }

    return {
      activeRange: currentStep.range,
      candidateRange: currentStep.crossRange ?? null,
      bestRange: currentStep.result?.subarrayRange ?? null,
      currentIndex: currentStep.mid ?? -1,
    };
  }, [currentStep]);

  const currentMetrics = useMemo(() => {
    if (!currentStep) return null;

    if (currentStep.algorithm === "kadane") {
      return {
        maxEndingHere: currentStep.maxEndingHere,
        previousMaxEndingHere: currentStep.previousMaxEndingHere,
        bestSum: currentStep.bestSum,
        previousBestSum: currentStep.previousBestSum,
        restarted: currentStep.restarted,
      };
    }

    const result = currentStep.result;
    return result
      ? {
          total: result.total,
          maxPrefixSum: result.maxPrefixSum,
          prefixRange: result.prefixRange,
          maxSuffixSum: result.maxSuffixSum,
          suffixRange: result.suffixRange,
          maxSubarraySum: result.maxSubarraySum,
          subarrayRange: result.subarrayRange,
          crossRange: currentStep.crossRange ?? null,
          crossSum: currentStep.crossSum ?? null,
          bestSource: currentStep.bestSource ?? null,
        }
      : null;
  }, [currentStep]);

  const isComplete =
    activeSteps.length > 0 && stepIndex >= activeSteps.length;

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/60 to-muted/20 p-6">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              自定义数组
            </h3>
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
                  placeholder="示例：-2, 1, -3, 4, -1, 2, 1, -5, 4"
                />
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={mode === "kadane" ? "default" : "outline"}
                    className="flex items-center gap-2"
                    onClick={() => setMode("kadane")}
                  >
                    <Sparkles className="h-4 w-4" />
                    Kadane 算法
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "divide" ? "default" : "outline"}
                    className="flex items-center gap-2"
                    onClick={() => setMode("divide")}
                  >
                    <GitBranch className="h-4 w-4" />
                    分治法
                  </Button>
                </div>
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
                  disabled={
                    isPlaying || !activeSteps.length || isComplete
                  }
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

              <div className="space-y-3 text-sm">
                <AnimatePresence mode="wait">
                  {currentStep ? (
                    <motion.div
                      key={`${currentStep.algorithm}-${currentStep.action}-${stepIndex}`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-primary"
                    >
                      <div className="text-xs uppercase tracking-wide">
                        {getActionLabel(currentStep)}
                      </div>
                      <p className="text-sm text-primary/90">
                        {currentStep.description}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="rounded-lg border border-muted px-3 py-2 text-muted-foreground"
                    >
                      点击播放或单步执行，观察算法的运行过程。
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background/80 p-6 shadow-sm">
          <div className="flex flex-wrap gap-4 justify-center">
            {numbers.length ? (
              numbers.map((value, index) => {
                const inActive =
                  highlightInfo.activeRange &&
                  index >= highlightInfo.activeRange[0] &&
                  index <= highlightInfo.activeRange[1];
                const inCandidate =
                  highlightInfo.candidateRange &&
                  index >= highlightInfo.candidateRange[0] &&
                  index <= highlightInfo.candidateRange[1];
                const inBest =
                  highlightInfo.bestRange &&
                  index >= highlightInfo.bestRange[0] &&
                  index <= highlightInfo.bestRange[1];
                const isFocus = highlightInfo.currentIndex === index;

                return (
                  <motion.div
                    key={`${value}-${index}`}
                    layout
                    className={cn(
                      "relative flex h-20 w-16 flex-col items-center justify-center rounded-xl border-2 text-xl font-semibold transition-all duration-200",
                      inActive
                        ? "border-primary/70 bg-primary/15"
                        : "border-muted bg-muted/40",
                      inCandidate && "bg-primary/20",
                      inBest && "ring-2 ring-amber-500",
                      isFocus && "scale-105 shadow-lg border-primary bg-primary/25",
                    )}
                  >
                    <span>{value}</span>
                    <span className="absolute -bottom-5 text-[10px] tracking-wide text-muted-foreground">
                      {index}
                    </span>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">
                请先输入数组以开始动画。
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            {mode === "kadane" ? (
              <>
                <h4 className="text-sm font-semibold mb-4">
                  Kadane 状态追踪
                </h4>
                {currentStep && currentStep.algorithm === "kadane" ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          当前索引
                        </div>
                        <div className="font-semibold">
                          {currentStep.index}
                        </div>
                      </div>
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          当前元素
                        </div>
                        <div className="font-semibold">
                          {currentStep.value}
                        </div>
                      </div>
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          当前窗口
                        </div>
                        <div className="font-semibold">
                          {formatRange(currentStep.currentRange)}
                        </div>
                      </div>
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          最优窗口
                        </div>
                        <div className="font-semibold">
                          {formatRange(currentStep.bestRange)}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          maxEndingHere
                        </div>
                        <div className="font-semibold">
                          {currentMetrics?.maxEndingHere}
                          <span className="text-xs text-muted-foreground ml-2">
                            (之前: {currentMetrics?.previousMaxEndingHere})
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          最佳和
                        </div>
                        <div className="font-semibold">
                          {currentMetrics?.bestSum}
                          <span className="text-xs text-muted-foreground ml-2">
                            (之前: {currentMetrics?.previousBestSum})
                          </span>
                        </div>
                      </div>
                      {currentMetrics?.restarted && (
                        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-amber-600">
                          当前元素使窗口重启。
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    当动画运行时，实时展示滑动窗口的取舍与更新。
                  </p>
                )}
              </>
            ) : (
              <>
                <h4 className="text-sm font-semibold mb-4">
                  分治状态追踪
                </h4>
                {currentStep && currentStep.algorithm === "divide" ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          当前区间
                        </div>
                        <div className="font-semibold">
                          {formatRange(currentStep.range)}
                        </div>
                      </div>
                      {typeof currentStep.mid === "number" && (
                        <div className="rounded-lg border px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            中点
                          </div>
                          <div className="font-semibold">
                            {currentStep.mid}
                          </div>
                        </div>
                      )}
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          最优区间
                        </div>
                        <div className="font-semibold">
                          {formatRange(currentMetrics?.subarrayRange)}
                        </div>
                      </div>
                      {currentMetrics?.crossSum != null && (
                        <div className="rounded-lg border px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            跨区间候选
                          </div>
                          <div className="font-semibold">
                            {formatRange(currentMetrics.crossRange ?? undefined)}{" "}
                            ({currentMetrics.crossSum})
                          </div>
                        </div>
                      )}
                    </div>
                    {currentMetrics && (
                      <div className="grid gap-3">
                        <div className="rounded-lg border px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            区间总和
                          </div>
                          <div className="font-semibold">
                            {currentMetrics.total}
                          </div>
                        </div>
                        <div className="rounded-lg border px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            前缀最佳
                          </div>
                          <div className="font-semibold">
                            {currentMetrics.maxPrefixSum}{" "}
                            <span className="text-xs text-muted-foreground ml-2">
                              区间 {formatRange(currentMetrics.prefixRange)}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-lg border px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            后缀最佳
                          </div>
                          <div className="font-semibold">
                            {currentMetrics.maxSuffixSum}{" "}
                            <span className="text-xs text-muted-foreground ml-2">
                              区间 {formatRange(currentMetrics.suffixRange)}
                            </span>
                          </div>
                        </div>
                        {currentMetrics.bestSource && (
                          <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-primary">
                            最优子数组来自{" "}
                            {currentMetrics.bestSource === "left"
                              ? "左半边"
                              : currentMetrics.bestSource === "right"
                                ? "右半边"
                                : "跨越中点"}
                            。
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    当动画运行时，将展示分治过程中的区间合并与候选结果。
                  </p>
                )}
              </>
            )}
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">执行日志</h4>
            <div className="h-56 overflow-auto rounded-lg bg-muted/20 p-3">
              {logs.length ? (
                <ul className="space-y-2 text-xs leading-relaxed">
                  {logs.map((log) => (
                    <li
                      key={`${log.step}-${log.algorithm}-${log.action}`}
                      className="rounded-md bg-background/70 p-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">
                          步骤 {log.step}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {getActionLabel(log)}
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

