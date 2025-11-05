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
  RefreshCcw,
  Rabbit,
  Turtle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_LIST = [1, 2, 3, 4, 5];
const DEFAULT_N = 2;
const MAX_LENGTH = 12;
const STEP_INTERVAL = 1600;

type StepPhase = "init" | "advance-fast" | "move-both" | "delete" | "done";

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  fastPosition: number | null;
  slowPosition: number | null;
  fastAdvance: number;
  totalAdvance: number;
  syncMoves: number;
  targetIndex: number | null;
  removedIndex: number | null;
}

interface AnimationData {
  values: number[];
  n: number;
  steps: StepState[];
  removalIndex: number | null;
  resultValues: number[];
}

const formatPosition = (values: number[], position: number | null): string => {
  if (position === null) return "null";
  if (position === -1) return "虚拟头";
  if (position < 0 || position >= values.length) return "null";
  return `${values[position]} (索引 ${position})`;
};

const movePointerForward = (
  position: number | null,
  length: number,
): number | null => {
  if (position === null) return null;
  if (position === -1) {
    return length ? 0 : null;
  }
  if (position >= length - 1) {
    return null;
  }
  return position + 1;
};

const buildRemoveSteps = (values: number[], n: number): StepState[] => {
  const steps: StepState[] = [];
  const length = values.length;
  const removalIndex = length ? length - n : null;

  let fastPosition: number | null = -1;
  let slowPosition: number | null = -1;
  let fastAdvance = 0;
  let syncMoves = 0;
  const totalAdvance = Math.min(n + 1, length + 1);

  const pushStep = (
    phase: StepPhase,
    description: string,
    overrides?: Partial<StepState>,
  ) => {
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      fastPosition,
      slowPosition,
      fastAdvance,
      totalAdvance,
      syncMoves,
      targetIndex: removalIndex,
      removedIndex: null,
      ...overrides,
    });
  };

  pushStep(
    "init",
    `创建虚拟头节点，快慢指针均指向虚拟头，计划删除倒数第 ${n} 个节点。`,
  );

  for (let move = 1; move <= totalAdvance; move++) {
    fastPosition = movePointerForward(fastPosition, length);
    fastAdvance = move;
    const posLabel = formatPosition(values, fastPosition);
    pushStep("advance-fast", `快指针第 ${move} 步前进，fast → ${posLabel}。`);
  }

  while (fastPosition !== null) {
    fastPosition = movePointerForward(fastPosition, length);
    slowPosition = movePointerForward(slowPosition, length);
    syncMoves += 1;
    const fastLabel = formatPosition(values, fastPosition);
    const slowLabel = formatPosition(values, slowPosition);
    pushStep(
      "move-both",
      `同步第 ${syncMoves} 次移动：fast → ${fastLabel}，slow → ${slowLabel}。`,
    );
  }

  const targetLabel =
    removalIndex !== null && removalIndex >= 0 && removalIndex < length
      ? `${values[removalIndex]} (索引 ${removalIndex})`
      : "null";

  pushStep(
    "delete",
    `slow 的下一个节点 ${targetLabel} 即为倒数第 ${n} 个节点，执行删除操作。`,
    {
      removedIndex: removalIndex,
    },
  );

  pushStep(
    "done",
    removalIndex === null
      ? "链表为空，删除结束。"
      : `删除完成，新的链表头为 ${formatPosition(
          values.filter((_, idx) => idx !== removalIndex),
          0,
        )}。`,
    {
      targetIndex: null,
      removedIndex: removalIndex,
    },
  );

  return steps;
};

const buildAnimationData = (values: number[], n: number): AnimationData => {
  const sanitized = values.slice(0, MAX_LENGTH);
  const length = sanitized.length;

  if (!length) {
    return {
      values: [],
      n,
      steps: [
        {
          index: 1,
          phase: "init",
          description: "链表为空，无法执行删除。",
          fastPosition: null,
          slowPosition: null,
          fastAdvance: 0,
          totalAdvance: 0,
          syncMoves: 0,
          targetIndex: null,
          removedIndex: null,
        },
      ],
      removalIndex: null,
      resultValues: [],
    };
  }

  const cappedN = Math.min(Math.max(n, 1), length);
  const removalIndex = length - cappedN;
  const resultValues = sanitized.filter((_, idx) => idx !== removalIndex);

  return {
    values: sanitized,
    n: cappedN,
    steps: buildRemoveSteps(sanitized, cappedN),
    removalIndex,
    resultValues,
  };
};

