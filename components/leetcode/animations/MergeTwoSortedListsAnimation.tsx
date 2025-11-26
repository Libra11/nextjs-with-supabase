"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, StepForward, Pointer } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST_A = [1, 2, 4];
const DEFAULT_LIST_B = [1, 3, 4];
const MAX_LENGTH = 8;
const STEP_INTERVAL = 1500;

type StepPhase =
  | "init"
  | "compare"
  | "append"
  | "attach-remaining"
  | "done";

const PHASE_LABELS: Record<StepPhase, string> = {
  init: "初始化",
  compare: "比较节点",
  append: "拼接节点",
  "attach-remaining": "追加剩余",
  done: "结束",
};

type ListOrigin = "A" | "B";

interface MergedNode {
  origin: ListOrigin;
  index: number;
  value: number;
}

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  pointerA: number | null;
  pointerB: number | null;
  comparison: {
    pointerA: number | null;
    pointerB: number | null;
  } | null;
  selectedNode: {
    origin: ListOrigin;
    index: number;
    value: number;
  } | null;
  mergedNodes: MergedNode[];
  consumedA: number[];
  consumedB: number[];
}

interface AnimationData {
  listA: number[];
  listB: number[];
  steps: StepState[];
}

const formatNodeLabel = (values: number[], index: number | null) => {
  if (index === null || index < 0 || index >= values.length) {
    return "null";
  }
  return `${values[index]} (索引 ${index})`;
};

const buildMergeSteps = (listA: number[], listB: number[]): StepState[] => {
  const steps: StepState[] = [];
  const merged: MergedNode[] = [];
  const consumedA = new Set<number>();
  const consumedB = new Set<number>();

  let pointerA: number | null = listA.length ? 0 : null;
  let pointerB: number | null = listB.length ? 0 : null;

  const cloneMerged = () => merged.map((node) => ({ ...node }));
  const snapshotConsumed = () => ({
    consumedA: Array.from(consumedA).sort((a, b) => a - b),
    consumedB: Array.from(consumedB).sort((a, b) => a - b),
  });

  const pushStep = (
    phase: StepPhase,
    description: string,
    overrides?: Partial<StepState>,
  ) => {
    const consumedSnapshot = snapshotConsumed();
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      pointerA,
      pointerB,
      comparison: null,
      selectedNode: null,
      mergedNodes: cloneMerged(),
      consumedA: consumedSnapshot.consumedA,
      consumedB: consumedSnapshot.consumedB,
      ...overrides,
    });
  };

  if (!listA.length && !listB.length) {
    pushStep(
      "init",
      "两个链表均为空，初始化后直接返回空链表。",
    );
    pushStep("done", "合并完成，结果为空链表。", {
      pointerA: null,
      pointerB: null,
    });
    return steps;
  }

  pushStep(
    "init",
    `初始化完成：l1 指向 ${formatNodeLabel(listA, pointerA)}, l2 指向 ${formatNodeLabel(listB, pointerB)}。`,
  );

  while (pointerA !== null || pointerB !== null) {
    if (pointerA !== null && pointerB !== null) {
      const valueA = listA[pointerA];
      const valueB = listB[pointerB];

      pushStep(
        "compare",
        `比较 l1 当前节点 ${formatNodeLabel(listA, pointerA)} 与 l2 当前节点 ${formatNodeLabel(listB, pointerB)}。`,
        {
          comparison: {
            pointerA,
            pointerB,
          },
        },
      );

      if (valueA <= valueB) {
        const selectedIndex = pointerA;
        merged.push({ origin: "A", index: selectedIndex, value: valueA });
        consumedA.add(selectedIndex);
        pointerA = selectedIndex + 1 < listA.length ? selectedIndex + 1 : null;

        pushStep(
          "append",
          `l1 节点 ${valueA} 更小，拼接到新链表尾部。`,
          {
            selectedNode: {
              origin: "A",
              index: selectedIndex,
              value: valueA,
            },
          },
        );
      } else {
        const selectedIndex = pointerB;
        merged.push({ origin: "B", index: selectedIndex, value: valueB });
        consumedB.add(selectedIndex);
        pointerB = selectedIndex + 1 < listB.length ? selectedIndex + 1 : null;

        pushStep(
          "append",
          `l2 节点 ${valueB} 更小，拼接到新链表尾部。`,
          {
            selectedNode: {
              origin: "B",
              index: selectedIndex,
              value: valueB,
            },
          },
        );
      }
    } else if (pointerA !== null) {
      const valueA = listA[pointerA];
      const selectedIndex = pointerA;
      merged.push({ origin: "A", index: selectedIndex, value: valueA });
      consumedA.add(selectedIndex);
      pointerA = selectedIndex + 1 < listA.length ? selectedIndex + 1 : null;

      pushStep(
        "attach-remaining",
        `l2 已耗尽，直接追加 l1 剩余节点 ${formatNodeLabel(listA, selectedIndex)}。`,
        {
          selectedNode: {
            origin: "A",
            index: selectedIndex,
            value: valueA,
          },
        },
      );
    } else if (pointerB !== null) {
      const valueB = listB[pointerB];
      const selectedIndex = pointerB;
      merged.push({ origin: "B", index: selectedIndex, value: valueB });
      consumedB.add(selectedIndex);
      pointerB = selectedIndex + 1 < listB.length ? selectedIndex + 1 : null;

      pushStep(
        "attach-remaining",
        `l1 已耗尽，直接追加 l2 剩余节点 ${formatNodeLabel(listB, selectedIndex)}。`,
        {
          selectedNode: {
            origin: "B",
            index: selectedIndex,
            value: valueB,
          },
        },
      );
    }
  }

  pushStep("done", "合并完成，返回 dummy.next（新链表的头节点）。", {
    pointerA: null,
    pointerB: null,
  });

  return steps;
};

