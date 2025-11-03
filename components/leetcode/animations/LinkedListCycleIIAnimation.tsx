"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Rabbit,
  Turtle,
  Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST = [3, 2, 0, -4];
const DEFAULT_POS = 1;
const MAX_LENGTH = 10;
const STEP_INTERVAL = 1600;

type StepPhase =
  | "init"
  | "move"
  | "collision"
  | "reset"
  | "seek-entry"
  | "entry-found"
  | "no-cycle"
  | "done";

const PHASE_LABELS: Record<StepPhase, string> = {
  init: "初始化",
  move: "指针移动",
  collision: "发现环",
  reset: "重新定位",
  "seek-entry": "寻找入口",
  "entry-found": "入口找到",
  "no-cycle": "无环结论",
  done: "结束",
};

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  slow: number | null;
  fast: number | null;
  finder: number | null;
  slowPrev: number | null;
  fastPrev: number | null;
  finderPrev: number | null;
  fastMid: number | null;
  visitedSlow: number[];
  visitedFast: number[];
  visitedFinder: number[];
  links: Array<number | null>;
  cycleEntry: number | null;
  iteration: number;
  entryIteration: number;
}

interface AnimationData {
  values: number[];
  pos: number;
  steps: StepState[];
}

const formatNodeLabel = (values: number[], index: number | null) => {
  if (index === null || index < 0 || index >= values.length) {
    return "null";
  }
  return `${values[index]} (索引 ${index})`;
};

