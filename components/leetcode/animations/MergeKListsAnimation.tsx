"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pause, Play, RefreshCcw, RotateCcw, StepForward } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LISTS = [
  [1, 4, 5],
  [1, 3, 4],
  [2, 6],
];

const DEFAULT_INPUT = JSON.stringify(DEFAULT_LISTS);
const MAX_LISTS = 6;
const MAX_NODES = 28;
const STEP_INTERVAL = 1700;

type StepPhase =
  | "empty"
  | "init"
  | "round-start"
  | "select-pair"
  | "merge-result"
  | "round-complete"
  | "done";

interface NodeState {
  id: string;
  value: number;
  originList: number;
  originIndex: number;
}

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  round: number;
  pairIndex: number | null;
  leftIndex: number | null;
  rightIndex: number | null;
  resultIndex: number | null;
  currentLists: NodeState[][];
  nextLists: NodeState[][];
  totalLists: number;
}

interface AnimationData {
  lists: number[][];
  totalNodes: number;
  steps: StepState[];
}

const phaseLabels: Record<StepPhase, string> = {
  empty: "空输入",
  init: "初始化",
  "round-start": "新一轮分治",
  "select-pair": "选择链表对",
  "merge-result": "合并完成",
  "round-complete": "轮次收束",
  done: "完成",
};

const phaseHints: Record<StepPhase, string> = {
  empty: "没有有效链表，直接返回 null",
  init: "预处理输入，准备分治",
  "round-start": "按照固定配对准备合并",
  "select-pair": "当前配对的两条链表",
  "merge-result": "得到一条新的有序链表",
  "round-complete": "进入下一轮，列表数量减半",
  done: "所有链表已合并为最终结果",
};

const cloneLists = (lists: NodeState[][]): NodeState[][] =>
  lists.map((list) => list.map((node) => ({ ...node })));

const mergeNodeLists = (left: NodeState[], right: NodeState[]): NodeState[] => {
  const merged: NodeState[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (left[i].value <= right[j].value) {
      merged.push({ ...left[i] });
      i += 1;
    } else {
      merged.push({ ...right[j] });
      j += 1;
    }
  }

  while (i < left.length) {
    merged.push({ ...left[i] });
    i += 1;
  }

  while (j < right.length) {
    merged.push({ ...right[j] });
    j += 1;
  }

  return merged;
};

const buildMergeSteps = (lists: number[][]): StepState[] => {
  const steps: StepState[] = [];
  const nodeLists: NodeState[][] = lists.map((list, listIdx) =>
    list.map((value, valueIdx) => ({
      id: `L${listIdx}-N${valueIdx}`,
      value,
      originList: listIdx,
      originIndex: valueIdx,
    })),
  );

  const totalNodes = nodeLists.reduce((sum, list) => sum + list.length, 0);

  const pushStep = (
    phase: StepPhase,
    description: string,
    round: number,
    overrides?: Partial<StepState>,
  ) => {
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      round,
      pairIndex: null,
      leftIndex: null,
      rightIndex: null,
      resultIndex: null,
      currentLists: [],
      nextLists: [],
      totalLists: overrides?.currentLists?.length ?? 0,
      ...overrides,
    });
  };

  if (!nodeLists.length || totalNodes === 0) {
    pushStep("empty", "所有链表均为空，直接返回空链表。", 0, {
      currentLists: cloneLists(nodeLists),
      nextLists: [],
      totalLists: nodeLists.length,
    });
    pushStep("done", "合并完成，结果仍为空。", 0, {
      currentLists: [],
      nextLists: [],
      totalLists: 0,
    });
    return steps;
  }

  let currentLists = cloneLists(nodeLists);
  let round = 1;

  pushStep(
    "init",
    `共 ${nodeLists.length} 条链表，总节点数 ${totalNodes}，准备使用分治法合并。`,
    round,
    {
      currentLists: cloneLists(currentLists),
      nextLists: [],
      totalLists: currentLists.length,
    },
  );

  while (currentLists.length > 1) {
    const nextLists: NodeState[][] = [];

    pushStep(
      "round-start",
      `第 ${round} 轮开始：需要处理 ${currentLists.length} 条链表，并将其两两合并。`,
      round,
      {
        currentLists: cloneLists(currentLists),
        nextLists: cloneLists(nextLists),
        totalLists: currentLists.length,
      },
    );

    for (let i = 0; i < currentLists.length; i += 2) {
      const left = currentLists[i];
      const right = currentLists[i + 1];
      const pairIndex = Math.floor(i / 2);

      pushStep(
        "select-pair",
        right
          ? `选择第 ${pairIndex + 1} 对：链表 ${i + 1} 与链表 ${i + 2}，准备合并。`
          : `链表 ${i + 1} 无配对对象，直接传递到下一轮。`,
        round,
        {
          pairIndex,
          leftIndex: i,
          rightIndex: right ? i + 1 : null,
          currentLists: cloneLists(currentLists),
          nextLists: cloneLists(nextLists),
          totalLists: currentLists.length,
        },
      );

      if (right) {
        const merged = mergeNodeLists(left, right);
        nextLists.push(merged);
        pushStep(
          "merge-result",
          `完成该对合并，得到新链表：${merged
            .map((node) => node.value)
            .join(" → ") || "空"}。`,
          round,
          {
            pairIndex,
            leftIndex: i,
            rightIndex: i + 1,
            resultIndex: nextLists.length - 1,
            currentLists: cloneLists(currentLists),
            nextLists: cloneLists(nextLists),
            totalLists: currentLists.length,
          },
        );
      } else {
        nextLists.push(left.map((node) => ({ ...node })));
        pushStep(
          "merge-result",
          `该链表没有配对，直接进入下一轮。`,
          round,
          {
            pairIndex,
            leftIndex: i,
            rightIndex: null,
            resultIndex: nextLists.length - 1,
            currentLists: cloneLists(currentLists),
            nextLists: cloneLists(nextLists),
            totalLists: currentLists.length,
          },
        );
      }
    }

    currentLists = cloneLists(nextLists);
    round += 1;

    pushStep(
      "round-complete",
      `本轮结束，链表数量变为 ${currentLists.length}。`,
      round,
      {
        currentLists: cloneLists(currentLists),
        nextLists: [],
        totalLists: currentLists.length,
      },
    );
  }

  pushStep(
    "done",
    `全部合并完成，最终链表为：${
      currentLists[0]?.map((node) => node.value).join(" → ") ?? "空"
    }。`,
    round,
    {
      currentLists: cloneLists(currentLists),
      nextLists: [],
      totalLists: currentLists.length,
    },
  );

  return steps;
};

