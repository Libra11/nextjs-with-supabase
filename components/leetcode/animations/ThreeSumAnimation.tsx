"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, ArrowRight, RotateCcw, Atom } from "lucide-react";

const DEFAULT_NUMBERS = [-1, 0, 1, 2, -1, -4];

type StepAction =
  | "insufficient"
  | "init-base"
  | "skip-base"
  | "terminate"
  | "move-left"
  | "move-right"
  | "found"
  | "contract"
  | "pointer-meet"
  | "advance-base";

interface StepSnapshot {
  id: number;
  baseIndex: number | null;
  baseValue: number | null;
  leftIndex: number | null;
  rightIndex: number | null;
  leftValue: number | null;
  rightValue: number | null;
  sum: number | null;
  action: StepAction;
  description: string;
  highlightTriplet?: [number, number, number] | null;
  triplets: [number, number, number][];
}

interface SimulationResult {
  sortedNumbers: number[];
  steps: StepSnapshot[];
}

const cloneTriplets = (list: [number, number, number][]) =>
  list.map((triplet) => [...triplet] as [number, number, number]);

const generateThreeSumSimulation = (values: number[]): SimulationResult => {
  const sortedNumbers = [...values].sort((a, b) => a - b);
  const steps: StepSnapshot[] = [];
  const triplets: [number, number, number][] = [];
  let stepId = 1;

  const pushStep = (
    payload: Omit<
      StepSnapshot,
      "id" | "triplets" | "highlightTriplet"
    > & { highlightTriplet?: [number, number, number] | null },
  ) => {
    steps.push({
      id: stepId++,
      ...payload,
      highlightTriplet: payload.highlightTriplet ?? null,
      triplets: cloneTriplets(triplets),
    });
  };

  if (sortedNumbers.length < 3) {
    pushStep({
      baseIndex: null,
      baseValue: null,
      leftIndex: null,
      rightIndex: null,
      leftValue: null,
      rightValue: null,
      sum: null,
      action: "insufficient",
      description: "数组长度不足 3，无法组成三元组。",
    });
    return { sortedNumbers, steps };
  }

  const n = sortedNumbers.length;

  for (let i = 0; i < n - 2; i++) {
    const baseValue = sortedNumbers[i];

    if (i > 0 && baseValue === sortedNumbers[i - 1]) {
      pushStep({
        baseIndex: i,
        baseValue,
        leftIndex: null,
        rightIndex: null,
        leftValue: null,
        rightValue: null,
        sum: null,
        action: "skip-base",
        description: `索引 ${i} 的值 ${baseValue} 与前一个相同，跳过以避免重复三元组。`,
      });
      continue;
    }

    if (baseValue > 0) {
      pushStep({
        baseIndex: i,
        baseValue,
        leftIndex: null,
        rightIndex: null,
        leftValue: null,
        rightValue: null,
        sum: null,
        action: "terminate",
        description: `当前基准值 ${baseValue} 已大于 0，后续元素亦为非负，算法结束。`,
      });
      break;
    }

    let left = i + 1;
    let right = n - 1;

    pushStep({
      baseIndex: i,
      baseValue,
      leftIndex: left,
      rightIndex: right,
      leftValue: sortedNumbers[left],
      rightValue: sortedNumbers[right],
      sum: null,
      action: "init-base",
      description: `固定索引 ${i} (值 ${baseValue})，左右指针初始化为 ${left} 与 ${right}。`,
    });

    while (left < right) {
      const leftValue = sortedNumbers[left];
      const rightValue = sortedNumbers[right];
      const sum = baseValue + leftValue + rightValue;

      if (sum === 0) {
        const newTriplet: [number, number, number] = [
          baseValue,
          leftValue,
          rightValue,
        ];
        triplets.push(newTriplet);

        pushStep({
          baseIndex: i,
          baseValue,
          leftIndex: left,
          rightIndex: right,
          leftValue,
          rightValue,
          sum,
          action: "found",
          description: `找到目标组合 (${baseValue}, ${leftValue}, ${rightValue})，三数之和为 0。`,
          highlightTriplet: newTriplet,
        });

        left += 1;
        right -= 1;

        let skippedLeft = 0;
        let skippedRight = 0;

        while (left < right && sortedNumbers[left] === sortedNumbers[left - 1]) {
          skippedLeft += 1;
          left += 1;
        }
        while (
          left < right &&
          sortedNumbers[right] === sortedNumbers[right + 1]
        ) {
          skippedRight += 1;
          right -= 1;
        }

        const hasPointers = left < right;
        const leftValueAfter = hasPointers ? sortedNumbers[left] : null;
        const rightValueAfter = hasPointers ? sortedNumbers[right] : null;
        const parts: string[] = [];
        if (skippedLeft) {
          parts.push(`左指针跳过 ${skippedLeft} 个重复值`);
        }
        if (skippedRight) {
          parts.push(`右指针跳过 ${skippedRight} 个重复值`);
        }
        parts.push(
          hasPointers
            ? `继续比较 (${left}, ${right})`
            : "左右指针已相遇，当前基准完成",
        );

        pushStep({
          baseIndex: i,
          baseValue,
          leftIndex: hasPointers ? left : null,
          rightIndex: hasPointers ? right : null,
          leftValue: leftValueAfter,
          rightValue: rightValueAfter,
          sum: null,
          action: hasPointers ? "contract" : "pointer-meet",
          description: parts.join("，"),
        });
      } else if (sum < 0) {
        pushStep({
          baseIndex: i,
          baseValue,
          leftIndex: left,
          rightIndex: right,
          leftValue,
          rightValue,
          sum,
          action: "move-left",
          description: `当前和 ${sum} 小于 0，右移左指针以增大总和。`,
        });
        left += 1;
      } else {
        pushStep({
          baseIndex: i,
          baseValue,
          leftIndex: left,
          rightIndex: right,
          leftValue,
          rightValue,
          sum,
          action: "move-right",
          description: `当前和 ${sum} 大于 0，左移右指针以减小总和。`,
        });
        right -= 1;
      }
    }

    pushStep({
      baseIndex: i,
      baseValue,
      leftIndex: null,
      rightIndex: null,
      leftValue: left < n ? sortedNumbers[left] : null,
      rightValue: right >= 0 ? sortedNumbers[right] : null,
      sum: null,
      action: "advance-base",
      description: `完成索引 ${i} 的比较，基准将移至 ${i + 1}。`,
    });
  }

  return { sortedNumbers, steps };
};

