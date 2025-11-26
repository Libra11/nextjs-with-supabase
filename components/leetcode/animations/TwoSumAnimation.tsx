"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, RotateCcw, Pause } from "lucide-react";

interface ArrayItem {
  value: number;
  index: number;
}

type StepAction = "store" | "found";

interface StepLog {
  step: number;
  index: number;
  value: number;
  complement: number;
  action: StepAction;
  description: string;
}

const DEFAULT_NUMBERS = [11, 2, 7, 15];
const DEFAULT_TARGET = 9;

const buildArrayItems = (values: number[]): ArrayItem[] =>
  values.map((value, index) => ({
    value,
    index,
  }));

export default function TwoSumAnimation() {
  const [nums, setNums] = useState<ArrayItem[]>(buildArrayItems(DEFAULT_NUMBERS));
  const [target, setTarget] = useState<number>(DEFAULT_TARGET);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [hashMap, setHashMap] = useState<Record<number, number>>({});
  const [found, setFound] = useState<[number, number] | null>(null);
  const [highlightedValue, setHighlightedValue] = useState<number | null>(null);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [arrayInput, setArrayInput] = useState(DEFAULT_NUMBERS.join(", "));
  const [targetInput, setTargetInput] = useState(String(DEFAULT_TARGET));
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (step < nums.length) {
        nextStep();
      } else {
        setIsPlaying(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, step, nums.length]);

  const nextStep = () => {
    if (step >= nums.length) return;

    const current = nums[step];
    const complement = target - current.value;
    const currentStep = step + 1;

    setCurrentIndex(step);

    // Check if complement exists in hash map
    if (complement in hashMap) {
      setLogs((prev) => [
        ...prev,
        {
          step: currentStep,
          index: step,
          value: current.value,
          complement,
          action: "found",
          description: `哈希表中找到了需要的 ${complement} (索引 ${hashMap[complement]})，与当前值 ${current.value} 组成目标和 ${target}。`,
        },
      ]);
      setHighlightedValue(complement);
      setFound([hashMap[complement], step]);
      setStep((prev) => prev + 1);
      setIsPlaying(false);
    } else {
      setLogs((prev) => [
        ...prev,
        {
          step: currentStep,
          index: step,
          value: current.value,
          complement,
          action: "store",
          description: `哈希表中没有 ${complement}，将当前值 ${current.value} 及其索引 ${step} 存入哈希表，等待之后匹配。`,
        },
      ]);
      setHighlightedValue(current.value);
      // Add current value to hash map
      setHashMap((prev) => ({ ...prev, [current.value]: step }));
      setStep((prev) => prev + 1);
    }
  };

  const reset = () => {
    setStep(0);
    setCurrentIndex(-1);
    setHashMap({});
    setFound(null);
    setIsPlaying(false);
    setHighlightedValue(null);
    setLogs([]);
  };

  const togglePlay = () => {
    if (step >= nums.length && !found) {
      reset();
    }
    setIsPlaying(!isPlaying);
  };

  const applyData = (values: number[], newTarget: number) => {
    setNums(buildArrayItems(values));
    setTarget(newTarget);
    setStep(0);
    setCurrentIndex(-1);
    setHashMap({});
    setFound(null);
    setIsPlaying(false);
    setHighlightedValue(null);
    setLogs([]);
  };

  const handleApplyInputs = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const segments = arrayInput
      .split(/[\s,，]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length < 2) {
      setInputError("请至少输入两个数字，并使用逗号或空格分隔。");
      return;
    }

    const parsedValues = segments.map((segment) => Number(segment));
    if (parsedValues.some((value) => Number.isNaN(value))) {
      setInputError("数组中包含无效数字，请重新输入。");
      return;
    }

    const trimmedTarget = targetInput.trim();
    if (!trimmedTarget) {
      setInputError("请输入目标和。");
      return;
    }

    const parsedTarget = Number(trimmedTarget);
    if (Number.isNaN(parsedTarget)) {
      setInputError("目标和必须为数字。");
      return;
    }

    setInputError(null);
    applyData(parsedValues, parsedTarget);
  };

  const handleUseDefault = () => {
    setArrayInput(DEFAULT_NUMBERS.join(", "));
    setTargetInput(String(DEFAULT_TARGET));
    setInputError(null);
    applyData(DEFAULT_NUMBERS, DEFAULT_TARGET);
  };

  const currentItem = currentIndex >= 0 ? nums[currentIndex] : null;
  const upcomingItem = step < nums.length ? nums[step] : null;
  const latestLog = logs[logs.length - 1] ?? null;
  const progress = nums.length ? Math.min(step / nums.length, 1) : 0;

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">两数之和算法演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          目标和: <span className="font-semibold text-primary">{target}</span>
        </p>
      </div>

      {/* Custom Inputs */}
      <div className="mb-6">
        <form
          onSubmit={handleApplyInputs}
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="grid grid-cols-1 gap-4 lg:flex-1 lg:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide text-[11px] text-muted-foreground/80">
                输入数组（使用逗号或空格分隔）
              </span>
              <Input
                value={arrayInput}
                onChange={(event) => setArrayInput(event.target.value)}
                placeholder="例如：2, 7, 11, 15"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide text-[11px] text-muted-foreground/80">
                目标和
              </span>
              <Input
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
                placeholder="例如：9"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              应用参数
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleUseDefault}>
              恢复默认
            </Button>
          </div>
        </form>
        {inputError && <p className="mt-2 text-xs text-destructive">{inputError}</p>}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>进度</span>
          <span>
            {Math.min(step, nums.length)} / {nums.length}
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

      {/* Array Visualization */}
      <div className="flex-1 flex items-center justify-center gap-4 mb-6">
        {nums.map((item, idx) => (
          <motion.div
            key={idx}
            className={`
              w-20 h-20 rounded-lg flex flex-col items-center justify-center
              border-2 transition-colors
              ${
                found && (found[0] === idx || found[1] === idx)
                  ? "bg-green-500 text-white border-green-600"
                  : currentIndex === idx
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border"
              }
            `}
            animate={{
              scale: currentIndex === idx ? 1.1 : 1,
              y: currentIndex === idx ? -10 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs opacity-70">index: {idx}</div>
          </motion.div>
        ))}
      </div>

      {/* Hash Map Visualization */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Hash Map:</p>
        <div className="bg-card border border-border rounded-lg p-3 min-h-[60px]">
          <AnimatePresence>
            {Object.entries(hashMap).length === 0 ? (
              <p className="text-sm text-muted-foreground">空</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(hashMap).map(([value, index]) => (
                  <motion.div
                    key={value}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      highlightedValue !== null && Number(value) === highlightedValue
                        ? "bg-primary text-primary-foreground border border-primary/60 shadow-sm"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {value} → {index}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Explanation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">当前操作</p>
          {currentIndex === -1 && !found ? (
            <p className="text-sm text-muted-foreground">
              点击开始或单步按钮，逐步体验哈希表解法的执行流程。
            </p>
          ) : currentItem ? (
            <>
              <p className="text-sm">
                正在处理索引 <span className="font-semibold">{currentIndex}</span> 的数字{" "}
                <span className="font-semibold">{currentItem.value}</span>。
              </p>
              <p className="text-xs text-muted-foreground">
                计算补数：{target} - {currentItem.value} ={" "}
                <span className="font-semibold text-primary">
                  {target - currentItem.value}
                </span>
              </p>
            </>
          ) : found ? (
            <p className="text-sm">
              所有必要的数字已经找到，算法结束。你可以点击重置重新体验。
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              已遍历全部数组元素。由于没有找到满足条件的组合，算法结束。
            </p>
          )}
          {upcomingItem && (
            <p className="text-xs text-muted-foreground">
              下一步将查看索引 {step} 的数字 {upcomingItem.value}。
            </p>
          )}
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">算法思路</p>
          <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
            <li>① 遍历数组中的每一个数字。</li>
            <li>
              ② 对当前数字计算补数 <code>target - 当前值</code>。
            </li>
            <li>③ 如果补数已在哈希表里，说明找到了一对答案。</li>
            <li>④ 如果没有，将当前数字与索引存入哈希表，等待之后匹配。</li>
          </ul>
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">执行轨迹</p>
          <div className="flex-1 overflow-hidden">
            <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-muted-foreground"
                  >
                    每一步的执行结果都会记录在这里，方便回顾。
                  </motion.p>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.step}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`rounded-md border px-2 py-1.5 text-xs ${
                        log.action === "found"
                          ? "border-green-400 bg-green-50 text-green-700 dark:border-green-500/60 dark:bg-green-900/30 dark:text-green-200"
                          : "border-border/60 bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <p className="font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
                        Step {log.step}
                      </p>
                      <p className="mt-0.5 leading-relaxed text-[11px] text-foreground">
                        {log.description}
                      </p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
          {latestLog && (
            <p className="text-[11px] text-muted-foreground">
              最近一步：索引 {latestLog.index} → 当前值 {latestLog.value}，补数{" "}
              {latestLog.complement}
            </p>
          )}
        </motion.div>
      </div>

      {/* Result */}
      {found && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 dark:bg-green-900/30 border border-green-500 rounded-lg p-3 mb-4 text-center"
        >
          <p className="text-green-800 dark:text-green-200 font-medium">
            找到答案! 索引: [{found[0]}, {found[1]}]
          </p>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button onClick={nextStep} size="sm" variant="secondary" disabled={isPlaying || step >= nums.length || Boolean(found)}>
          单步
        </Button>
        <Button onClick={togglePlay} size="sm">
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              暂停
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {step === 0 ? "开始" : "继续"}
            </>
          )}
        </Button>
        <Button onClick={reset} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          重置
        </Button>
      </div>
    </div>
  );
}