const buildAnimationData = (lists: number[][]): AnimationData => {
  const trimmed = lists.slice(0, MAX_LISTS).map((list) => list.slice());
  let used = 0;

  for (let i = 0; i < trimmed.length; i += 1) {
    for (let j = 0; j < trimmed[i].length; j += 1) {
      used += 1;
      if (used > MAX_NODES) {
        trimmed[i] = trimmed[i].slice(0, trimmed[i].length - (used - MAX_NODES));
        used = MAX_NODES;
        break;
      }
    }
    if (used === MAX_NODES) break;
  }

  const steps = buildMergeSteps(trimmed);
  return {
    lists: trimmed,
    totalNodes: trimmed.reduce((sum, list) => sum + list.length, 0),
    steps,
  };
};

const parseListsInput = (input: string): number[][] => {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error("请输入合法的 JSON 数组，例如 [[1,4,5],[1,3,4],[2,6]]。");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("输入必须是二维数组，每个元素表示一条链表。");
  }

  if (parsed.length > MAX_LISTS) {
    throw new Error(`链表数量不能超过 ${MAX_LISTS} 条。`);
  }

  const result = (parsed as unknown[]).map((entry, listIdx) => {
    if (!Array.isArray(entry)) {
      throw new Error(`链表 ${listIdx + 1} 不是数组。`);
    }
    const list = entry.map((value, valueIdx) => {
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error(
          `链表 ${listIdx + 1} 的第 ${valueIdx + 1} 个元素不是有效数字。`,
        );
      }
      return value;
    });
    return list;
  });

  const totalNodes = result.reduce((sum, list) => sum + list.length, 0);
  if (totalNodes > MAX_NODES) {
    throw new Error(
      `节点总数不能超过 ${MAX_NODES} 个，当前为 ${totalNodes} 个。`,
    );
  }

  return result;
};

