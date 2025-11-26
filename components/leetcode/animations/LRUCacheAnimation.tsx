"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Pause, Play, RefreshCcw, RotateCcw, StepForward } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_OPERATIONS = [
  ["put", 1, 1],
  ["put", 2, 2],
  ["get", 1],
  ["put", 3, 3],
  ["get", 2],
  ["put", 4, 4],
  ["get", 1],
  ["get", 3],
  ["get", 4],
];

const DEFAULT_OPERATIONS_INPUT = JSON.stringify(DEFAULT_OPERATIONS);
const DEFAULT_CAPACITY = 2;

const MAX_OPERATIONS = 18;
const MAX_CAPACITY = 8;
const MIN_CAPACITY = 1;
const STEP_INTERVAL = 1600;

type StepPhase =
  | "init"
  | "get-hit"
  | "get-miss"
  | "put-update"
  | "put-insert"
  | "evict";

interface Operation {
  type: "get" | "put";
  key: number;
  value?: number;
}

interface NodeState {
  key: number;
  value: number;
}

interface StepState {
  index: number;
  phase: StepPhase;
  description: string;
  operationIndex: number;
  operation: Operation | null;
  result: number | null;
  hit: boolean | null;
  evictedKey: number | null;
  cacheOrder: NodeState[];
  cacheSize: number;
  capacity: number;
  mapEntries: Array<{ key: number; value: number }>;
}

interface AnimationData {
  capacity: number;
  operations: Operation[];
  steps: StepState[];
}

const phaseLabels: Record<StepPhase, string> = {
  init: "初始化",
  "get-hit": "GET 命中",
  "get-miss": "GET 未命中",
  "put-update": "PUT 更新",
  "put-insert": "PUT 插入",
  evict: "超容淘汰",
};

const phaseHints: Record<StepPhase, string> = {
  init: "建立容量并清空缓存",
  "get-hit": "命中后需要移动到表头",
  "get-miss": "未命中直接返回 -1",
  "put-update": "更新已有键并提升优先级",
  "put-insert": "插入新键成为最近使用",
  evict: "超过容量，移除最久未使用",
};

const cloneOrder = (order: NodeState[]) => order.map((node) => ({ ...node }));

const cloneMapEntries = (map: Map<number, NodeState>) =>
  Array.from(map.entries())
    .map(([key, node]) => ({ key, value: node.value }))
    .sort((a, b) => a.key - b.key);

const buildLRUSteps = (capacity: number, operations: Operation[]): StepState[] => {
  const steps: StepState[] = [];
  const cache = new Map<number, NodeState>();
  const order: NodeState[] = [];

  const moveToFront = (node: NodeState) => {
    const idx = order.indexOf(node);
    if (idx > -1) {
      order.splice(idx, 1);
    }
    order.unshift(node);
  };

  const pushStep = (
    phase: StepPhase,
    description: string,
    operationIndex: number,
    overrides?: Partial<StepState>,
  ) => {
    const snapshotOrder = cloneOrder(order);
    const snapshotEntries = cloneMapEntries(cache);
    steps.push({
      index: steps.length + 1,
      phase,
      description,
      operationIndex,
      operation: overrides?.operation ?? null,
      result: overrides?.result ?? null,
      hit: overrides?.hit ?? null,
      evictedKey: overrides?.evictedKey ?? null,
      cacheOrder: overrides?.cacheOrder ?? snapshotOrder,
      cacheSize: overrides?.cacheSize ?? order.length,
      capacity,
      mapEntries: overrides?.mapEntries ?? snapshotEntries,
    });
  };

  pushStep(
    "init",
    `容量设置为 ${capacity}，缓存与双向链表均为空。`,
    -1,
  );

  operations.forEach((operation, opIndex) => {
    if (operation.type === "get") {
      const node = cache.get(operation.key);
      if (node) {
        moveToFront(node);
        pushStep(
          "get-hit",
          `GET(${operation.key}) 命中，返回 ${node.value} 并移动到表头。`,
          opIndex,
          {
            operation,
            result: node.value,
            hit: true,
          },
        );
      } else {
        pushStep(
          "get-miss",
          `GET(${operation.key}) 未命中，返回 -1，链表结构不变。`,
          opIndex,
          {
            operation,
            result: -1,
            hit: false,
          },
        );
      }
      return;
    }

    const putValue = operation.value ?? 0;
    const existing = cache.get(operation.key);

    if (existing) {
      existing.value = putValue;
      moveToFront(existing);
      pushStep(
        "put-update",
        `PUT(${operation.key}, ${putValue}) 已存在，更新其值并将其设为最近使用。`,
        opIndex,
        {
          operation,
        },
      );
      return;
    }

    const newNode: NodeState = {
      key: operation.key,
      value: putValue,
    };
    cache.set(operation.key, newNode);
    order.unshift(newNode);

    let evictedKey: number | null = null;
    let phase: StepPhase = "put-insert";
    let description = `PUT(${operation.key}, ${putValue}) 不在缓存中，插入表头。`;

    if (order.length > capacity) {
      const removed = order.pop();
      if (removed) {
        cache.delete(removed.key);
        evictedKey = removed.key;
        phase = "evict";
        description += ` 容量超限，淘汰最久未使用的 key=${removed.key}。`;
      }
    }

    pushStep(phase, description, opIndex, {
      operation,
      evictedKey,
    });
  });

  return steps;
};

