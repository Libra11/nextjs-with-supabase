/**
 * Author: Libra
 * Date: 2025-10-11 11:26:01
 * LastEditTime: 2025-10-11 13:57:47
 * LastEditors: Libra
 * Description:
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";

interface SequenceItem {
  value: number;
  isStart: boolean;
  visited: boolean;
}

interface StepLog {
  step: number;
  value: number;
  action: "skip" | "start" | "extend";
  length: number;
  description: string;
}

const RAW_NUMBERS = [100, 4, 200, 1, 3, 2];

const buildSet = (nums: number[]): number[] => {
  const set = new Set(nums);
  return Array.from(set).sort((a, b) => a - b);
};

export default function LongestConsecutiveAnimation() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [longestSequence, setLongestSequence] = useState<number[]>([]);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [visitedStarts, setVisitedStarts] = useState<Set<number>>(new Set());
  const [highlightSet, setHighlightSet] = useState<Set<number>>(new Set());

  const uniqueNumbers = useMemo(() => buildSet(RAW_NUMBERS), []);
  const progress = uniqueNumbers.length
    ? Math.min(step / uniqueNumbers.length, 1)
    : 0;
  const upcomingValue =
    step < uniqueNumbers.length ? uniqueNumbers[step] : null;
  const latestLog = logs[logs.length - 1] ?? null;

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (step < uniqueNumbers.length) {
        nextStep();
      } else {
        setIsPlaying(false);
      }
    }, 1700);

    return () => clearTimeout(timer);
  }, [isPlaying, step, uniqueNumbers.length]);

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
    setCurrentValue(null);
    setCurrentSequence([]);
    setLongestSequence([]);
    setLogs([]);
    setVisitedStarts(new Set());
    setHighlightSet(new Set());
  };

  const togglePlay = () => {
    if (step >= uniqueNumbers.length) {
      reset();
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const nextStep = () => {
    if (step >= uniqueNumbers.length) return;

    const value = uniqueNumbers[step];
    setCurrentValue(value);
    setHighlightSet(new Set([value]));

    const numSet = new Set(uniqueNumbers);
    const hasPrev = numSet.has(value - 1);

    if (hasPrev) {
      setLogs((prev) => [
        ...prev,
        {
          step: step + 1,
          value,
          action: "skip",
          length: currentSequence.length,
          description: `发现 ${value - 1} 存在于集合中，因此 ${value} 不是连续序列起点，跳过。`,
        },
      ]);
      setVisitedStarts((prev) => new Set(prev).add(value));
      setCurrentSequence([]);
      setStep((prev) => prev + 1);
      return;
    }

    // value is a start
    const sequence = [value];
    let nextVal = value + 1;
    while (numSet.has(nextVal)) {
      sequence.push(nextVal);
      nextVal += 1;
    }

    const newHighlight = new Set(sequence);
    setHighlightSet(newHighlight);
    setVisitedStarts((prev) => new Set(prev).add(value));
    setCurrentSequence(sequence);

    const action: StepLog["action"] = sequence.length > 1 ? "extend" : "start";

    setLogs((prev) => [
      ...prev,
      {
        step: step + 1,
        value,
        action,
        length: sequence.length,
        description:
          sequence.length > 1
            ? `从起点 ${value} 扩展得到连续序列 [${sequence.join(", ")}]，长度为 ${sequence.length}。`
            : `起点 ${value} 没有后继，形成长度为 1 的序列。`,
      },
    ]);

    if (sequence.length > longestSequence.length) {
      setLongestSequence(sequence);
    }

    setStep((prev) => prev + 1);
  };

  const renderSequenceItem = (value: number, idx: number) => {
    const isStart = !uniqueNumbers.includes(value - 1);
    const visited = visitedStarts.has(value);
    const inCurrent = currentSequence.includes(value);
    const inLongest = longestSequence.includes(value);
    const isUpcoming = upcomingValue === value;

    return (
      <motion.div
        key={`${value}-${idx}`}
        layout
        className={`w-20 h-32 rounded-lg border-2 flex flex-col items-center justify-center gap-1 text-sm font-semibold`}
        animate={{
          y: currentValue === value ? -12 : 0,
          scale: currentValue === value ? 1.05 : 1,
        }}
        transition={{ duration: 0.25 }}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-base ${
            highlightSet.has(value)
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          {value}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {isStart ? "可能起点" : "非起点"}
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          {visited ? "已处理" : isUpcoming ? "即将处理" : "未处理"}
        </span>
        {inLongest && (
          <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
            <Flag className="w-3 h-3" />
            最长
          </span>
        )}
      </motion.div>
    );
  };

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background to-muted/20 rounded-lg p-6 flex flex-col">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">最长连续序列 - 算法演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          使用哈希表判断序列起点，线性时间内找到最长连续区间。
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>进度</span>
          <span>
            {Math.min(step, uniqueNumbers.length)} / {uniqueNumbers.length}
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

      {/* Numbers Visualization */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-3 mb-6">
        {uniqueNumbers.map((value, idx) => renderSequenceItem(value, idx))}
      </div>

      {/* Current Sequence */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">当前序列扩展</p>
        <div className="bg-card border border-border rounded-lg p-4 min-h-[80px] flex items-center gap-2">
          <AnimatePresence initial={false}>
            {currentSequence.length === 0 ? (
              <motion.p
                key="empty-sequence"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                还未找到新的起点，等待下一轮处理。
              </motion.p>
            ) : (
              currentSequence.map((value, idx) => (
                <motion.div
                  key={`${value}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-3 py-1 rounded-md bg-primary/10 text-primary text-sm font-semibold"
                >
                  {value}
                </motion.div>
              ))
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
          <p className="text-sm font-semibold text-muted-foreground">
            当前步骤
          </p>
          {currentValue !== null ? (
            <>
              <p className="text-sm">
                正在检查数字{" "}
                <span className="font-semibold">{currentValue}</span>。
              </p>
              <p className="text-xs text-muted-foreground">
                {highlightSet.has(currentValue - 1)
                  ? `因为集合中存在 ${currentValue - 1}，所以 ${currentValue} 不会作为起点。`
                  : `集合中不存在 ${currentValue - 1}，判定 ${currentValue} 为起点，向后扩展。`}
              </p>
            </>
          ) : step === 0 ? (
            <p className="text-sm text-muted-foreground">
              点击开始或单步按键，查看如何识别连续序列的起点。
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              所有数字均已处理，最长连续序列已确定。
            </p>
          )}
          {upcomingValue !== null && (
            <p className="text-xs text-muted-foreground">
              下一步将检查数字：{upcomingValue}
            </p>
          )}
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">
            算法要点
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
            <li>① 使用哈希表（Set）存储所有数字，查询时间 O(1)。</li>
            <li>
              ② 仅当 <code>num - 1</code> 不在集合中时，将 num 视为序列起点。
            </li>
            <li>
              ③ 从起点开始逐个检查 <code>num + k</code> 是否存在，统计长度。
            </li>
            <li>④ 更新记录最长序列，保证整体时间复杂度 O(n)。</li>
          </ul>
        </motion.div>

        <motion.div
          layout
          className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-muted-foreground">
            执行轨迹
          </p>
          <div className="flex-1 overflow-hidden">
            <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <motion.p
                    key="empty-log"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-muted-foreground"
                  >
                    每一个判定与扩展都会记录在这里，方便复盘。
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
                        log.action === "skip"
                          ? "border-border/60 bg-muted/40 text-muted-foreground"
                          : "border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
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
              最近一步：数字 {latestLog.value} → 长度 {latestLog.length}
            </p>
          )}
        </motion.div>
      </div>

      {/* Longest Sequence */}
      {longestSequence.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 via-orange-400/10 to-amber-300/10 border border-amber-400/40 rounded-lg p-4 mb-4"
        >
          <p className="text-sm font-semibold text-amber-600 mb-2">
            当前最长序列（长度 {longestSequence.length}）：
          </p>
          <div className="flex flex-wrap gap-2">
            {longestSequence.map((value, idx) => (
              <span
                key={`longest-${value}-${idx}`}
                className="px-3 py-1 rounded-md bg-amber-500/10 text-amber-600 text-sm font-semibold border border-amber-500/30"
              >
                {value}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={nextStep}
          size="sm"
          variant="secondary"
          disabled={isPlaying || step >= uniqueNumbers.length}
        >
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
