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
import { Play, Pause, RotateCcw, StepForward, Sigma } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ARRAY = "1, 2, 3, -2, 5";
const DEFAULT_K = "3";
const MAX_NUMBERS = 10;

type StepAction = "add" | "record" | "match";

interface StepSnapshot {
  action: StepAction;
  index: number;
  value: number;
  prefixSum: number;
  target: number;
  matches: number[];
  description: string;
  mapSnapshot: Array<[number, number]>;
}

interface StepLog {
  step: number;
  action: StepAction;
  description: string;
}

const ACTION_LABELS: Record<StepAction, string> = {
  add: "累加前缀",
  record: "记录前缀",
  match: "找到子数组",
};

const parseNumbers = (input: string): number[] => {
  if (!input.trim()) return [];
  return input
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(Number);
};

const buildSteps = (numbers: number[], k: number): StepSnapshot[] => {
  const steps: StepSnapshot[] = [];
  const prefixMap = new Map<number, number>();
  prefixMap.set(0, 1);

  let prefixSum = 0;
  const matches: number[] = [];

  steps.push({
    action: "record",
    index: -1,
    value: 0,
    prefixSum: 0,
    target: k,
    matches: [...matches],
    description: "初始化：前缀和为 0 出现 1 次，表示空前缀，便于处理从索引 0 开始的子数组。",
    mapSnapshot: [[0, 1]],
  });

  numbers.forEach((num, idx) => {
    prefixSum += num;

    steps.push({
      action: "add",
      index: idx,
      value: num,
      prefixSum,
      target: k,
      matches: [...matches],
      description: `处理索引 ${idx} 的元素 ${num}，当前前缀和值为 ${prefixSum}。`,
      mapSnapshot: Array.from(prefixMap.entries()),
    });

    const targetPrefix = prefixSum - k;
    const targetCount = prefixMap.get(targetPrefix) ?? 0;
    if (targetCount > 0) {
      const newMatches = [...matches];
      for (let i = 0; i < targetCount; i++) {
        newMatches.push(idx);
      }
      matches.splice(0, matches.length, ...newMatches);

      steps.push({
        action: "match",
        index: idx,
        value: num,
        prefixSum,
        target: k,
        matches: [...matches],
        description:
          targetCount === 1
            ? `前缀和 ${targetPrefix} 已出现过，说明存在子数组以索引 ${idx} 结尾且和为 ${k}，累计 +${targetCount}。`
            : `前缀和 ${targetPrefix} 出现过 ${targetCount} 次，对应 ${targetCount} 个以索引 ${idx} 结尾的子数组和为 ${k}。`,
        mapSnapshot: Array.from(prefixMap.entries()),
      });
    }

    prefixMap.set(prefixSum, (prefixMap.get(prefixSum) ?? 0) + 1);
    steps.push({
      action: "record",
      index: idx,
      value: num,
      prefixSum,
      target: k,
      matches: [...matches],
      description: `将当前前缀和 ${prefixSum} 记录到哈希表中，出现次数为 ${prefixMap.get(prefixSum)}。`,
      mapSnapshot: Array.from(prefixMap.entries()),
    });
  });

  return steps;
};