const parseListInput = (input: string): number[] => {
  const segments = input
    .split(/[\s,，、,]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    throw new Error("链表至少需要一个节点值。");
  }

  if (segments.length > MAX_LENGTH) {
    throw new Error(`节点数量不能超过 ${MAX_LENGTH} 个。`);
  }

  const values = segments.map((segment) => {
    const value = Number(segment);
    if (!Number.isFinite(value)) {
      throw new Error(`检测到无效数字 "${segment}"，请重新输入。`);
    }
    if (!Number.isInteger(value)) {
      throw new Error("节点值必须为整数。");
    }
    return value;
  });

  return values;
};

const parseNInput = (input: string, length: number): number => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("请填写需要删除的倒数位置 n。");
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value)) {
    throw new Error("n 必须是整数。");
  }

  if (value < 1) {
    throw new Error("n 必须大于等于 1。");
  }

  if (value > length) {
    throw new Error(`n 不能超过链表长度 ${length}。`);
  }

  return value;
};

const InfoCard = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={cn(
      "rounded-lg border bg-background/80 px-4 py-3",
      highlight ? "border-primary/70 bg-primary/5" : "border-border",
    )}
  >
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

const PointerBadge = ({ type }: { type: "fast" | "slow" }) => (
  <span
    className={cn(
      "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
      type === "fast"
        ? "border-primary/60 bg-primary/10 text-primary"
        : "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
    )}
  >
    {type === "fast" ? (
      <Rabbit className="h-3.5 w-3.5" />
    ) : (
      <Turtle className="h-3.5 w-3.5" />
    )}
    {type === "fast" ? "fast" : "slow"}
  </span>
);

const NodeCard = ({
  type,
  value,
  index,
  fastHere,
  slowHere,
  isTarget,
  isRemoved,
}: {
  type: "dummy" | "node" | "null";
  value?: number | string;
  index?: number;
  fastHere: boolean;
  slowHere: boolean;
  isTarget: boolean;
  isRemoved: boolean;
}) => (
  <motion.div
    layout
    className={cn(
      "relative flex min-h-[88px] min-w-[88px] flex-col items-center justify-center rounded-xl border px-6 py-5 text-center shadow-sm",
      type === "dummy"
        ? "border-muted-foreground/40 bg-muted/20 text-muted-foreground"
        : type === "null"
          ? "border-border bg-background/70 text-muted-foreground"
          : "border-border bg-background",
      isTarget && type === "node"
        ? "border-primary shadow-primary/20 ring-2 ring-primary/40"
        : undefined,
      isRemoved && type === "node"
        ? "border-destructive/60 bg-destructive/10 text-destructive"
        : undefined,
    )}
  >
    {(fastHere || slowHere) && (
      <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 gap-2">
        {fastHere && <PointerBadge type="fast" />}
        {slowHere && <PointerBadge type="slow" />}
      </div>
    )}
    <div className="text-lg font-semibold">
      {type === "dummy" ? "虚拟头" : type === "null" ? "null" : value}
    </div>
    {type === "node" && typeof index === "number" && (
      <span className="mt-2 text-xs text-muted-foreground">索引 {index}</span>
    )}
  </motion.div>
);

const LinkedListVisualization = ({
  label,
  values,
  fast,
  slow,
  targetIndex,
  removedIndex,
  showPointers,
  showDummy,
}: {
  label: string;
  values: number[];
  fast: number | null;
  slow: number | null;
  targetIndex: number | null;
  removedIndex: number | null;
  showPointers?: boolean;
  showDummy?: boolean;
}) => (
  <div className="flex flex-col gap-2">
    <div className="text-sm font-medium text-muted-foreground mb-4">
      {label}
    </div>
    <div className="flex flex-wrap items-center gap-6">
      {showDummy && (
        <NodeCard
          type="dummy"
          fastHere={showPointers ? fast === -1 : false}
          slowHere={showPointers ? slow === -1 : false}
          isTarget={false}
          isRemoved={false}
        />
      )}
      {values.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted px-4 py-2 text-sm text-muted-foreground">
          空链表
        </div>
      ) : (
        values.map((value, index) => (
          <NodeCard
            key={`${value}-${index}`}
            type="node"
            value={value}
            index={index}
            fastHere={showPointers ? fast === index : false}
            slowHere={showPointers ? slow === index : false}
            isTarget={showPointers ? targetIndex === index : false}
            isRemoved={removedIndex === index}
          />
        ))
      )}
      {showPointers && (
        <NodeCard
          type="null"
          fastHere={fast === null}
          slowHere={slow === null}
          isTarget={false}
          isRemoved={false}
        />
      )}
    </div>
  </div>
);