export default function ThreeSumAnimation() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_NUMBERS.join(", "));
  const [inputError, setInputError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult>(() =>
    generateThreeSumSimulation(DEFAULT_NUMBERS),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = simulation.steps;
  const currentStep = steps[stepIndex] ?? null;
  const totalSteps = steps.length;
  const progress = totalSteps ? Math.min(stepIndex / (totalSteps - 1 || 1), 1) : 0;

  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
    }, 1700);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, totalSteps]);

  useEffect(() => {
    setStepIndex(0);
  }, [simulation]);

  const reset = () => {
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
    setSimulation(generateThreeSumSimulation(DEFAULT_NUMBERS));
    setArrayInput(DEFAULT_NUMBERS.join(", "));
  };

  const handleNext = () => {
    if (!totalSteps) return;
    if (stepIndex >= totalSteps - 1) return;
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const togglePlay = () => {
    if (!totalSteps) return;
    if (stepIndex >= totalSteps - 1) {
      setStepIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const applyArray = (values: number[]) => {
    setSimulation(generateThreeSumSimulation(values));
    setStepIndex(0);
    setIsPlaying(false);
  };

  const handleApplyInput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const segments = arrayInput
      .split(/[\s,，]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length < 3) {
      setInputError("请至少输入三个整数以尝试三数之和。");
      return;
    }

    const parsed = segments.map((segment) => Number(segment));
    if (parsed.some((value) => Number.isNaN(value))) {
      setInputError("检测到无法解析的数字，请仅输入整数。");
      return;
    }

    if (parsed.some((value) => !Number.isFinite(value))) {
      setInputError("请输入有限的整数值。");
      return;
    }

    setInputError(null);
    setArrayInput(parsed.join(", "));
    applyArray(parsed);
  };

  const description = currentStep?.description ?? "准备开始演示。";
  const triplets = currentStep?.triplets ?? [];

  const pointerClasses = (idx: number) => {
    if (!currentStep) return "border-border bg-card";
    if (currentStep.baseIndex === idx) {
      return "border-primary bg-primary/20";
    }
    if (currentStep.leftIndex === idx) {
      return "border-emerald-500 bg-emerald-500/20";
    }
    if (currentStep.rightIndex === idx) {
      return "border-amber-500 bg-amber-500/20";
    }
    return "border-border bg-muted/50";
  };

  const pointerLabel = (idx: number) => {
    if (!currentStep) return null;
    const labels: string[] = [];
    if (currentStep.baseIndex === idx) labels.push("i");
    if (currentStep.leftIndex === idx) labels.push("left");
    if (currentStep.rightIndex === idx) labels.push("right");
    return labels.length ? labels.join(" / ") : null;
  };

  const highlightAction = currentStep?.action ?? null;
  const sumText =
    currentStep && currentStep.sum !== null
      ? `${currentStep.baseValue ?? "?"} + ${currentStep.leftValue ?? "?"} + ${currentStep.rightValue ?? "?"} = ${currentStep.sum}`
      : "暂无求和结果";

  const actionTag = useMemo(() => {
    if (!highlightAction) return { text: "等待中", className: "bg-muted text-muted-foreground" };
    const map: Record<
      StepAction,
      { text: string; className: string }
    > = {
      insufficient: { text: "条件不足", className: "bg-muted text-muted-foreground" },
      "init-base": { text: "初始化指针", className: "bg-primary/15 text-primary" },
      "skip-base": { text: "跳过基准", className: "bg-muted text-muted-foreground" },
      terminate: { text: "提前结束", className: "bg-yellow-500/20 text-yellow-600" },
      "move-left": { text: "右移 left", className: "bg-emerald-500/20 text-emerald-600" },
      "move-right": { text: "左移 right", className: "bg-amber-500/20 text-amber-600" },
      found: { text: "找到解", className: "bg-emerald-500/30 text-emerald-600 font-semibold" },
      contract: { text: "指针收缩", className: "bg-sky-500/20 text-sky-600" },
      "pointer-meet": { text: "指针相遇", className: "bg-purple-500/20 text-purple-600" },
      "advance-base": { text: "准备下一个 i", className: "bg-blue-500/20 text-blue-600" },
    };
    return map[highlightAction] ?? { text: highlightAction, className: "bg-muted text-muted-foreground" };
  }, [highlightAction]);

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">三数之和 - 双指针动画</h3>
        <p className="text-sm text-muted-foreground mt-1">
          先排序，再固定一个基准数，左右指针向中间收缩寻找和为 0 的组合。
        </p>
      </div>

      <form
        onSubmit={handleApplyInput}
        className="mb-6 bg-card border border-border rounded-lg p-4 flex flex-col gap-3"
      >
        <label className="text-xs font-medium text-muted-foreground">
          自定义数组
        </label>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            value={arrayInput}
            onChange={(event) => setArrayInput(event.target.value)}
            placeholder="例如：-1, 0, 1, 2, -1, -4"
          />
          <div className="flex gap-2">
            <Button type="submit">应用数组</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setInputError(null);
                setArrayInput(DEFAULT_NUMBERS.join(", "));
                applyArray(DEFAULT_NUMBERS);
              }}
            >
              使用示例
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          使用逗号或空格分隔，系统将自动排序并演示算法过程。
        </p>
        {inputError && (
          <p className="text-xs text-destructive">{inputError}</p>
        )}
      </form>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button onClick={togglePlay} type="button">
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                暂停
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {stepIndex >= totalSteps - 1 ? "重新播放" : "播放"}
              </>
            )}
          </Button>
          <Button onClick={handleNext} type="button" variant="outline">
            <ArrowRight className="w-4 h-4 mr-2" />
            单步执行
          </Button>
          <Button onClick={reset} type="button" variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>当前动作：</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${actionTag.className}`}
          >
            {actionTag.text}
          </span>
          <span>
            步骤 {totalSteps ? stepIndex + 1 : 0} / {totalSteps || 1}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>进度</span>
          <span>
            {Math.min(stepIndex + 1, totalSteps)} / {totalSteps || 1}
          </span>
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

      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-3">
          已排序数组（索引）
        </p>
        <div className="flex items-end justify-center gap-3 flex-wrap">
          {simulation.sortedNumbers.map((value, idx) => {
            const label = pointerLabel(idx);
            return (
              <motion.div
                key={`${value}-${idx}-${stepIndex}`}
                layout
                className={`relative w-20 h-24 rounded-lg border flex flex-col items-center justify-center transition-colors ${pointerClasses(idx)}`}
                animate={{
                  y:
                    currentStep &&
                    (currentStep.baseIndex === idx ||
                      currentStep.leftIndex === idx ||
                      currentStep.rightIndex === idx)
                      ? -6
                      : 0,
                  scale:
                    currentStep &&
                    (currentStep.baseIndex === idx ||
                      currentStep.leftIndex === idx ||
                      currentStep.rightIndex === idx)
                      ? 1.05
                      : 1,
                }}
              >
                <span className="text-xs text-muted-foreground/70 absolute top-1 left-2">
                  #{idx}
                </span>
                <span className="text-lg font-semibold">{value}</span>
                {label && (
                  <span className="absolute -bottom-3 text-[10px] px-2 py-0.5 rounded-full border border-foreground/10 bg-background/80 backdrop-blur">
                    {label}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            当前求和
          </p>
          <p className="text-sm">{sumText}</p>
          {currentStep?.highlightTriplet && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <Atom className="w-3 h-3" />
              新增解: ({currentStep.highlightTriplet.join(", ")})
            </p>
          )}
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-4 space-y-2 lg:col-span-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            步骤说明
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </motion.div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-muted-foreground">
            已找到的三元组
          </p>
          <span className="text-xs text-muted-foreground">
            共 {triplets.length} 组
          </span>
        </div>
        <div className="min-h-[60px]">
          <AnimatePresence initial={false}>
            {triplets.length === 0 ? (
              <motion.p
                key="empty-triplets"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                还没有找到任意三元组，继续移动指针试试看。
              </motion.p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {triplets.map((triplet, idx) => (
                  <motion.span
                    key={`${triplet.join("-")}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="px-3 py-1 rounded-md bg-emerald-500/15 text-emerald-600 text-xs font-medium border border-emerald-500/20"
                  >
                    ({triplet.join(", ")})
                  </motion.span>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-muted-foreground">步骤日志</p>
          <span className="text-xs text-muted-foreground">
            {totalSteps ? `第 ${stepIndex + 1} 步` : "暂无"}
          </span>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed min-h-[70px]">
          {description}
        </div>
      </div>
    </div>
  );
}