const buildCycleEntrySteps = (values: number[], pos: number): StepState[] => {
  const n = values.length;
  const cycleEntry = pos >= 0 && pos < n ? pos : null;
  const steps: StepState[] = [];

  if (n === 0) {
    const emptyStep: StepState = {
      index: 1,
      phase: "init",
      description: "链表为空，默认认为没有环。",
      slow: null,
      fast: null,
      finder: null,
      slowPrev: null,
      fastPrev: null,
      finderPrev: null,
      fastMid: null,
      visitedSlow: [],
      visitedFast: [],
      visitedFinder: [],
      links: [],
      cycleEntry: null,
      iteration: 0,
      entryIteration: 0,
    };
    steps.push(emptyStep);
    steps.push({
      ...emptyStep,
      index: 2,
      phase: "no-cycle",
      description: "链表为空，返回 null。",
    });
    steps.push({
      ...emptyStep,
      index: 3,
      phase: "done",
      description: "检测完成，链表无环，结果为 null。",
    });
    return steps;
  }

  const links = values.map((_, idx) =>
    idx === n - 1 ? cycleEntry : idx + 1,
  );

  let slow: number | null = 0;
  let fast: number | null = 0;
  let finder: number | null = null;
  let slowPrev: number | null = null;
  let fastPrev: number | null = null;
  let finderPrev: number | null = null;
  let iteration = 0;
  let entryIteration = 0;

  const visitedSlow = new Set<number>();
  const visitedFast = new Set<number>();
  const visitedFinder = new Set<number>();

  visitedSlow.add(0);
  visitedFast.add(0);

  const pushStep = (
    phase: StepPhase,
    description: string,
    overrides?: Partial<StepState>,
  ) => {
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      slow,
      fast,
      finder,
      slowPrev,
      fastPrev,
      finderPrev,
      fastMid: null,
      visitedSlow: Array.from(visitedSlow),
      visitedFast: Array.from(visitedFast),
      visitedFinder: Array.from(visitedFinder),
      links: [...links],
      cycleEntry,
      iteration,
      entryIteration,
      ...overrides,
    });
  };

  pushStep(
    "init",
    `初始化：slow 与 fast 都指向头节点 ${formatNodeLabel(values, 0)}。`,
  );

  const MAX_ITERATIONS = Math.max(1, n * 3);
  let foundCycle = false;

  while (
    fast !== null &&
    links[fast] !== null &&
    iteration < MAX_ITERATIONS
  ) {
    const nextSlow = slow !== null ? links[slow] : null;
    const fastStepOne = links[fast];
    const nextFast = fastStepOne !== null ? links[fastStepOne] : null;

    slowPrev = slow;
    fastPrev = fast;

    slow = nextSlow;
    fast = nextFast;

    if (nextSlow !== null) {
      visitedSlow.add(nextSlow);
    }
    if (fastStepOne !== null) {
      visitedFast.add(fastStepOne);
    }
    if (nextFast !== null) {
      visitedFast.add(nextFast);
    }

    iteration += 1;

    pushStep(
      "move",
      `第 ${iteration} 轮：slow 移动到 ${formatNodeLabel(values, slow)}，fast 跳到 ${formatNodeLabel(values, fast)}。`,
      {
        fastMid: fastStepOne,
      },
    );

    if (slow !== null && fast !== null && slow === fast) {
      pushStep(
        "collision",
        `slow 与 fast 在 ${formatNodeLabel(values, slow)} 相遇，确认存在环。`,
        {
          fastMid: fastStepOne,
        },
      );
      foundCycle = true;
      break;
    }
  }

  if (!foundCycle) {
    const reason =
      iteration >= MAX_ITERATIONS
        ? `超过最大迭代次数 ${MAX_ITERATIONS} 仍未相遇，视为无环（用于防止无限循环）。`
        : fast === null
          ? "fast 指针移动到 null，说明链表存在尾节点，判定为无环。"
          : `fast 指针的下一节点为 null（${formatNodeLabel(values, fast)} -> null），说明链表无环。`;

    pushStep("no-cycle", `${reason} 返回 null。`);
    pushStep("done", "检测完成，链表无环。返回 null。");
    return steps;
  }

  const meetingNode = slow;

  fast = null;
  fastPrev = null;

  finder = 0;
  finderPrev = null;
  entryIteration = 0;
  visitedFinder.add(0);

  pushStep(
    "reset",
    `将 finder 指针重置到头节点 ${formatNodeLabel(values, finder)}，slow 保持在相遇点 ${formatNodeLabel(values, meetingNode)}。`,
  );

  while (
    finder !== null &&
    slow !== null &&
    finder !== slow &&
    entryIteration < MAX_ITERATIONS
  ) {
    const nextFinder = links[finder];
    const nextSlow = links[slow];

    finderPrev = finder;
    slowPrev = slow;

    finder = nextFinder;
    slow = nextSlow;

    if (finder !== null) {
      visitedFinder.add(finder);
    }
    if (slow !== null) {
      visitedSlow.add(slow);
    }

    entryIteration += 1;

    pushStep(
      "seek-entry",
      `寻找入口第 ${entryIteration} 步：finder 移动到 ${formatNodeLabel(values, finder)}，slow 移动到 ${formatNodeLabel(values, slow)}。`,
    );
  }

  if (finder !== null && slow !== null && finder === slow) {
    pushStep(
      "entry-found",
      `两个指针在 ${formatNodeLabel(values, slow)} 再次相遇，即为环的入口节点。`,
    );
    pushStep(
      "done",
      `检测完成，返回 ${formatNodeLabel(values, slow)} 作为环入口。`,
    );
    return steps;
  }

  pushStep(
    "done",
    "寻找入口阶段超过限制仍未相遇，结果视为 null（理论上不应发生）。",
  );

  return steps;
};

const parseListInput = (input: string): number[] => {
  const segments = input
    .split(/[\s,，、,]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length > MAX_LENGTH) {
    throw new Error(`节点数量不能超过 ${MAX_LENGTH} 个。`);
  }

  if (!segments.length) {
    return [];
  }

  const values = segments.map((segment) => {
    const value = Number(segment);
    if (Number.isNaN(value)) {
      throw new Error(`检测到无效数字 "${segment}"，请重新输入。`);
    }
    return value;
  });

  return values;
};

const parsePosInput = (input: string, length: number): number => {
  const trimmed = input.trim();
  if (!trimmed) {
    return -1;
  }

  const value = Number(trimmed);

  if (!Number.isInteger(value)) {
    throw new Error("环入口索引必须是整数。");
  }

  if (value < -1) {
    throw new Error("环入口索引不能小于 -1。");
  }

  if (length === 0) {
    if (value !== -1) {
      throw new Error("空链表只能设置 pos = -1 表示无环。");
    }
    return -1;
  }

  if (value >= length) {
    throw new Error(
      `环入口索引需在 0 到 ${length - 1} 之间，或为 -1 表示无环。`,
    );
  }

  return value;
};