const parseValuesInput = (input: string, label: string): number[] => {
  const segments = input
    .split(/[\s,，、,]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return [];
  }

  if (segments.length > MAX_LENGTH) {
    throw new Error(`${label} 节点数量不能超过 ${MAX_LENGTH} 个。`);
  }

  const values = segments.map((segment) => {
    const value = Number(segment);
    if (Number.isNaN(value)) {
      throw new Error(`${label} 中检测到无效数字 "${segment}"。`);
    }
    return value;
  });

  return values;
};

const buildAnimationData = (listA: number[], listB: number[]): AnimationData => {
  const sanitizedA = listA.slice(0, MAX_LENGTH);
  const sanitizedB = listB.slice(0, MAX_LENGTH);

  return {
    listA: sanitizedA,
    listB: sanitizedB,
    steps: buildMergeSteps(sanitizedA, sanitizedB),
  };
};

export default function MergeTwoSortedListsAnimation() {
  const [listAInput, setListAInput] = useState(DEFAULT_LIST_A.join(", "));
  const [listBInput, setListBInput] = useState(DEFAULT_LIST_B.join(", "));
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_LIST_A, DEFAULT_LIST_B),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { listA, listB, steps } = animationData;
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

  const consumedASet = useMemo(
    () => new Set(currentStep.consumedA ?? []),
    [currentStep.consumedA],
  );

  const consumedBSet = useMemo(
    () => new Set(currentStep.consumedB ?? []),
    [currentStep.consumedB],
  );

  const currentComparisonA = currentStep.comparison?.pointerA ?? null;
  const currentComparisonB = currentStep.comparison?.pointerB ?? null;
  const selectedNode = currentStep.selectedNode ?? null;

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
      const parsedA = parseValuesInput(listAInput, "链表 l1");
      const parsedB = parseValuesInput(listBInput, "链表 l2");
      const data = buildAnimationData(parsedA, parsedB);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);
      setListAInput(parsedA.join(", "));
      setListBInput(parsedB.join(", "));
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message);
      } else {
        setInputError("解析输入时发生错误，请检查格式。");
      }
    }
  };

  const handleRestoreDefaults = () => {
    const data = buildAnimationData(DEFAULT_LIST_A, DEFAULT_LIST_B);
    setAnimationData(data);
    setListAInput(DEFAULT_LIST_A.join(", "));
    setListBInput(DEFAULT_LIST_B.join(", "));
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const renderListNode = (
    value: number,
    index: number,
    origin: ListOrigin,
    pointer: number | null,
    consumedSet: Set<number>,
  ) => {
    const isPointer = pointer === index;
    const isConsumed = consumedSet.has(index);
    const isCompared =
      (origin === "A" && currentComparisonA === index) ||
      (origin === "B" && currentComparisonB === index);

    return (
      <motion.div
        key={`${origin}-${index}`}
        layout
        className={cn(
          "relative flex flex-col items-center justify-between w-28 h-40 rounded-2xl border-2 px-4 py-5 transition-all duration-300",
          isPointer
            ? "border-primary text-primary bg-primary/10 shadow-primary/20"
            : isCompared
              ? "border-indigo-500/70 text-indigo-600 bg-indigo-500/10"
              : isConsumed
                ? "border-muted text-muted-foreground bg-muted/40"
                : "border-border/70 text-foreground bg-card/70",
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {origin === "A" ? "l1" : "l2"} · 节点 {index}
          </span>
          <span className="text-2xl font-semibold">{value}</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide">
          {isPointer && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/40 text-primary flex items-center gap-1">
              <Pointer className="h-3.5 w-3.5" />
              当前
            </span>
          )}
          {!isPointer && isConsumed && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-muted-foreground/20">
              已拼接
            </span>
          )}
          {isCompared && !isPointer && !isConsumed && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/40 text-indigo-600">
              对比中
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  const renderMergedNode = (node: MergedNode, position: number) => {
    const isLatest =
      selectedNode !== null &&
      selectedNode.origin === node.origin &&
      selectedNode.index === node.index &&
      selectedNode.value === node.value &&
      position === currentStep.mergedNodes.length - 1;

    return (
      <motion.div
        key={`${node.origin}-${node.index}-${position}`}
        layout
        className={cn(
          "flex flex-col items-center justify-between w-28 h-36 rounded-2xl border-2 px-4 py-4 transition-all duration-300",
          isLatest
            ? "border-emerald-500 text-emerald-600 bg-emerald-500/10 shadow-emerald-500/20"
            : "border-border/70 text-foreground bg-card/80",
        )}
      >
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          位置 {position}
        </span>
        <span className="text-2xl font-semibold">{node.value}</span>
        <span className="text-xs text-muted-foreground">
          来自 {node.origin === "A" ? "l1" : "l2"} · 索引 {node.index}
        </span>
      </motion.div>
    );
  };

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">合并两个有序链表 - 迭代拼接演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          通过 dummy 节点辅助的迭代过程，观察两个有序链表如何被逐个拼接到同一条升序链表中。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(m + n) · 空间复杂度 O(1)</span>
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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 flex-grow">
        <div className="bg-card/80 border border-border/60 rounded-xl p-5 flex flex-col gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  链表 l1
                </h4>
                <span className="text-xs text-muted-foreground">
                  {listA.length ? `长度 ${listA.length}` : "空链表"}
                </span>
              </div>
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex items-stretch gap-4 min-w-[320px]">
                  {listA.length ? (
                    listA.map((value, idx) =>
                      renderListNode(
                        value,
                        idx,
                        "A",
                        currentStep.pointerA,
                        consumedASet,
                      ),
                    )
                  ) : (
                    <div className="flex items-center justify-center w-full h-24 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                      无节点
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  链表 l2
                </h4>
                <span className="text-xs text-muted-foreground">
                  {listB.length ? `长度 ${listB.length}` : "空链表"}
                </span>
              </div>
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex items-stretch gap-4 min-w-[320px]">
                  {listB.length ? (
                    listB.map((value, idx) =>
                      renderListNode(
                        value,
                        idx,
                        "B",
                        currentStep.pointerB,
                        consumedBSet,
                      ),
                    )
                  ) : (
                    <div className="flex items-center justify-center w-full h-24 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                      无节点
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                新链表（dummy.next）
              </h4>
              <span className="text-xs text-muted-foreground">
                {currentStep.mergedNodes?.length ?? 0} 个节点
              </span>
            </div>
            <div className="w-full overflow-x-auto pb-2">
              <div className="flex items-stretch gap-4 min-w-[320px]">
                {currentStep.mergedNodes?.length ? (
                  currentStep.mergedNodes.map((node, idx) =>
                    renderMergedNode(node, idx),
                  )
                ) : (
                  <div className="flex items-center justify-center w-full h-24 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                    尚未拼接节点
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card/80 border border-border/60 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <form onSubmit={handleApplyInputs} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  链表 l1 节点（逗号或空格分隔）
                </label>
                <Textarea
                  value={listAInput}
                  onChange={(event) => setListAInput(event.target.value)}
                  rows={3}
                  placeholder="例如：1, 2, 4"
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  链表 l2 节点（逗号或空格分隔）
                </label>
                <Textarea
                  value={listBInput}
                  onChange={(event) => setListBInput(event.target.value)}
                  rows={3}
                  placeholder="例如：1, 3, 4"
                  className="resize-none"
                />
              </div>
              {inputError && (
                <p className="text-xs text-red-500">{inputError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-[auto_auto_auto] gap-2">
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
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setListAInput("");
                    setListBInput("");
                    setAnimationData(buildAnimationData([], []));
                    setStepIndex(0);
                    setIsPlaying(false);
                    setInputError(null);
                  }}
                >
                  清空链表
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
