"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, ArrowRight, RotateCcw, Droplet } from "lucide-react";

const DEFAULT_HEIGHTS = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
const MAX_SUPPORTED_LENGTH = 14;

type StepAction =
  | "insufficient"
  | "init"
  | "raise-left-max"
  | "collect-left"
  | "raise-right-max"
  | "collect-right"
  | "complete";

interface StepSnapshot {
  id: number;
  action: StepAction;
  leftIndex: number | null;
  rightIndex: number | null;
  processedIndex: number | null;
  side: "left" | "right" | null;
  leftMax: number;
  rightMax: number;
  waterAdded: number;
  cumulativeWater: number;
  waterLevels: number[];
  description: string;
}

interface SimulationResult {
  heights: number[];
  steps: StepSnapshot[];
}

const cloneLevels = (levels: number[]) => levels.slice();

const generateTrapRainSimulation = (values: number[]): SimulationResult => {
  const heights = [...values];
  const steps: StepSnapshot[] = [];
  const waterLevels = new Array(heights.length).fill(0);
  let left = 0;
  let right = heights.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let totalWater = 0;
  let id = 1;

  const pushStep = (
    payload: Omit<
      StepSnapshot,
      "id" | "waterLevels"
    >,
  ) => {
    steps.push({
      id: id++,
      ...payload,
      waterLevels: cloneLevels(waterLevels),
    });
  };

  if (heights.length === 0) {
    pushStep({
      action: "insufficient",
      leftIndex: null,
      rightIndex: null,
      processedIndex: null,
      side: null,
      leftMax: 0,
      rightMax: 0,
      waterAdded: 0,
      cumulativeWater: 0,
      description: "数组为空，无法计算积水量。",
    });
    return { heights, steps };
  }

  if (heights.length < 3) {
    pushStep({
      action: "insufficient",
      leftIndex: null,
      rightIndex: null,
      processedIndex: null,
      side: null,
      leftMax: 0,
      rightMax: 0,
      waterAdded: 0,
      cumulativeWater: 0,
      description: "柱子数量不足 3，无法形成容器接水。",
    });
    return { heights, steps };
  }

  pushStep({
    action: "init",
    leftIndex: left,
    rightIndex: right,
    processedIndex: null,
    side: null,
    leftMax,
    rightMax,
    waterAdded: 0,
    cumulativeWater: totalWater,
    description: `初始化 left = ${left}, right = ${right}，左右最大高度均为 0。`,
  });

  while (left <= right) {
    const useLeftSide = heights[left] <= heights[right];
    const currentIndex = useLeftSide ? left : right;
    const currentHeight = heights[currentIndex];
    const currentLeft = left;
    const currentRight = right;

    if (useLeftSide) {
      if (currentHeight >= leftMax) {
        leftMax = currentHeight;
        pushStep({
          action: "raise-left-max",
          leftIndex: currentLeft,
          rightIndex: currentRight,
          processedIndex: currentIndex,
          side: "left",
          leftMax,
          rightMax,
          waterAdded: 0,
          cumulativeWater: totalWater,
          description: `更新左侧最大高度 leftMax = ${leftMax}，当前柱子高度 ${currentHeight} 不会产生积水。`,
        });
      } else {
        const collected = leftMax - currentHeight;
        waterLevels[currentIndex] += collected;
        totalWater += collected;
        pushStep({
          action: "collect-left",
          leftIndex: currentLeft,
          rightIndex: currentRight,
          processedIndex: currentIndex,
          side: "left",
          leftMax,
          rightMax,
          waterAdded: collected,
          cumulativeWater: totalWater,
          description: `左侧最大高度 ${leftMax} 高于当前高度 ${currentHeight}，在索引 ${currentIndex} 处接到 ${collected} 单位雨水。`,
        });
      }
      left += 1;
    } else {
      if (currentHeight >= rightMax) {
        rightMax = currentHeight;
        pushStep({
          action: "raise-right-max",
          leftIndex: currentLeft,
          rightIndex: currentRight,
          processedIndex: currentIndex,
          side: "right",
          leftMax,
          rightMax,
          waterAdded: 0,
          cumulativeWater: totalWater,
          description: `更新右侧最大高度 rightMax = ${rightMax}，当前柱子高度 ${currentHeight} 不会产生积水。`,
        });
      } else {
        const collected = rightMax - currentHeight;
        waterLevels[currentIndex] += collected;
        totalWater += collected;
        pushStep({
          action: "collect-right",
          leftIndex: currentLeft,
          rightIndex: currentRight,
          processedIndex: currentIndex,
          side: "right",
          leftMax,
          rightMax,
          waterAdded: collected,
          cumulativeWater: totalWater,
          description: `右侧最大高度 ${rightMax} 高于当前高度 ${currentHeight}，在索引 ${currentIndex} 处接到 ${collected} 单位雨水。`,
        });
      }
      right -= 1;
    }
  }

  pushStep({
    action: "complete",
    leftIndex: null,
    rightIndex: null,
    processedIndex: null,
    side: null,
    leftMax,
    rightMax,
    waterAdded: 0,
    cumulativeWater: totalWater,
    description: `双指针相遇，处理完成。总共接到 ${totalWater} 单位雨水。`,
  });

  return { heights, steps };
};