const buildAnimationData = (capacity: number, operations: Operation[]): AnimationData => ({
  capacity,
  operations,
  steps: buildLRUSteps(capacity, operations),
});

const parseOperationsInput = (input: string): Operation[] => {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error(
      "请输入合法的 JSON 数组，例如 [[\"put\",1,1],[\"get\",1]] 或 [{\"type\":\"put\",\"key\":1,\"value\":1}]。",
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("操作列表必须是数组。");
  }

  if (parsed.length > MAX_OPERATIONS) {
    throw new Error(`操作数量不能超过 ${MAX_OPERATIONS} 个。`);
  }

  return parsed.map((entry, index) => {
    if (Array.isArray(entry)) {
      const [rawType, rawKey, rawValue] = entry;
      if (typeof rawType !== "string") {
        throw new Error(`第 ${index + 1} 个操作缺少类型字符串。`);
      }
      const type = rawType.toLowerCase();
      if (type !== "get" && type !== "put") {
        throw new Error(`第 ${index + 1} 个操作的类型 ${rawType} 非法。`);
      }
      if (typeof rawKey !== "number" || Number.isNaN(rawKey)) {
        throw new Error(`第 ${index + 1} 个操作的 key 无效。`);
      }
      if (type === "put" && (rawValue === undefined || typeof rawValue !== "number")) {
        throw new Error(`第 ${index + 1} 个 PUT 操作缺少数字 value。`);
      }
      return {
        type,
        key: rawKey,
        value: type === "put" ? rawValue : undefined,
      } as Operation;
    }

    if (typeof entry === "object" && entry !== null) {
      const maybeOp = entry as Record<string, unknown>;
      const rawType = maybeOp.type ?? maybeOp.op;
      if (typeof rawType !== "string") {
        throw new Error(`第 ${index + 1} 个操作缺少 type 字段。`);
      }
      const type = rawType.toLowerCase();
      if (type !== "get" && type !== "put") {
        throw new Error(`第 ${index + 1} 个操作的类型 ${rawType} 非法。`);
      }
      const rawKey = maybeOp.key;
      if (typeof rawKey !== "number" || Number.isNaN(rawKey)) {
        throw new Error(`第 ${index + 1} 个操作的 key 无效。`);
      }
      const rawValue = maybeOp.value;
      if (type === "put" && (typeof rawValue !== "number" || Number.isNaN(rawValue))) {
        throw new Error(`第 ${index + 1} 个 PUT 操作缺少数值 value。`);
      }
      return {
        type,
        key: rawKey,
        value: type === "put" ? (rawValue as number) : undefined,
      } as Operation;
    }

    throw new Error(
      `第 ${index + 1} 个操作无法解析，请使用数组或对象形式。`,
    );
  });
};