export default function RemoveNthFromEndAnimation() {
  const [listInput, setListInput] = useState(DEFAULT_LIST.join(", "));
  const [nInput, setNInput] = useState(String(DEFAULT_N));
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_LIST, DEFAULT_N),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { values, steps, n, resultValues } = animationData;
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

  const handleNextStep = () => {
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
      const parsedN = parseNInput(nInput, parsedValues.length);
      const data = buildAnimationData(parsedValues, parsedN);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);
      setListInput(parsedValues.join(", "));
      setNInput(String(parsedN));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "输入解析失败，请重试。";
      setInputError(message);
    }
  };

  const handleUseDefault = () => {
    const data = buildAnimationData(DEFAULT_LIST, DEFAULT_N);
    setAnimationData(data);
    setListInput(DEFAULT_LIST.join(", "));
    setNInput(String(DEFAULT_N));
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const formatPointerInfo = (
    type: "fast" | "slow",
    position: number | null,
  ) => {
    const label = formatPosition(values, position);
    return `${type === "fast" ? "fast" : "slow"} → ${label}`;
  };

  const nDescription = `n = ${n}（删除倒数第 ${n} 个节点）`;

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg bg-gradient-to-br from-background to-muted/30 p-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <h3 className="text-xl font-bold">删除链表的倒数第 N 个节点</h3>
        <p className="text-sm text-muted-foreground">
          利用快慢指针维持固定间距，一趟遍历定位待删除节点。
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            步骤 {Math.min(stepIndex + 1, steps.length)} / {steps.length || 1}
          </span>
          <span>阶段：{currentStep.phase ?? "未知"}</span>
        </div>
        <div className="h-2 w-full max-w-xl overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${Math.floor(progress * 100)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <form
          onSubmit={handleApplyInputs}
          className="flex flex-col gap-4 rounded-lg border bg-background/80 p-4 shadow-sm"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">
              链表节点（顺序即从头到尾）
            </label>
            <Textarea
              value={listInput}
              onChange={(event) => setListInput(event.target.value)}
              placeholder="例如：1, 2, 3, 4, 5"
              className="min-h-[96px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">倒数第 n 个节点</label>
            <Input
              value={nInput}
              onChange={(event) => setNInput(event.target.value)}
              placeholder="例如：2"
            />
          </div>

          {inputError && (
            <div className="rounded-lg border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {inputError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              应用输入
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={handleUseDefault}
            >
              <RotateCcw className="h-4 w-4" />
              使用默认示例
            </Button>
          </div>

          <div className="h-px w-full bg-muted" />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              重置步骤
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={handlePlayToggle}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  暂停
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  播放
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={handleNextStep}
            >
              <StepForward className="h-4 w-4" />
              下一步
            </Button>
          </div>

          <div className="rounded-lg border bg-background/80 p-4 text-sm leading-relaxed text-muted-foreground">
            {currentStep.description ?? "等待步骤开始。"}
          </div>

          <div className="rounded-lg border bg-background/80 p-4">
            <div className="text-sm font-semibold text-muted-foreground">
              步骤记录
            </div>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {displayedLogs.map((log) => (
                  <motion.div
                    key={log.index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm",
                      log.index === currentStep.index
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background",
                    )}
                  >
                    <div className="text-xs text-muted-foreground">
                      步骤 {log.index}
                    </div>
                    <div>{log.description}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-4 rounded-lg border bg-background/70 p-4 shadow-sm">
          <LinkedListVisualization
            label="带虚拟头的遍历状态"
            values={values}
            fast={currentStep.fastPosition ?? null}
            slow={currentStep.slowPosition ?? null}
            targetIndex={currentStep.targetIndex ?? null}
            removedIndex={
              currentStep.phase === "delete"
                ? (currentStep.removedIndex ?? null)
                : null
            }
            showPointers
            showDummy
          />

          <LinkedListVisualization
            label="删除后的链表"
            values={resultValues}
            fast={null}
            slow={null}
            targetIndex={null}
            removedIndex={
              currentStep.phase === "done"
                ? (currentStep.removedIndex ?? null)
                : null
            }
            showPointers={false}
            showDummy={false}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="快指针位置"
              value={formatPointerInfo(
                "fast",
                currentStep.fastPosition ?? null,
              )}
              highlight={
                currentStep.phase === "advance-fast" ||
                currentStep.phase === "move-both"
              }
            />
            <InfoCard
              label="慢指针位置"
              value={formatPointerInfo(
                "slow",
                currentStep.slowPosition ?? null,
              )}
              highlight={
                currentStep.phase === "move-both" ||
                currentStep.phase === "delete"
              }
            />
            <InfoCard
              label="间距维护"
              value={`快慢指针初始间隔：${n + 1} 个节点`}
            />
            <InfoCard label="删除目标" value={nDescription} highlight />
          </div>
        </div>
      </div>
    </div>
  );
}