export default function SubarraySumAnimation() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY);
  const [kInput, setKInput] = useState(DEFAULT_K);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [targetK, setTargetK] = useState(0);
  const [steps, setSteps] = useState<StepSnapshot[]>([]);

  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [currentPrefix, setCurrentPrefix] = useState(0);
  const [currentMatches, setCurrentMatches] = useState<number[]>([]);
  const [currentAction, setCurrentAction] = useState<StepAction | null>(null);
  const [mapSnapshot, setMapSnapshot] = useState<Array<[number, number]>>([]);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [arrayError, setArrayError] = useState<string | null>(null);
  const [kError, setKError] = useState<string | null>(null);
  const processedStepRef = useRef(-1);

  const initializeState = useCallback(
    (values: number[], target: number, autoPlay = false) => {
      const normalizedNumbers = values.slice(0, MAX_NUMBERS);
      const generatedSteps = buildSteps(normalizedNumbers, target);

      setNumbers(normalizedNumbers);
      setTargetK(target);
      setSteps(generatedSteps);
      setStepIndex(0);
      setIsPlaying(autoPlay && generatedSteps.length > 0);
      setCurrentIndex(null);
      setCurrentPrefix(0);
      setCurrentMatches([]);
      setCurrentAction(null);
      setMapSnapshot(generatedSteps.length ? generatedSteps[0].mapSnapshot : []);
      setLogs([]);
      processedStepRef.current = -1;
    },
    []
  );

  useEffect(() => {
    const defaultNumbers = parseNumbers(DEFAULT_ARRAY);
    const defaultK = Number(DEFAULT_K);
    initializeState(defaultNumbers, defaultK);
  }, [initializeState]);

  const nextStep = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= steps.length) {
        setIsPlaying(false);
        return prev;
      }

      const alreadyProcessed = processedStepRef.current === prev;
      const nextIdx = prev + 1;

      if (!alreadyProcessed) {
        processedStepRef.current = prev;
        const step = steps[prev];

        setCurrentAction(step.action);
        setCurrentIndex(step.index);
        setCurrentPrefix(step.prefixSum);
        setCurrentMatches(step.matches);
        setMapSnapshot(step.mapSnapshot);

        setLogs((prevLogs) => {
          const nextLogs = [
            ...prevLogs,
            {
              step: prev + 1,
              action: step.action,
              description: step.description,
            },
          ];
          return nextLogs.slice(-14);
        });
      }

      if (nextIdx >= steps.length) {
        setIsPlaying(false);
      }

      return nextIdx;
    });
  }, [steps]);

  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= steps.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      nextStep();
    }, 1400);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, steps.length, nextStep]);

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedNumbers = parseNumbers(arrayInput);
    if (!parsedNumbers.length) {
      setArrayError("请输入至少一个数字，使用逗号或空格分隔。");
      return;
    }

    if (parsedNumbers.some((num) => Number.isNaN(num))) {
      setArrayError("存在无效数字，请重新输入。");
      return;
    }

    if (parsedNumbers.length > MAX_NUMBERS) {
      setArrayError(`为便于展示，请输入不超过 ${MAX_NUMBERS} 个数字。`);
      return;
    }

    const trimmedK = kInput.trim();
    if (!trimmedK) {
      setKError("请输入目标和 k。");
      return;
    }

    const parsedK = Number(trimmedK);
    if (Number.isNaN(parsedK)) {
      setKError("k 必须为有效数字。");
      return;
    }

    setArrayError(null);
    setKError(null);
    initializeState(parsedNumbers, parsedK);
  };

  const handleReset = () => {
    initializeState(numbers, targetK);
  };

  const togglePlay = () => {
    if (!steps.length) return;
    if (stepIndex >= steps.length) {
      initializeState(numbers, targetK, true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const progress = useMemo(() => {
    if (!steps.length) return 0;
    return Math.min(stepIndex / steps.length, 1);
  }, [stepIndex, steps]);

  const isComplete = stepIndex >= steps.length && steps.length > 0;

  const totalMatches = useMemo(() => {
    if (!steps.length) return 0;
    const lastMatchStep = [...steps].reverse().find((step) => step.action === "match");
    return lastMatchStep ? lastMatchStep.matches.length : 0;
  }, [steps]);

  return (
    <div className="w-full min-h-[520px] rounded-lg bg-gradient-to-br from-background via-background/70 to-muted/20 p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">和为 K 的子数组 - 前缀和 + 哈希表演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          通过累加前缀和并查询哈希表中记录的前缀差值，在线性时间统计所有和为 k 的子数组。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
            <form
              onSubmit={handleApply}
              className="flex flex-col gap-3 md:flex-row md:items-center"
            >
              <div className="flex-1 space-y-2">
                <Input
                  value={arrayInput}
                  onChange={(event) => setArrayInput(event.target.value)}
                  placeholder="输入数组，例如: 1, 2, 3, -2, 5"
                />
                {arrayError && (
                  <p className="text-xs text-destructive">{arrayError}</p>
                )}
              </div>
              <div className="w-full md:w-36 space-y-2">
                <Input
                  value={kInput}
                  onChange={(event) => setKInput(event.target.value)}
                  placeholder="目标 k"
                />
                {kError && <p className="text-xs text-destructive">{kError}</p>}
              </div>
              <Button type="submit" variant="secondary">
                应用参数
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              当前示例：nums = [{numbers.join(", ")}], k = {targetK}
            </p>
          </div>

          <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={togglePlay}
                  variant="default"
                  disabled={!steps.length}
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
                  disabled={isPlaying || !steps.length || isComplete}
                  className="flex items-center gap-2"
                >
                  <StepForward className="h-4 w-4" />
                  单步
                </Button>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  重置
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                步骤 {Math.min(stepIndex + 1, steps.length || 1)} /{" "}
                {steps.length || 1}
              </div>
            </div>

            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden mb-6">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              {numbers.length ? (
                numbers.map((num, idx) => {
                  const isCurrent = currentIndex === idx && currentAction !== "record";
                  const isMatched = currentMatches.includes(idx);

                  const cellClasses = cn(
                    "w-20 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-lg font-semibold transition-all duration-200 relative",
                    isCurrent
                      ? "border-primary/80 bg-primary/10 text-primary shadow-lg shadow-primary/25"
                      : "border-muted bg-muted/30 text-foreground",
                    isMatched ? "ring-2 ring-amber-500/70" : ""
                  );

                  return (
                    <div
                      key={`${idx}-${num}`}
                      className="flex flex-col items-center gap-3"
                    >
                      <motion.div
                        className={cellClasses}
                        animate={{ y: isCurrent ? -10 : 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 280,
                          damping: 18,
                        }}
                      >
                        <span>{num}</span>
                        <span className="text-[11px] text-muted-foreground">
                          索引 {idx}
                        </span>
                      </motion.div>
                      {isMatched && (
                        <motion.span
                          layout
                          className="text-[10px] font-semibold text-amber-500"
                        >
                          命中
                        </motion.span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground">
                  当前数组为空。
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-background/70 p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                当前前缀和
              </div>
              <div className="mt-2 text-lg font-semibold">
                {currentAction ? currentPrefix : 0}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                目标 k = {targetK}
              </div>
              <div className="mt-1 text-sm text-muted-foreground/80">
                需要寻找的前缀差值：{currentAction ? currentPrefix - targetK : -targetK}
              </div>
            </div>
            <div className="rounded-xl border bg-background/70 p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                命中次数
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Sigma className="h-4 w-4" />
                已累计 {currentMatches.length} 个和为 k 的子数组
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                最终答案将等于所有命中次数的总和。
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-background/70 p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              前缀和哈希表快照
            </div>
            {mapSnapshot.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mapSnapshot.map(([prefix, count]) => (
                  <div
                    key={prefix}
                    className={cn(
                      "rounded-lg border p-3 text-sm transition-colors duration-200",
                      currentAction === "match" &&
                        currentPrefix - targetK === prefix
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-600"
                        : "border-border/60 bg-background/60"
                    )}
                  >
                    <div className="text-base font-semibold mb-1">
                      前缀和 {prefix}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      出现次数：{count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                哈希表暂时为空。
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold">执行日志</h4>
            <span className="text-xs text-muted-foreground">
              共 {steps.length} 步
            </span>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                点击播放或单步执行，观察前缀和与哈希表的变化。
              </p>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {[...logs].reverse().map((log) => (
                    <motion.li
                      key={log.step}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-lg border border-border/60 bg-background/60 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{ACTION_LABELS[log.action]}</span>
                        <span>步骤 {log.step}</span>
                      </div>
                      <p className="text-sm leading-snug text-foreground">
                        {log.description}
                      </p>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