export default function MergeKListsAnimation() {
  const [listInput, setListInput] = useState(DEFAULT_INPUT);
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_LISTS),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { steps } = animationData;
  const currentStep =
    steps[stepIndex] ?? steps[steps.length - 1] ?? ({} as StepState);

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

  const progress = useMemo(() => {
    if (!steps.length) return 0;
    if (steps.length === 1) {
      return stepIndex >= steps.length - 1 ? 1 : 0;
    }
    return stepIndex / (steps.length - 1);
  }, [stepIndex, steps.length]);

  const totalListsCurrent = currentStep?.currentLists?.length ?? 0;
  const totalNextLists = currentStep?.nextLists?.length ?? 0;

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
      const parsed = parseListsInput(listInput);
      const data = buildAnimationData(parsed);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);
      setListInput(JSON.stringify(parsed));
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message);
      } else {
        setInputError("解析输入时出错，请检查格式。");
      }
    }
  };

  const handleRestoreDefaults = () => {
    const data = buildAnimationData(DEFAULT_LISTS);
    setAnimationData(data);
    setListInput(DEFAULT_INPUT);
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const displayedLogs = steps.slice(0, stepIndex + 1);
  const phaseLabel = currentStep ? phaseLabels[currentStep.phase] : "";
  const phaseHint = currentStep ? phaseHints[currentStep.phase] : "等待输入";

  const renderListCard = (
    list: NodeState[],
    listIndex: number,
    type: "current" | "next",
  ) => {
    const status = (() => {
      if (type === "current") {
        if (currentStep.leftIndex === listIndex) return "left";
        if (currentStep.rightIndex === listIndex) return "right";
      } else if (type === "next" && currentStep.resultIndex === listIndex) {
        return "result";
      }
      return "default";
    })();

    const statusStyles: Record<string, string> = {
      left: "border-sky-500/70 text-sky-600 bg-sky-500/10",
      right: "border-amber-500/70 text-amber-600 bg-amber-500/10",
      result: "border-primary text-primary bg-primary/10 shadow-primary/30",
      default: "border-border/70 text-foreground bg-card/70",
    };

    const badgeLabels: Record<string, string> = {
      left: "左链表",
      right: "右链表",
      result: "新结果",
      default: "",
    };

    return (
      <motion.div
        key={`${type}-${listIndex}-${currentStep?.index ?? 0}`}
        layout
        className={cn(
          "relative flex flex-col gap-3 w-44 min-h-[140px] border-2 rounded-2xl p-4 transition-all duration-300",
          statusStyles[status] ?? statusStyles.default,
        )}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{type === "current" ? `链表 ${listIndex + 1}` : `结果 ${listIndex + 1}`}</span>
          <span>{list.length ? `${list.length} 个节点` : "空"}</span>
        </div>
        {status !== "default" && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border border-white/20 bg-white/10 text-white">
            {badgeLabels[status]}
          </span>
        )}
        {list.length ? (
          <div className="flex flex-wrap gap-2">
            {list.map((node) => (
              <span
                key={node.id}
                className="px-2 py-0.5 rounded-full bg-background/80 border border-border/60 text-sm"
              >
                {node.value}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">空链表</div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="w-full min-h-[560px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">合并 K 个升序链表 · 分治演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          展示两两合并的分治流程，以及每一轮链表数量如何缩减。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(Kn log K) · 空间复杂度 O(log K)</span>
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
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6 flex-grow">
        <div className="bg-card/80 border border-border/60 rounded-xl p-5 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                当前阶段
              </p>
              <p className="text-sm font-semibold text-foreground">{phaseLabel}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{phaseHint}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                当前轮次
              </p>
              <p className="text-sm font-semibold text-foreground">
                {currentStep?.round ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                pair = ⌈k / 2⌉
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                链表数量
              </p>
              <p className="text-sm font-semibold text-foreground">
                {totalListsCurrent} → {totalNextLists || (currentStep?.phase === "done" ? 1 : Math.ceil(totalListsCurrent / 2))}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                每轮最多减半
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
            <div className="border border-border/70 rounded-xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                <span>本轮链表</span>
                <span>数量 {totalListsCurrent}</span>
              </div>
              <div className="flex flex-wrap gap-4 overflow-y-auto">
                {currentStep?.currentLists?.length ? (
                  currentStep.currentLists.map((list, idx) =>
                    renderListCard(list, idx, "current"),
                  )
                ) : (
                  <div className="text-sm text-muted-foreground">
                    当前没有链表。
                  </div>
                )}
              </div>
            </div>

            <div className="border border-border/70 rounded-xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                <span>下一轮预览</span>
                <span>已生成 {totalNextLists}</span>
              </div>
              <div className="flex flex-wrap gap-4 overflow-y-auto">
                {currentStep?.nextLists?.length ? (
                  currentStep.nextLists.map((list, idx) =>
                    renderListCard(list, idx, "next"),
                  )
                ) : (
                  <div className="text-sm text-muted-foreground">
                    等待合并结果。
                  </div>
                )}
              </div>
            </div>
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
            <span className="text-xs text-muted-foreground">{phaseHint}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card/80 border border-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCcw className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-muted-foreground">
                当前推理
              </p>
            </div>
            {currentStep ? (
              <p className="text-sm leading-relaxed text-foreground">
                {currentStep.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                输入链表后点击应用即可开始演示。
              </p>
            )}
          </div>

          <div className="bg-card/80 border border-border/60 rounded-xl p-4 flex-1">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              步骤记录
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {displayedLogs.map((step) => (
                  <motion.div
                    key={step.index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="border border-border/60 bg-background/80 rounded-lg px-3 py-2 text-sm"
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      步骤 {step.index}
                    </p>
                    <p className="text-sm text-foreground">{step.description}</p>
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
                  链表数组（JSON 格式，最多 {MAX_LISTS} 条）
                </label>
                <Textarea
                  value={listInput}
                  onChange={(event) => setListInput(event.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                  placeholder="例如：[[1,4,5],[1,3,4],[2,6]]"
                />
                <p className="text-[11px] text-muted-foreground">
                  支持空链表，节点总数上限 {MAX_NODES}。
                </p>
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