const DEFAULT_OPERATION_OBJECTS: Operation[] = DEFAULT_OPERATIONS.map((entry) => ({
  type: entry[0] as "put" | "get",
  key: entry[1] as number,
  value: entry[0] === "put" ? (entry[2] as number) : undefined,
}));

export default function LRUCacheAnimation() {
  const [capacityInput, setCapacityInput] = useState(String(DEFAULT_CAPACITY));
  const [operationsInput, setOperationsInput] = useState(
    DEFAULT_OPERATIONS_INPUT,
  );
  const [animationData, setAnimationData] = useState<AnimationData>(() =>
    buildAnimationData(DEFAULT_CAPACITY, DEFAULT_OPERATION_OBJECTS),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { operations, steps, capacity } = animationData;
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

  const operationLabel = useMemo(() => {
    if (!currentStep.operation) return "初始化";
    const prefix = currentStep.operation.type.toUpperCase();
    if (currentStep.operation.type === "put") {
      return `${prefix}(${currentStep.operation.key}, ${currentStep.operation.value})`;
    }
    return `${prefix}(${currentStep.operation.key})`;
  }, [currentStep.operation]);

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
      const capacityValue = Number(capacityInput.trim());
      if (
        !Number.isInteger(capacityValue) ||
        capacityValue < MIN_CAPACITY ||
        capacityValue > MAX_CAPACITY
      ) {
        throw new Error(
          `容量必须是 ${MIN_CAPACITY} 到 ${MAX_CAPACITY} 之间的整数。`,
        );
      }

      const parsedOperations = parseOperationsInput(operationsInput);
      const data = buildAnimationData(capacityValue, parsedOperations);
      setAnimationData(data);
      setStepIndex(0);
      setInputError(null);
      setCapacityInput(String(capacityValue));
      setOperationsInput(JSON.stringify(parsedOperations));
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message);
      } else {
        setInputError("解析输入时出错，请检查格式。");
      }
    }
  };

  const handleRestoreDefaults = () => {
    const data = buildAnimationData(DEFAULT_CAPACITY, DEFAULT_OPERATION_OBJECTS);
    setAnimationData(data);
    setCapacityInput(String(DEFAULT_CAPACITY));
    setOperationsInput(JSON.stringify(DEFAULT_OPERATIONS));
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
  };

  const displayedLogs = steps.slice(0, stepIndex + 1);

  const currentOrder = currentStep?.cacheOrder ?? [];
  const activeKey = currentStep?.operation?.key ?? null;
  const evictedKey = currentStep?.evictedKey ?? null;

  const getNodeStatus = (node: NodeState, index: number) => {
    if (node.key === activeKey && currentStep.operation?.type === "get") {
      return "active";
    }
    if (node.key === activeKey && currentStep.operation?.type === "put") {
      return "updated";
    }
    if (index === 0 && currentOrder.length > 1) {
      return "mru";
    }
    if (index === currentOrder.length - 1 && currentOrder.length > 1) {
      return "lru";
    }
    return "default";
  };

  const nodeStyles: Record<string, string> = {
    active: "border-primary text-primary bg-primary/10 shadow-primary/30",
    updated: "border-amber-500/70 text-amber-600 bg-amber-500/10",
    mru: "border-sky-500/70 text-sky-600 bg-sky-500/10",
    lru: "border-rose-500/70 text-rose-600 bg-rose-500/10",
    default: "border-border/70 text-foreground bg-card/70",
  };

  const badgeLabels: Record<string, string> = {
    active: "命中",
    updated: "更新",
    mru: "MRU",
    lru: "LRU",
    default: "",
  };

  const phaseLabel = currentStep ? phaseLabels[currentStep.phase] : "";
  const phaseHint = currentStep ? phaseHints[currentStep.phase] : "等待输入";

  return (
    <div className="w-full min-h-[560px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">LRU 缓存 · 哈希 + 双向链表演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          通过步骤动画展示 Map 查找与双向链表移动如何实现 O(1) 的 get / put。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
          <span>时间复杂度 O(1) · 空间复杂度 O(capacity)</span>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 flex-grow">
        <div className="bg-card/80 border border-border/60 rounded-xl p-5 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                阶段
              </p>
              <p className="text-sm font-semibold text-foreground">{phaseLabel}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{phaseHint}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                当前操作
              </p>
              <p className="text-sm font-semibold text-foreground">
                {operationLabel}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {currentStep.operation ? `第 ${currentStep.operationIndex + 1} / ${operations.length} 次调用` : "尚未开始"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="uppercase tracking-wide text-[11px] font-semibold mb-1 text-foreground">
                缓存占用
              </p>
              <p className="text-sm font-semibold text-foreground">
                {currentStep.cacheSize} / {capacity}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {currentStep.hit === true
                  ? `命中，返回 ${currentStep.result}`
                  : currentStep.hit === false
                    ? "未命中，返回 -1"
                    : evictedKey !== null
                      ? `淘汰 key=${evictedKey}`
                      : "等待动作"}
              </p>
            </div>
          </div>

          <div className="space-y-5 flex-1 flex flex-col">
            <div className="border border-border/70 rounded-xl p-4 flex-1">
              <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                <span>双向链表视角（左：最近使用）</span>
                <span>右端表示最久未使用</span>
              </div>
              {currentOrder.length ? (
                <div className="flex flex-wrap gap-4">
                  {currentOrder.map((node, idx) => {
                    const status = getNodeStatus(node, idx);
                    const badge = badgeLabels[status];
                    return (
                      <motion.div
                        key={`${node.key}-${idx}-${currentStep?.index ?? 0}`}
                        layout
                        className={cn(
                          "relative flex flex-col items-center justify-center w-28 h-32 rounded-2xl border-2 px-4 py-4 transition-all duration-300 shadow-sm",
                          nodeStyles[status] ?? nodeStyles.default,
                        )}
                      >
                        {badge && (
                          <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-background/70 border border-white/30">
                            {badge}
                          </span>
                        )}
                        <div className="text-xs text-muted-foreground">key</div>
                        <div className="text-2xl font-semibold">{node.key}</div>
                        <div className="text-xs text-muted-foreground mt-2">value</div>
                        <div className="text-xl font-semibold">{node.value}</div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  当前链表为空，等待操作触发节点创建。
                </div>
              )}
            </div>

            <div className="border border-border/70 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                <span>哈希表快照</span>
                <span>按 key 升序展示</span>
              </div>
              {currentStep.mapEntries.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {currentStep.mapEntries.map((entry) => (
                    <div
                      key={entry.key}
                      className={cn(
                        "flex flex-col items-center rounded-lg border px-3 py-2 text-sm",
                        entry.key === activeKey
                          ? "border-primary text-primary"
                          : "border-border/70 text-foreground",
                      )}
                    >
                      <span className="text-xs text-muted-foreground">key</span>
                      <span className="text-base font-semibold">{entry.key}</span>
                      <span className="text-[11px] text-muted-foreground mt-1">value {entry.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Map 为空，尚未缓存任何键。
                </div>
              )}
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
                输入操作后点击应用即可开始演示。
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
                  缓存容量（{MIN_CAPACITY}-{MAX_CAPACITY}）
                </label>
                <Input
                  value={capacityInput}
                  onChange={(event) => setCapacityInput(event.target.value)}
                  type="number"
                  min={MIN_CAPACITY}
                  max={MAX_CAPACITY}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  操作列表（JSON，最多 {MAX_OPERATIONS} 个）
                </label>
                <Textarea
                  value={operationsInput}
                  onChange={(event) => setOperationsInput(event.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                  placeholder='例如：[["put",1,1],["get",1]]'
                />
                <p className="text-[11px] text-muted-foreground">
                  支持数组或对象写法，会依次播放 GET / PUT 操作。
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