const buildAnimationData = (values: number[], pos: number): AnimationData => {
  const sanitizedValues = values.slice(0, MAX_LENGTH);
  const cappedPos = sanitizedValues.length
    ? Math.min(Math.max(pos, -1), sanitizedValues.length - 1)
    : -1;

  return {
    values: sanitizedValues,
    pos: cappedPos,
    steps: buildCycleEntrySteps(sanitizedValues, cappedPos),
  };
};

export default function LinkedListCycleIIAnimation() {
  const [listInput, setListInput] = useState(DEFAULT_LIST.join(", "));
  const [posInput, setPosInput] = useState(String(DEFAULT_POS));
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_LIST, DEFAULT_POS),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { values, steps } = animationData;
  const currentStep =
    steps[stepIndex] ?? steps[steps.length - 1] ?? ({} as StepState);

  useEffect(() => {
    if (!isPlaying) return;

    if (!steps.length) {
      setIsPlaying(false);
      return;
    }

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
  }, [isPlaying, steps.length, stepIndex]);

  const progress = useMemo(() => {
    if (steps.length <= 1) {
      return stepIndex >= steps.length - 1 ? 1 : 0;
    }
    return stepIndex / (steps.length - 1);
  }, [stepIndex, steps.length]);

  const slowVisitedSet = useMemo(
    () => new Set(currentStep.visitedSlow ?? []),
    [currentStep.visitedSlow],
  );

  const fastVisitedSet = useMemo(
    () => new Set(currentStep.visitedFast ?? []),
    [currentStep.visitedFast],
  );

  const finderVisitedSet = useMemo(
    () => new Set(currentStep.visitedFinder ?? []),
    [currentStep.visitedFinder],
  );

  const displayedLogs = useMemo(
    () => steps.slice(0, Math.min(stepIndex + 1, steps.length)),
    [steps, stepIndex],
  );

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

  const handleNext = () => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleApplyInputs = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPlaying(false);

    try {
      const parsedValues = parseListInput(listInput);
      const parsedPos = parsePosInput(posInput, parsedValues.length);
      const data = buildAnimationData(parsedValues, parsedPos);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);
      setListInput(parsedValues.join(", "));
      setPosInput(String(parsedPos));
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message);
      } else {
        setInputError("解析输入时出错，请检查格式。");
      }
    }
  };

  const handleRestoreDefaults = () => {
    const data = buildAnimationData(DEFAULT_LIST, DEFAULT_POS);
    setAnimationData(data);
    setListInput(DEFAULT_LIST.join(", "));
    setPosInput(String(DEFAULT_POS));
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const currentLinks = currentStep.links ?? [];
  const fastMidIndex = currentStep.fastMid ?? null;

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">环形链表 II - 环入口定位演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          通过 Floyd 判圈算法先确认是否存在环，再演示第二阶段如何定位环的起始节点。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(n) · 空间复杂度 O(1)</span>
          {currentStep?.index && (
            <span>
              步骤 {currentStep.index} / {steps.length}
            </span>
          )}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 1) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6 flex-grow">
        <div className="bg-card/80 border border-border/60 rounded-xl p-5 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                slow
              </p>
              <p>{formatNodeLabel(values, currentStep?.slow ?? null)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                fast
              </p>
              <p>{formatNodeLabel(values, currentStep?.fast ?? null)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                finder
              </p>
              <p>{formatNodeLabel(values, currentStep?.finder ?? null)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                环入口 pos
              </p>
              <p>
                {currentStep?.cycleEntry !== null
                  ? formatNodeLabel(values, currentStep.cycleEntry)
                  : "-1 (无环)"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                迭代统计
              </p>
              <p>
                Floyd: {currentStep?.iteration ?? 0} 次 / 寻入口: {currentStep?.entryIteration ?? 0} 次
              </p>
            </div>
          </div>

          <div className="flex-1">
            {values.length ? (
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex items-stretch gap-4 min-w-[360px]">
                  {values.map((value, idx) => {
                    const isSlow = currentStep?.slow === idx;
                    const isFast = currentStep?.fast === idx;
                    const isFinder = currentStep?.finder === idx;
                    const isFastMid = fastMidIndex === idx && !isFast;
                    const isSlowTrail = slowVisitedSet.has(idx) && !isSlow;
                    const isFastTrail = fastVisitedSet.has(idx) && !isFast && !isFastMid;
                    const isFinderTrail = finderVisitedSet.has(idx) && !isFinder;
                    const isCycleEntry = currentStep?.cycleEntry === idx;
                    const nextIndex =
                      currentLinks[idx] ?? (idx < values.length - 1 ? idx + 1 : null);
                    const nextLabel =
                      nextIndex !== null && nextIndex >= 0 && nextIndex < values.length
                        ? `${values[nextIndex]} · 索引 ${nextIndex}`
                        : "null";

                    let nodeClass = "border-border/70 text-foreground bg-card/70";

                    if (isSlow && isFast && isFinder) {
                      nodeClass = "border-fuchsia-500 text-fuchsia-600 bg-fuchsia-500/10 shadow-fuchsia-500/20";
                    } else if (isSlow && isFast) {
                      nodeClass = "border-fuchsia-500 text-fuchsia-600 bg-fuchsia-500/10 shadow-fuchsia-500/20";
                    } else if ((isSlow && isFinder) || (isFast && isFinder)) {
                      nodeClass = "border-rose-500 text-rose-600 bg-rose-500/10 shadow-rose-500/20";
                    } else if (isFast) {
                      nodeClass = "border-indigo-500 text-indigo-600 bg-indigo-500/10 shadow-indigo-500/20";
                    } else if (isSlow) {
                      nodeClass = "border-primary text-primary bg-primary/10 shadow-primary/20";
                    } else if (isFinder) {
                      nodeClass = "border-emerald-500 text-emerald-600 bg-emerald-500/10 shadow-emerald-500/20";
                    } else if (isCycleEntry) {
                      nodeClass = "border-amber-500/60 text-amber-600 bg-amber-500/10";
                    } else if (isSlowTrail && isFastTrail && isFinderTrail) {
                      nodeClass = "border-sky-500/60 text-sky-600 bg-sky-500/10";
                    } else if (isSlowTrail && isFastTrail) {
                      nodeClass = "border-cyan-500/60 text-cyan-600 bg-cyan-500/10";
                    } else if (isSlowTrail && isFinderTrail) {
                      nodeClass = "border-primary/50 text-primary bg-primary/5";
                    } else if (isFastTrail && isFinderTrail) {
                      nodeClass = "border-indigo-300 text-indigo-500 bg-indigo-500/5";
                    } else if (isSlowTrail) {
                      nodeClass = "border-primary/50 text-primary bg-primary/5";
                    } else if (isFastTrail || isFastMid) {
                      nodeClass = "border-indigo-300 text-indigo-500 bg-indigo-500/5";
                    } else if (isFinderTrail) {
                      nodeClass = "border-emerald-300 text-emerald-500 bg-emerald-500/5";
                    }

                    const badgeItems: Array<{ label: string; className: string; icon?: JSX.Element }> = [];

                    if (isSlow) {
                      badgeItems.push({
                        label: "slow",
                        className: "px-2 py-0.5 rounded-full bg-primary/10 border border-primary/40 text-primary flex items-center gap-1",
                        icon: <Turtle className="h-3.5 w-3.5" />,
                      });
                    }
                    if (isFast) {
                      badgeItems.push({
                        label: "fast",
                        className: "px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/40 text-indigo-600 flex items-center gap-1",
                        icon: <Rabbit className="h-3.5 w-3.5" />,
                      });
                    }
                    if (isFinder) {
                      badgeItems.push({
                        label: "finder",
                        className: "px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 flex items-center gap-1",
                        icon: <Crosshair className="h-3.5 w-3.5" />,
                      });
                    }
                    if (!isSlow && !isFast && !isFinder && isCycleEntry) {
                      badgeItems.push({
                        label: "环入口",
                        className: "px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-600",
                      });
                    }
                    if (!isSlow && !isFast && !isFinder && isSlowTrail && !isFastTrail && !isFinderTrail) {
                      badgeItems.push({
                        label: "slow 轨迹",
                        className: "px-2 py-0.5 rounded-full bg-primary/5 border border-primary/30 text-primary",
                      });
                    }
                    if (!isSlow && !isFast && !isFinder && isFastTrail && !isSlowTrail && !isFinderTrail) {
                      badgeItems.push({
                        label: "fast 轨迹",
                        className: "px-2 py-0.5 rounded-full bg-indigo-500/5 border border-indigo-500/30 text-indigo-500",
                      });
                    }
                    if (!isSlow && !isFast && !isFinder && isFinderTrail && !isSlowTrail && !isFastTrail) {
                      badgeItems.push({
                        label: "finder 轨迹",
                        className: "px-2 py-0.5 rounded-full bg-emerald-500/5 border border-emerald-500/30 text-emerald-500",
                      });
                    }

                    return (
                      <motion.div
                        key={`${value}-${idx}`}
                        layout
                        className={cn(
                          "relative flex flex-col items-center justify-between w-32 h-48 rounded-2xl border-2 px-4 py-6 transition-all duration-300 shadow-sm",
                          nodeClass,
                        )}
                      >
                        <div className="flex items-center justify-between w-full text-[11px] uppercase tracking-wide">
                          <span className="font-semibold">节点 {idx}</span>
                        </div>

                        <span className="text-3xl font-semibold">{value}</span>

                        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                          <span className="uppercase tracking-wide">next</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full border text-[11px] font-medium",
                              nextLabel === "null"
                                ? "border-slate-300 text-slate-400"
                                : nextIndex !== null && nextIndex < idx
                                  ? "border-amber-400/60 text-amber-600"
                                  : "border-primary/40 text-primary",
                            )}
                          >
                            {nextLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-wide">
                          {badgeItems.map((item) => (
                            <span key={item.label} className={item.className}>
                              {item.icon}
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
                <p>链表为空，左侧面板展示默认结论。</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card/80 border border-border/60 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <form onSubmit={handleApplyInputs} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  链表节点（逗号或空格分隔）
                </label>
                <Textarea
                  value={listInput}
                  onChange={(event) => setListInput(event.target.value)}
                  rows={3}
                  placeholder="例如：3, 2, 0, -4"
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  环入口索引 pos（-1 表示无环）
                </label>
                <Input
                  value={posInput}
                  onChange={(event) => setPosInput(event.target.value)}
                  placeholder="例如：1"
                />
              </div>
              {inputError && (
                <p className="text-xs text-red-500">{inputError}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" size="sm">
                  应用输入
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRestoreDefaults}
                >
                  恢复默认示例
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-5 border-t border-border/60">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={handlePlayToggle}>
                  {isPlaying ? (
                    <span className="flex items-center gap-1">
                      <Pause className="h-4 w-4" />
                      暂停
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      播放
                    </span>
                  )}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleNext}>
                  <span className="flex items-center gap-1">
                    <StepForward className="h-4 w-4" />
                    下一步
                  </span>
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                  <span className="flex items-center gap-1">
                    <RotateCcw className="h-4 w-4" />
                    重置
                  </span>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {isPlaying ? "自动播放中" : "手动控制模式"}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep?.index ?? "empty"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-sm leading-relaxed text-foreground">
                    {currentStep?.description ?? "尚无步骤信息。"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-4 space-y-3 max-h-52 overflow-y-auto pr-1">
              <AnimatePresence>
                {displayedLogs.map((step) => (
                  <motion.div
                    key={step.index}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wide mb-1">
                      <span className="font-semibold text-foreground">
                        步骤 {step.index}
                      </span>
                      <span className="text-muted-foreground">
                        {PHASE_LABELS[step.phase]}
                      </span>
                    </div>
                    <p className="leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
