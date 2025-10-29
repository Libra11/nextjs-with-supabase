"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, StepForward, GitMerge, Pointer } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST_A = [4, 1, 8, 4, 5];
const DEFAULT_LIST_B = [5, 6, 1, 8, 4, 5];
const DEFAULT_INTERSECTION_A = 2;
const DEFAULT_INTERSECTION_B = 3;
const MAX_NODES = 9;
const STEP_INTERVAL = 1600;

type NodeCategory = "uniqueA" | "uniqueB" | "shared";

interface NodeRef {
  id: string;
  value: number;
  next: NodeRef | null;
}

interface NodeMeta {
  id: string;
  value: number;
  category: NodeCategory;
}

interface RowNode {
  id: string;
  value: number;
  column: number;
  isShared: boolean;
  index: number;
}

interface RowLayout {
  key: "A" | "B";
  label: string;
  nodes: RowNode[];
}

interface BuildStructureResult {
  headA: NodeRef | null;
  headB: NodeRef | null;
  rowLayouts: {
    A: RowLayout;
    B: RowLayout;
  };
  totalColumns: number;
  nodesById: Record<string, NodeMeta>;
  sharedLength: number;
  intersectionExists: boolean;
}

type StepAction = "init" | "move" | "found" | "end";

interface StepState {
  index: number;
  pointerA: string | null;
  pointerB: string | null;
  pointerADesc: string;
  pointerBDesc: string;
  description: string;
  action: StepAction;
}

interface AnimationData {
  structure: BuildStructureResult;
  steps: StepState[];
}

const parseListInput = (input: string, label: string): number[] => {
  const segments = input
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    throw new Error(`${label} 至少需要一个节点。`);
  }

  if (segments.length > MAX_NODES) {
    throw new Error(`${label} 节点数不能超过 ${MAX_NODES} 个。`);
  }

  const values = segments.map((segment) => {
    const value = Number(segment);
    if (Number.isNaN(value)) {
      throw new Error(`${label} 中存在无效数字 "${segment}"。`);
    }
    return value;
  });

  return values;
};

const parseIndexInput = (
  input: string,
  label: string,
  maxLength: number
): number | null => {
  const trimmed = input.trim();
  if (!trimmed.length) {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value)) {
    throw new Error(`${label} 必须是整数或留空。`);
  }

  if (value < 0) {
    return null;
  }

  if (value >= maxLength) {
    throw new Error(`${label} 必须在 0 到 ${maxLength - 1} 之间。`);
  }

  return value;
};

