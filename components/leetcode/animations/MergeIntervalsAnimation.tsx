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

type StepStage = "sort" | "merge" | "final";
type StepAction = "sort" | "start-merge" | "merge-extend" | "merge-new" | "final";

interface Interval {
  start: number;
  end: number;
  originalIndex: number;
}

interface StepState {
  stage: StepStage;
  action: StepAction;
  sortedIndex: number;
  currentInterval: Interval | null;
  mergedSnapshot: Interval[];
  description: string;
  overlap: boolean;
  mergedIndexAffected: number | null;
  sortedRevealedCount: number;
}

interface StepLog {
  step: number;
  action: StepAction;
  description: string;
}

const DEFAULT_INTERVALS = "[1,3], [2,6], [8,10], [15,18]";
const MAX_INTERVALS = 8;

const ACTION_LABELS: Record<StepAction, string> = {
  sort: "排序阶段",
  "start-merge": "初始化",
  "merge-extend": "合并重叠",
  "merge-new": "追加新区间",
  final: "完成",
};

const STAGE_LABELS: Record<StepStage, string> = {
  sort: "排序阶段",
  merge: "合并阶段",
  final: "最终结果",
};

const cloneIntervals = (data: Interval[]): Interval[] =>
  data.map((interval) => ({ ...interval }));

const formatIntervalsList = (data: Interval[]): string =>
  data.length
    ? data
        .map((interval) => `[${interval.start}, ${interval.end}]`)
        .join(", ")
    : "空";

const parseIntervals = (input: string): Interval[] => {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const bracketMatches = Array.from(
    trimmed.matchAll(/\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/g)
  );
  const intervals: Interval[] = [];

  if (bracketMatches.length) {
    bracketMatches.forEach((match, index) => {
      const start = Number(match[1]);
      const end = Number(match[2]);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        intervals.push({
          start: Math.min(start, end),
          end: Math.max(start, end),
          originalIndex: index,
        });
      }
    });
  } else {
    const segments = trimmed
      .split(/[\n|;]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    segments.forEach((segment, index) => {
      const numbers = segment.match(/-?\d+/g);
      if (numbers && numbers.length >= 2) {
        const [left, right] = numbers.slice(0, 2).map(Number);
        if (!Number.isNaN(left) && !Number.isNaN(right)) {
          intervals.push({
            start: Math.min(left, right),
            end: Math.max(left, right),
            originalIndex: index,
          });
        }
      }
    });
  }

  if (!intervals.length) {
    const numbers = trimmed.match(/-?\d+/g) ?? [];
    for (let index = 0; index + 1 < numbers.length; index += 2) {
      const left = Number(numbers[index]);
      const right = Number(numbers[index + 1]);
      if (!Number.isNaN(left) && !Number.isNaN(right)) {
        intervals.push({
          start: Math.min(left, right),
          end: Math.max(left, right),
          originalIndex: Math.floor(index / 2),
        });
      }
    }
  }

  return intervals.slice(0, MAX_INTERVALS);
};

const buildSteps = (
  input: Interval[]
): { steps: StepState[]; sorted: Interval[] } => {
  if (!input.length) {
    return { steps: [], sorted: [] };
  }

  const steps: StepState[] = [];
  const sorted = cloneIntervals(input).sort((a, b) => {
    if (a.start === b.start) {
      return a.end - b.end;
    }
    return a.start - b.start;
  });

  sorted.forEach((interval, index) => {
    steps.push({
      stage: "sort",
      action: "sort",
      sortedIndex: index,
      currentInterval: interval,
      mergedSnapshot: [],
      description: `排序结果第 ${index + 1} 个区间是 [${interval.start}, ${interval.end}]（原始索引 ${interval.originalIndex + 1}）。`,
      overlap: false,
      mergedIndexAffected: null,
      sortedRevealedCount: index + 1,
    });
  });

  const merged: Interval[] = [];

  sorted.forEach((interval, index) => {
    if (!merged.length) {
      merged.push({ ...interval });
      steps.push({
        stage: "merge",
        action: "start-merge",
        sortedIndex: index,
        currentInterval: interval,
        mergedSnapshot: cloneIntervals(merged),
        description: `初始化 merged，加入区间 [${interval.start}, ${interval.end}]。`,
        overlap: false,
        mergedIndexAffected: merged.length - 1,
        sortedRevealedCount: index + 1,
      });
    } else {
      const last = merged[merged.length - 1];
      if (interval.start <= last.end) {
        const newEnd = Math.max(last.end, interval.end);
        merged[merged.length - 1] = {
          ...last,
          end: newEnd,
        };
        steps.push({
          stage: "merge",
          action: "merge-extend",
          sortedIndex: index,
          currentInterval: interval,
          mergedSnapshot: cloneIntervals(merged),
          description: `区间 [${interval.start}, ${interval.end}] 与 [${last.start}, ${last.end}] 重叠，合并为 [${last.start}, ${newEnd}]。`,
          overlap: true,
          mergedIndexAffected: merged.length - 1,
          sortedRevealedCount: index + 1,
        });
      } else {
        merged.push({ ...interval });
        steps.push({
          stage: "merge",
          action: "merge-new",
          sortedIndex: index,
          currentInterval: interval,
          mergedSnapshot: cloneIntervals(merged),
          description: `区间 [${interval.start}, ${interval.end}] 与当前结果不重叠，直接追加。`,
          overlap: false,
          mergedIndexAffected: merged.length - 1,
          sortedRevealedCount: index + 1,
        });
      }
    }
  });

  steps.push({
    stage: "final",
    action: "final",
    sortedIndex: sorted.length - 1,
    currentInterval: null,
    mergedSnapshot: cloneIntervals(merged),
    description: `最终合并结果：${formatIntervalsList(merged)}。`,
    overlap: false,
    mergedIndexAffected: null,
    sortedRevealedCount: sorted.length,
  });

  return { steps, sorted };
};