export default function TrappingRainWaterAnimation() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_HEIGHTS.join(", "));
  const [inputError, setInputError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult>(() =>
    generateTrapRainSimulation(DEFAULT_HEIGHTS),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { heights, steps } = simulation;
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex] ?? null;
  const progress = totalSteps
    ? Math.min(stepIndex / Math.max(totalSteps - 1, 1), 1)
    : 0;

  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
    }, 1600);
    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, totalSteps]);

  useEffect(() => {
    setStepIndex(0);
  }, [simulation]);

  const reset = () => {
    setSimulation(generateTrapRainSimulation(DEFAULT_HEIGHTS));
    setArrayInput(DEFAULT_HEIGHTS.join(", "));
    setStepIndex(0);
    setIsPlaying(false);
    setInputError(null);
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
    setSimulation(generateTrapRainSimulation(values));
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
      setInputError("请至少输入三个非负整数才能形成容器。");
      return;
    }

    if (segments.length > MAX_SUPPORTED_LENGTH) {
      setInputError(`为保证视觉效果，请输入不超过 ${MAX_SUPPORTED_LENGTH} 个高度值。`);
      return;
    }

    const parsed = segments.map((segment) => Number(segment));
    if (parsed.some((value) => Number.isNaN(value))) {
      setInputError("检测到无法解析的数字，请仅输入整数。");
      return;
    }

    if (parsed.some((value) => value < 0)) {
      setInputError("高度必须为非负整数。");
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

  const waterLevels = currentStep?.waterLevels ?? new Array(heights.length).fill(0);
  const maxDisplay = useMemo(() => {
    if (!heights.length) return 1;
    return Math.max(
      ...heights.map((value, idx) => value + (waterLevels[idx] ?? 0)),
      1,
    );
  }, [heights, waterLevels]);

  const processedIndex = currentStep?.processedIndex ?? null;
  const leftPointer = currentStep?.leftIndex ?? null;
  const rightPointer = currentStep?.rightIndex ?? null;
  const cumulativeWater = currentStep?.cumulativeWater ?? 0;
  const latestAction = currentStep?.action ?? "init";

  const actionLabel = useMemo(() => {
    const map: Record<
      StepAction,
      { text: string; className: string }
    > = {
      insufficient: {
        text: "条件不足",
        className: "bg-muted text-muted-foreground",
      },
      init: { text: "初始化", className: "bg-primary/15 text-primary" },
      "raise-left-max": {
        text: "更新 leftMax",
        className: "bg-sky-500/20 text-sky-600",
      },
      "collect-left": {
        text: "接水 (left)",
        className: "bg-emerald-500/25 text-emerald-600 font-semibold",
      },
      "raise-right-max": {
        text: "更新 rightMax",
        className: "bg-orange-500/20 text-orange-600",
      },
      "collect-right": {
        text: "接水 (right)",
        className: "bg-emerald-500/25 text-emerald-600 font-semibold",
      },
      complete: {
        text: "完成",
        className: "bg-purple-500/20 text-purple-600",
      },
    };
    return map[latestAction] ?? {
      text: latestAction,
      className: "bg-muted text-muted-foreground",
    };
  }, [latestAction]);

  const stepsToDisplay = steps.slice(0, stepIndex + 1);

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">接雨水 - 双指针动画</h3>
        <p className="text-sm text-muted-foreground mt-1">
          左右指针收缩维护最大高度，实时展示每根柱子承载的雨水量。
        </p>
      </div>

      <form
        onSubmit={handleApplyInput}
        className="mb-6 bg-card border border-border rounded-lg p-4 flex flex-col gap-3"
      >
        <label className="text-xs font-medium text-muted-foreground">
          自定义高度数组
        </label>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            value={arrayInput}
            onChange={(event) => setArrayInput(event.target.value)}
            placeholder="例如：0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1"
          />
          <div className="flex gap-2">
            <Button type="submit">应用数组</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setInputError(null);
                setArrayInput(DEFAULT_HEIGHTS.join(", "));
                applyArray(DEFAULT_HEIGHTS);
              }}
            >
              使用示例
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          输入非负整数，使用英文或中文逗号、空格分隔。长度建议 3 - {MAX_SUPPORTED_LENGTH}。
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
            className={`px-2 py-0.5 rounded-full text-xs ${actionLabel.className}`}
          >
            {actionLabel.text}
          </span>
          <span>
            步骤 {totalSteps ? stepIndex + 1 : 0} / {totalSteps || 1}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>迭代进度</span>
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
          柱子高度与积水展示
        </p>
        <div className="flex items-end justify-center gap-4 flex-wrap pb-6">
          {heights.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              没有柱子可展示。
            </div>
          ) : (
            heights.map((value, idx) => {
              const barHeight = Math.max((value / maxDisplay) * 200, value === 0 ? 4 : 10);
              const waterHeight = (waterLevels[idx] / maxDisplay) * 200;
              const isProcessed = processedIndex === idx;
              const isLeft = leftPointer === idx;
              const isRight = rightPointer === idx;
              const labels: string[] = [];
              if (isLeft) labels.push("left");
              if (isRight) labels.push("right");

              return (
                <motion.div
                  key={`${value}-${idx}-${stepIndex}`}
                  layout
                  className="relative w-12 h-[220px] flex flex-col items-center justify-end"
                >
                  <span className="text-[10px] text-muted-foreground/70 mb-1">
                    #{idx}
                  </span>
                  <div className="w-full h-full relative flex items-end justify-center">
                    <div
                      className={`absolute bottom-0 w-full rounded-t-md border ${isProcessed ? "border-primary bg-primary/25" : "border-border bg-muted/60"} z-10`}
                      style={{ height: `${barHeight}px` }}
                    />
                    <AnimatePresence>
                      {waterHeight > 0 && (
                        <motion.div
                          key={`water-${idx}-${stepIndex}`}
                          className="absolute w-full rounded-t-md bg-sky-500/25 border border-sky-500/40 z-20"
                          initial={{ opacity: 0, height: 0, bottom: `${barHeight}px` }}
                          animate={{
                            opacity: 1,
                            height: `${waterHeight}px`,
                            bottom: `${barHeight}px`,
                          }}
                          exit={{ opacity: 0 }}
                          style={{
                            height: `${waterHeight}px`,
                            bottom: `${barHeight}px`,
                          }}
                        />
                      )}
                    </AnimatePresence>
                    <span className="text-xs font-semibold text-muted-foreground relative z-30">
                      {value}
                    </span>
                  </div>
                  {labels.length > 0 && (
                    <div className="absolute -bottom-6 flex gap-1">
                      {labels.map((label) => (
                        <span
                          key={label}
                          className="px-2 py-0.5 rounded-full border border-primary/40 bg-primary/15 text-[10px] text-primary"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  {waterLevels[idx] > 0 && (
                    <span className="absolute -top-6 text-[10px] text-sky-600 font-semibold">
                      +{waterLevels[idx]}
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            最大高度跟踪
          </p>
          <div className="text-sm space-y-1">
            <p>leftMax: <span className="font-semibold">{currentStep?.leftMax ?? 0}</span></p>
            <p>rightMax: <span className="font-semibold">{currentStep?.rightMax ?? 0}</span></p>
          </div>
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            累积雨量
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Droplet className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary">
              {cumulativeWater}
            </span>
          </div>
          {currentStep?.waterAdded ? (
            <p className="text-xs text-emerald-600">
              本步新增 {currentStep.waterAdded} 单位雨水。
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              本步未增加雨水。
            </p>
          )}
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-4 space-y-2 lg:col-span-1"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            步骤说明
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {currentStep?.description ?? "准备开始演示。"}
          </p>
        </motion.div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-muted-foreground">
            步骤日志
          </p>
          <span className="text-xs text-muted-foreground">
            {totalSteps ? `已播放 ${stepIndex + 1} / ${totalSteps}` : "暂无"}
          </span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {stepsToDisplay.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                日志为空。播放动画以查看详细过程。
              </motion.p>
            ) : (
              stepsToDisplay.map((step) => (
                <motion.div
                  key={step.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-xs bg-muted/70 rounded-md px-3 py-2 border border-border/70"
                >
                  <p className="font-semibold text-muted-foreground">
                    第 {step.id} 步 · {step.description}
                  </p>
                  {step.waterAdded > 0 && (
                    <p className="text-emerald-600 mt-1">
                      累积水量增加 {step.waterAdded}，当前总量 {step.cumulativeWater}。
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