const buildLinkedListStructure = (
  listA: number[],
  listB: number[],
  intersectionIndexA: number | null,
  intersectionIndexB: number | null
): BuildStructureResult => {
  let nodeCounter = 0;
  const createNode = (value: number): NodeRef => ({
    id: `node-${nodeCounter++}`,
    value,
    next: null,
  });

  const nodesById: Record<string, NodeMeta> = {};
  const registerNode = (node: NodeRef, category: NodeCategory) => {
    nodesById[node.id] = {
      id: node.id,
      value: node.value,
      category,
    };
  };

  const intersectionValid =
    intersectionIndexA !== null &&
    intersectionIndexB !== null &&
    intersectionIndexA >= 0 &&
    intersectionIndexB >= 0 &&
    intersectionIndexA < listA.length &&
    intersectionIndexB < listB.length;

  const sharedLength = intersectionValid
    ? listA.length - intersectionIndexA
    : 0;

  const hasIntersection = intersectionValid && sharedLength > 0;

  const uniqueA: NodeRef[] = [];
  const uniqueB: NodeRef[] = [];
  const sharedNodes: NodeRef[] = [];

  const prefixLengthA = hasIntersection ? intersectionIndexA! : listA.length;
  const prefixLengthB = hasIntersection ? intersectionIndexB! : listB.length;

  let headA: NodeRef | null = null;
  let headB: NodeRef | null = null;

  let prevA: NodeRef | null = null;
  let prevB: NodeRef | null = null;

  for (let i = 0; i < prefixLengthA; i++) {
    const node = createNode(listA[i]);
    registerNode(node, "uniqueA");
    uniqueA.push(node);
    if (!headA) {
      headA = node;
    }
    if (prevA) {
      prevA.next = node;
    }
    prevA = node;
  }

  if (hasIntersection) {
    for (let i = intersectionIndexA!; i < listA.length; i++) {
      const node = createNode(listA[i]);
      registerNode(node, "shared");
      sharedNodes.push(node);
    }

    sharedNodes.forEach((node, idx) => {
      if (idx > 0) {
        sharedNodes[idx - 1].next = node;
      }
    });

    if (sharedNodes.length > 0) {
      if (prevA) {
        prevA.next = sharedNodes[0];
      } else {
        headA = sharedNodes[0];
      }
    }
  } else if (prevA) {
    prevA.next = null;
  }

  for (let i = 0; i < prefixLengthB; i++) {
    const node = createNode(listB[i]);
    registerNode(node, "uniqueB");
    uniqueB.push(node);
    if (!headB) {
      headB = node;
    }
    if (prevB) {
      prevB.next = node;
    }
    prevB = node;
  }

  if (hasIntersection) {
    if (sharedNodes.length > 0) {
      if (prevB) {
        prevB.next = sharedNodes[0];
      } else {
        headB = sharedNodes[0];
      }
    }
  } else if (prevB) {
    prevB.next = null;
  }

  if (!hasIntersection) {
    // Append remaining nodes that were not covered by prefixes
    for (let i = prefixLengthA; i < listA.length; i++) {
      const node = createNode(listA[i]);
      registerNode(node, "uniqueA");
      uniqueA.push(node);
      if (!headA) {
        headA = node;
      }
      if (prevA) {
        prevA.next = node;
      }
      prevA = node;
    }
    if (prevA) {
      prevA.next = null;
    }

    for (let i = prefixLengthB; i < listB.length; i++) {
      const node = createNode(listB[i]);
      registerNode(node, "uniqueB");
      uniqueB.push(node);
      if (!headB) {
        headB = node;
      }
      if (prevB) {
        prevB.next = node;
      }
      prevB = node;
    }
    if (prevB) {
      prevB.next = null;
    }
  } else if (sharedNodes.length > 0) {
    sharedNodes[sharedNodes.length - 1].next = null;
  }

  const rowA: RowNode[] = [];
  const rowB: RowNode[] = [];

  if (!headA && sharedNodes.length > 0) {
    headA = sharedNodes[0];
  }
  if (!headB && sharedNodes.length > 0) {
    headB = sharedNodes[0];
  }

  const intersectionsSharedLength = hasIntersection ? sharedNodes.length : 0;
  const maxPrefix = hasIntersection ? Math.max(prefixLengthA, prefixLengthB) : 0;
  const totalColumns = hasIntersection
    ? Math.max(maxPrefix + intersectionsSharedLength, 1)
    : Math.max(listA.length, listB.length, 1);

  const getColumnBase = (prefixLength: number) =>
    hasIntersection ? maxPrefix - prefixLength : 0;

  const baseA = getColumnBase(prefixLengthA);
  const baseB = getColumnBase(prefixLengthB);

  uniqueA.forEach((node, idx) => {
    const column = baseA + idx + 1;
    rowA.push({
      id: node.id,
      value: node.value,
      column,
      isShared: false,
      index: idx,
    });
  });

  uniqueB.forEach((node, idx) => {
    const column = baseB + idx + 1;
    rowB.push({
      id: node.id,
      value: node.value,
      column,
      isShared: false,
      index: idx,
    });
  });

  if (hasIntersection) {
    sharedNodes.forEach((node, idx) => {
      const column = maxPrefix + idx + 1;
      rowA.push({
        id: node.id,
        value: node.value,
        column,
        isShared: true,
        index: prefixLengthA + idx,
      });
      rowB.push({
        id: node.id,
        value: node.value,
        column,
        isShared: true,
        index: prefixLengthB + idx,
      });
    });
  }

  rowA.sort((a, b) => a.column - b.column);
  rowB.sort((a, b) => a.column - b.column);

  return {
    headA,
    headB,
    rowLayouts: {
      A: {
        key: "A",
        label: "链表 A",
        nodes: rowA,
      },
      B: {
        key: "B",
        label: "链表 B",
        nodes: rowB,
      },
    },
    totalColumns,
    nodesById,
    sharedLength: intersectionsSharedLength,
    intersectionExists: hasIntersection,
  };
};