export default function MergeIntervalsAnimation() {
  const [intervalInput, setIntervalInput] = useState<string>(DEFAULT_INTERVALS);
  const [intervalError, setIntervalError] = useState<string | null>(null);

  const [originalIntervals, setOriginalIntervals] = useState<Interval[]>([]);
  const [sortedIntervals, setSortedIntervals] = useState<Interval[]>([]);
  const [mergedIntervals, setMergedIntervals] = useState<Interval[]>([]);

  const [steps, setSteps] = useState<StepState[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepState | null>(null);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const processedStepRef = useRef(-1);

  const initialize = useCallback(
    (intervals: Interval[], autoplay = false) => {
      const limited = intervals.slice(0, MAX_INTERVALS);
      setOriginalIntervals(cloneIntervals(limited));

      const { steps: generatedSteps, sorted } = buildSteps(limited);
      setSteps(generatedSteps);
      setSortedIntervals(sorted);
      setMergedIntervals([]);
      setStepIndex(0);
      setIsPlaying(autoplay && generatedSteps.length > 0);
      setCurrentStep(null);
      setLogs([]);
      processedStepRef.current = -1;
    },
    []
  );

  useEffect(() => {
    const defaults = parseIntervals(DEFAULT_INTERVALS).map((interval, index) => ({
      ...interval,
      originalIndex: index,
    }));
    initialize(defaults);
  }, [initialize]);

  const activeSteps = steps;

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseIntervals(intervalInput).map((interval, index) => ({
      ...interval,
      originalIndex: index,
    }));

    if (!parsed.length) {
      setIntervalError("请至少输入一个合法的区间，例如 [1,3], [2,6]。");
      return;
    }

    setIntervalError(null);
    initialize(parsed);
  };

  const handleUseDefault = () => {
    setIntervalInput(DEFAULT_INTERVALS);
    setIntervalError(null);
    const parsed = parseIntervals(DEFAULT_INTERVALS).map((interval, index) => ({
      ...interval,
      originalIndex: index,
    }));
    initialize(parsed);
  };

  const resetPlayback = () => {
    setStepIndex(0);
    setIsPlaying(false);
    setCurrentStep(null);
    setMergedIntervals([]);
    setLogs([]);
    processedStepRef.current = -1;
  };

  const nextStep = useCallback(() => {
    if (!activeSteps.length) return;

    setStepIndex((previous) => {
      if (previous >= activeSteps.length) {
        setIsPlaying(false);
        return previous;
      }

      const alreadyProcessed = processedStepRef.current === previous;
      const nextIndex = previous + 1;

      if (!alreadyProcessed) {
        processedStepRef.current = previous;
        const step = activeSteps[previous];
        setCurrentStep(step);
        setMergedIntervals(cloneIntervals(step.mergedSnapshot));
        setLogs((prevLogs) => {
          const nextLogs = [
            ...prevLogs,
            {
              step: previous + 1,
              action: step.action,
              description: step.description,
            },
          ];
          return nextLogs.slice(-18);
        });
      }

      if (nextIndex >= activeSteps.length) {
        setIsPlaying(false);
      }

      return nextIndex;
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

  const isComplete = activeSteps.length > 0 && stepIndex >= activeSteps.length;

  const currentStageLabel = currentStep ? STAGE_LABELS[currentStep.stage] : "等待开始";
  const currentActionLabel = currentStep ? ACTION_LABELS[currentStep.action] : "准备就绪";

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/60 to-muted/20 p-6">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">自定义区间</h3>
            <form className="space-y-4" onSubmit={handleApply}>
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  区间列表
                </label>
                <Input
                  value={intervalInput}
                  onChange={(event) => {
                    setIntervalInput(event.target.value);
                    setIntervalError(null);
                  }}
                  placeholder="示例： [1,3], [2,6], [8,10], [15,18]"
                />
                <p className="text-xs text-muted-foreground">
                  支持格式：`[1,3], [2,6]` 或 `1 3 | 2 6`，最多 {MAX_INTERVALS} 个区间。
                </p>
                {intervalError && (
                  <p className="text-xs text-destructive">{intervalError}</p>
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
              当前输入：{formatIntervalsList(originalIntervals)}
            </p>
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  {currentStageLabel}
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
                {currentStep ? (
                  <motion.div
                    key={`${currentStep.stage}-${currentStep.action}-${stepIndex}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-primary text-sm"
                  >
                    <div className="text-xs uppercase tracking-wide">
                      {currentActionLabel}
                    </div>
                    <p className="text-primary/90">{currentStep.description}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="rounded-lg border border-muted px-3 py-2 text-muted-foreground text-sm"
                  >
                    点击播放或单步执行，查看排序与合并过程。
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background/80 p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                原始区间（输入顺序）
              </h4>
              <div className="flex flex-wrap gap-3">
                {originalIntervals.length ? (
                  originalIntervals.map((interval, index) => (
                    <div
                      key={`original-${index}`}
                      className="flex flex-col items-center justify-center rounded-xl border bg-muted/30 px-4 py-3 text-sm"
                    >
                      <span className="font-semibold">
                        [{interval.start}, {interval.end}]
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        输入 #{index + 1}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    暂无区间，请先输入数据。
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                排序后区间（按起点升序）
              </h4>
              <div className="flex flex-wrap gap-3">
                {sortedIntervals.map((interval, index) => {
                  const isCurrent =
                    currentStep && index === currentStep.sortedIndex;
                  const isProcessed =
                    currentStep && index < currentStep.sortedRevealedCount - 1;
                  return (
                    <motion.div
                      key={`sorted-${index}`}
                      layout
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl border px-4 py-3 text-sm transition-all duration-200",
                        isCurrent
                          ? "border-primary bg-primary/10 text-primary"
                          : isProcessed
                            ? "border-muted bg-muted/30"
                            : "border-muted bg-muted/10"
                      )}
                    >
                      <span className="font-semibold">
                        [{interval.start}, {interval.end}]
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        原始 #{interval.originalIndex + 1}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                当前合并结果
              </h4>
              <div className="flex flex-wrap gap-3">
                {mergedIntervals.length ? (
                  mergedIntervals.map((interval, index) => {
                    const isUpdated =
                      currentStep?.mergedIndexAffected === index &&
                      (currentStep.action === "merge-extend" ||
                        currentStep.action === "start-merge" ||
                        currentStep.action === "merge-new");
                    const isOverlap =
                      currentStep?.mergedIndexAffected === index &&
                      currentStep.overlap;
                    return (
                      <motion.div
                        key={`merged-${index}`}
                        layout
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border px-4 py-3 text-sm transition-all duration-200",
                          isOverlap
                            ? "border-amber-500 bg-amber-500/10 text-amber-600"
                            : isUpdated
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted bg-muted/20"
                        )}
                      >
                        <span className="font-semibold">
                          [{interval.start}, {interval.end}]
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          结果 #{index + 1}
                        </span>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">
                    合并结果为空，等待动画执行。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">
              状态速览
            </h4>
            {currentStep ? (
              <div className="grid gap-3 text-sm">
                <div className="rounded-lg border px-3 py-2">
                  <div className="text-xs text-muted-foreground">阶段</div>
                  <div className="font-semibold">{currentStageLabel}</div>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <div className="text-xs text-muted-foreground">当前动作</div>
                  <div className="font-semibold">{currentActionLabel}</div>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <div className="text-xs text-muted-foreground">处理区间</div>
                  <div className="font-semibold">
                    {currentStep.currentInterval
                      ? `[${currentStep.currentInterval.start}, ${currentStep.currentInterval.end}]`
                      : "无"}
                  </div>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    合并数量
                  </div>
                  <div className="font-semibold">{mergedIntervals.length}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                动画开始后，将展示排序及合并的实时状态。
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
            <h4 className="text-sm font-semibold mb-4">执行日志</h4>
            <div className="h-56 overflow-auto rounded-lg bg-muted/20 p-3">
              {logs.length ? (
                <ul className="space-y-2 text-xs leading-relaxed">
                  {logs.map((log) => (
                    <li
                      key={`${log.step}-${log.action}`}
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