const formatNodeLabel = (
  node: NodeRef | null,
  nodesById: Record<string, NodeMeta>
) => {
  if (!node) return "null";
  const meta = nodesById[node.id];
  if (!meta) return `值 ${node.value}`;
  if (meta.category === "shared") {
    return `值 ${node.value}（共享）`;
  }
  return `值 ${node.value}（${meta.category === "uniqueA" ? "A" : "B"}）`;
};

const buildPointerSteps = (
  headA: NodeRef | null,
  headB: NodeRef | null,
  nodesById: Record<string, NodeMeta>
): StepState[] => {
  const steps: StepState[] = [];
  let pointerA = headA;
  let pointerB = headB;

  const describe = (node: NodeRef | null) => formatNodeLabel(node, nodesById);

  steps.push({
    index: 1,
    pointerA: pointerA?.id ?? null,
    pointerB: pointerB?.id ?? null,
    pointerADesc: describe(pointerA),
    pointerBDesc: describe(pointerB),
    description:
      pointerA && pointerB
        ? `初始化：pA 指向链表 A 的头节点 ${describe(pointerA)}，pB 指向链表 B 的头节点 ${describe(pointerB)}。`
        : `初始化：pA 为 ${describe(pointerA)}，pB 为 ${describe(pointerB)}。`,
    action: "init",
  });

  if (pointerA === pointerB) {
    const initialStep = steps[0];
    initialStep.action = pointerA ? "found" : "end";
    initialStep.description += pointerA
      ? " 两个指针一开始就位于同一节点，立即返回该节点。"
      : " 两个指针都为 null，说明两个链表没有交点。";
    return steps;
  }

  const nodeCount = Object.keys(nodesById).length;
  const maxIterations = nodeCount * 4 + 4;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const nextA = pointerA ? pointerA.next : headB;
    const nextB = pointerB ? pointerB.next : headA;

    const moveDescriptionA = pointerA
      ? nextA
        ? `pA 从 ${describe(pointerA)} 移动到 ${describe(nextA)}`
        : `pA 从 ${describe(pointerA)} 移动到 null`
      : nextA
        ? `pA 为 null，切换到链表 B 的头节点 ${describe(nextA)}`
        : "pA 为 null，链表 B 为空";

    const moveDescriptionB = pointerB
      ? nextB
        ? `pB 从 ${describe(pointerB)} 移动到 ${describe(nextB)}`
        : `pB 从 ${describe(pointerB)} 移动到 null`
      : nextB
        ? `pB 为 null，切换到链表 A 的头节点 ${describe(nextB)}`
        : "pB 为 null，链表 A 为空";

    pointerA = nextA;
    pointerB = nextB;

    const combinedDescription = `${moveDescriptionA}；${moveDescriptionB}`;

    const step: StepState = {
      index: steps.length + 1,
      pointerA: pointerA?.id ?? null,
      pointerB: pointerB?.id ?? null,
      pointerADesc: describe(pointerA),
      pointerBDesc: describe(pointerB),
      description: combinedDescription,
      action: "move",
    };

    if (pointerA === pointerB) {
      if (pointerA) {
        step.action = "found";
        step.description += `。pA 与 pB 在 ${describe(pointerA)} 相遇，返回该节点。`;
      } else {
        step.action = "end";
        step.description += "。两个指针都为 null，链表没有交点。";
      }
      steps.push(step);
      return steps;
    }

    steps.push(step);
  }

  steps.push({
    index: steps.length + 1,
    pointerA: pointerA?.id ?? null,
    pointerB: pointerB?.id ?? null,
    pointerADesc: describe(pointerA),
    pointerBDesc: describe(pointerB),
    description: "遍历达到安全上限，未找到交点，视为没有相交节点。",
    action: "end",
  });

  return steps;
};

const buildAnimationData = (
  listA: number[],
  listB: number[],
  intersectionIndexA: number | null,
  intersectionIndexB: number | null
): AnimationData => {
  const structure = buildLinkedListStructure(
    listA,
    listB,
    intersectionIndexA,
    intersectionIndexB
  );
  const steps = buildPointerSteps(
    structure.headA,
    structure.headB,
    structure.nodesById
  );
  return { structure, steps };
};

export default function IntersectionLinkedListAnimation() {
  const [listAInput, setListAInput] = useState(
    DEFAULT_LIST_A.join(", ")
  );
  const [listBInput, setListBInput] = useState(
    DEFAULT_LIST_B.join(", ")
  );
  const [intersectAInput, setIntersectAInput] = useState(
    String(DEFAULT_INTERSECTION_A)
  );
  const [intersectBInput, setIntersectBInput] = useState(
    String(DEFAULT_INTERSECTION_B)
  );
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(
      DEFAULT_LIST_A,
      DEFAULT_LIST_B,
      DEFAULT_INTERSECTION_A,
      DEFAULT_INTERSECTION_B
    )
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { structure, steps } = animationData;
  const currentStep = steps[stepIndex] ?? steps[steps.length - 1] ?? null;

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

  const pointerAInfo = currentStep?.pointerA
    ? structure.nodesById[currentStep.pointerA] ?? null
    : null;
  const pointerBInfo = currentStep?.pointerB
    ? structure.nodesById[currentStep.pointerB] ?? null
    : null;

  const pointerStatus = (pointer: NodeMeta | null, fallback: string) => {
    if (!pointer) {
      return fallback;
    }
    if (pointer.category === "shared") {
      return `值 ${pointer.value}（共享）`;
    }
    return `值 ${pointer.value}（链表${pointer.category === "uniqueA" ? "A" : "B"}）`;
  };

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
      const parsedListA = parseListInput(listAInput, "链表 A");
      const parsedListB = parseListInput(listBInput, "链表 B");

      const idxA = parseIndexInput(
        intersectAInput,
        "交点索引（链表 A）",
        parsedListA.length
      );
      const idxB = parseIndexInput(
        intersectBInput,
        "交点索引（链表 B）",
        parsedListB.length
      );

      const hasIntersection =
        idxA !== null && idxB !== null && parsedListA.length && parsedListB.length;

      if (hasIntersection) {
        const tailLenA = parsedListA.length - idxA!;
        const tailLenB = parsedListB.length - idxB!;
        if (tailLenA <= 0 || tailLenB <= 0) {
          throw new Error("交点索引必须指向有效的节点。");
        }
        if (tailLenA !== tailLenB) {
          throw new Error("两个链表从交点开始的剩余长度必须一致，才能形成真实交点。");
        }
      }

      const data = buildAnimationData(parsedListA, parsedListB, idxA, idxB);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);

      setListAInput(parsedListA.join(", "));
      setListBInput(parsedListB.join(", "));
      setIntersectAInput(
        idxA !== null ? String(idxA) : ""
      );
      setIntersectBInput(
        idxB !== null ? String(idxB) : ""
      );
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message);
      } else {
        setInputError("输入解析失败，请检查格式。");
      }
    }
  };

  const handleRestoreDefaults = () => {
    const data = buildAnimationData(
      DEFAULT_LIST_A,
      DEFAULT_LIST_B,
      DEFAULT_INTERSECTION_A,
      DEFAULT_INTERSECTION_B
    );
    setAnimationData(data);
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);

    setListAInput(DEFAULT_LIST_A.join(", "));
    setListBInput(DEFAULT_LIST_B.join(", "));
    setIntersectAInput(String(DEFAULT_INTERSECTION_A));
    setIntersectBInput(String(DEFAULT_INTERSECTION_B));
  };

  const totalColumns = Math.max(structure.totalColumns, 1);
  const gridTemplate = {
    gridTemplateColumns: `repeat(${totalColumns}, minmax(90px, 1fr))`,
  };

  const displayedLogs = steps.slice(0, stepIndex + 1);

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">相交链表 - 双指针相遇演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          pA 与 pB 同步前进，走完各自链表后交叉切换，若存在交点最终会在共享节点相遇。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(m + n) · 空间复杂度 O(1)</span>
          {currentStep && (
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 flex-grow">
        <div className="bg-card/80 border border-border/60 rounded-xl p-5 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GitMerge className="w-4 h-4 text-primary" />
              <span>
                {structure.intersectionExists
                  ? `共享尾部长度：${structure.sharedLength}`
                  : "当前链表不共享节点"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
                <p className="uppercase tracking-wide font-semibold text-[11px] mb-1 text-foreground flex items-center gap-1">
                  <Pointer className="w-3 h-3 text-primary" />
                  pA
                </p>
                <p>{pointerStatus(pointerAInfo, "null")}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
                <p className="uppercase tracking-wide font-semibold text-[11px] mb-1 text-foreground flex items-center gap-1">
                  <Pointer className="w-3 h-3 text-primary" />
                  pB
                </p>
                <p>{pointerStatus(pointerBInfo, "null")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(["A", "B"] as const).map((key) => {
              const row = structure.rowLayouts[key];
              return (
                <div key={row.key}>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {row.label}
                  </p>
                  <div className="relative mt-3">
                    <div
                      className="grid gap-3"
                      style={gridTemplate}
                    >
                      {row.nodes.map((node) => {
                        const isPointer =
                          (key === "A" && currentStep?.pointerA === node.id) ||
                          (key === "B" && currentStep?.pointerB === node.id);
                        return (
                          <motion.div
                            key={`${row.key}-${node.id}`}
                            layout
                            style={{ gridColumn: `${node.column} / span 1` }}
                            className={cn(
                              "relative flex flex-col items-center justify-center h-20 rounded-xl border-2 text-base font-semibold shadow-sm transition-all",
                              node.isShared
                                ? "bg-primary/10 border-primary/40 text-primary"
                                : "bg-muted border-border/70 text-foreground",
                              isPointer &&
                                "border-primary text-primary shadow-primary/30 shadow-lg bg-primary/20"
                            )}
                          >
                            <span>{node.value}</span>
                            {node.isShared && (
                              <span className="absolute -bottom-5 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">
                                共享
                              </span>
                            )}

                            <AnimatePresence>
                              {isPointer && (
                                <motion.span
                                  key="pointer-label"
                                  initial={{ opacity: 0, y: -8 }}
                                  animate={{ opacity: 1, y: -16 }}
                                  exit={{ opacity: 0, y: -8 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute -top-5 text-[11px] font-medium px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary shadow-sm uppercase tracking-wide"
                                >
                                  {key === "A" ? "pA" : "pB"}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
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
            <span className="text-xs text-muted-foreground">
              {currentStep
                ? currentStep.action === "found"
                  ? "已找到交点"
                  : currentStep.action === "end"
                    ? "未发现交点"
                    : "双指针移动中"
                : "等待输入"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card/80 border border-border/60 rounded-xl p-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              当前推理
            </p>
            {currentStep ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
                    {currentStep.action === "found"
                      ? "找到交点"
                      : currentStep.action === "end"
                        ? "遍历结束"
                        : currentStep.action === "move"
                          ? "指针移动"
                          : "初始化"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {currentStep.description}
                </p>
              </div>
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
                  链表 A 节点（逗号或空格分隔）
                </label>
                <Textarea
                  value={listAInput}
                  onChange={(event) => setListAInput(event.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                  placeholder="例如：4, 1, 8, 4, 5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  链表 B 节点（逗号或空格分隔）
                </label>
                <Textarea
                  value={listBInput}
                  onChange={(event) => setListBInput(event.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                  placeholder="例如：5, 6, 1, 8, 4, 5"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">
                    交点索引（链表 A）
                  </label>
                  <Input
                    value={intersectAInput}
                    onChange={(event) => setIntersectAInput(event.target.value)}
                    placeholder="留空表示无交点"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">
                    交点索引（链表 B）
                  </label>
                  <Input
                    value={intersectBInput}
                    onChange={(event) => setIntersectBInput(event.target.value)}
                    placeholder="留空表示无交点"
                  />
                </div>
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
