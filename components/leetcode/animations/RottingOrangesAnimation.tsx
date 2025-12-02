"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pause, Play, StepForward, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Types
type CellValue = "0" | "1" | "2"; // 0: Empty, 1: Fresh, 2: Rotten
type CellStatus = "empty" | "fresh" | "rotten" | "just_rotted" | "source";

interface GridCell {
  row: number;
  col: number;
  value: CellValue;
  status: CellStatus;
}

interface AnimationStep {
  id: number;
  title: string;
  description: string;
  gridState: GridCell[][];
  minute: number;
  freshCount: number;
  activeCells: [number, number][]; // Rotten oranges currently spreading
  affectedCells: [number, number][]; // Fresh oranges that just became rotten
  action: "init" | "spread" | "no-change" | "finished" | "impossible";
}

const DEFAULT_GRID_INPUT = `211
110
011`;

const CELL_SIZE = 60;

export default function RottingOrangesAnimation() {
  const [inputStr, setInputStr] = useState(DEFAULT_GRID_INPUT);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [steps, setSteps] = useState<AnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    handleApply();
  }, []);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, 1000); // 1 second per minute/step

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps]);

  const handleApply = (e?: FormEvent) => {
    e?.preventDefault();
    try {
      const parsedGrid = parseGridInput(inputStr);
      setGrid(parsedGrid);
      const generatedSteps = generateSteps(parsedGrid);
      setSteps(generatedSteps);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Invalid input");
      setSteps([]);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const currentStep = steps[currentStepIndex];
  const displayGrid = currentStep?.gridState || grid;

  return (
    <div className="space-y-6 w-full">
      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">腐烂的橘子动画演示</h3>
            <p className="text-sm text-muted-foreground">
              使用多源 BFS 模拟橘子腐烂过程，每一分钟腐烂向四周扩散。
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              网格配置 (0: 空, 1: 新鲜, 2: 腐烂)
            </label>
            <Textarea
              value={inputStr}
              onChange={(e) => setInputStr(e.target.value)}
              placeholder="211\n110\n011"
              className="font-mono min-h-[100px]"
            />
            <p className="text-[10px] text-muted-foreground">
              每行输入一行网格，用换行分隔。字符只允许 '0', '1', '2'。
            </p>
          </div>
          <div className="flex flex-col justify-end gap-2 min-w-[80px]">
            <Button onClick={handleApply} className="w-full">
              应用
            </Button>
            <Button variant="outline" onClick={handleReset} className="w-full">
              重置
            </Button>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Visualization */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left: Grid */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-center min-h-[400px] overflow-auto">
          {displayGrid.length > 0 ? (
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${displayGrid[0].length}, ${CELL_SIZE}px)`,
              }}
            >
              {displayGrid.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  const isActive = currentStep?.activeCells?.some(
                    ([r, c]) => r === rIdx && c === cIdx
                  );
                  const isJustRotted = currentStep?.affectedCells?.some(
                    ([r, c]) => r === rIdx && c === cIdx
                  );

                  return (
                    <motion.div
                      key={`${rIdx}-${cIdx}`}
                      layout
                      initial={false}
                      animate={{
                        scale: isJustRotted ? [1, 1.2, 1] : 1,
                        borderColor: isActive ? "#f97316" : undefined, // Orange border for active sources
                      }}
                      transition={{ duration: 0.3 }}
                      className={`
                        w-[60px] h-[60px] rounded-md flex items-center justify-center text-2xl font-bold border-2 transition-colors duration-300
                        ${getCellColor(cell, isActive, isJustRotted)}
                      `}
                    >
                      {getCellIcon(cell.value)}
                    </motion.div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">暂无网格数据</div>
          )}

          {/* Playback Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 p-2 rounded-lg border border-border shadow-lg backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setCurrentStepIndex(
                  Math.min(steps.length - 1, currentStepIndex + 1)
                )
              }
              disabled={currentStepIndex >= steps.length - 1}
            >
              <StepForward className="h-4 w-4" />
            </Button>
            <div className="text-xs text-muted-foreground w-20 text-center tabular-nums">
              {currentStepIndex + 1} / {steps.length}
            </div>
          </div>
        </div>

        {/* Right: Status */}
        <div className="flex flex-col gap-4 h-full">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm">当前状态</h4>
              <Badge variant="outline" className="text-base px-3">
                时间: {currentStep?.minute ?? 0} 分钟
              </Badge>
            </div>

            {currentStep ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/30 p-2 rounded border border-border/50">
                    <span className="text-muted-foreground block text-xs">
                      新鲜橘子
                    </span>
                    <span className="text-lg font-mono font-semibold text-emerald-600">
                      {currentStep.freshCount}
                    </span>
                  </div>
                  <div className="bg-muted/30 p-2 rounded border border-border/50">
                    <span className="text-muted-foreground block text-xs">
                      当前动作
                    </span>
                    <span className="font-medium">
                      {getActionLabel(currentStep.action)}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground leading-relaxed bg-card p-3 rounded border border-border/50">
                  <span className="font-semibold text-foreground block mb-1">
                    {currentStep.title}
                  </span>
                  {currentStep.description}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center">
                准备开始
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-1">
            <h4 className="font-semibold text-sm mb-2">图例</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-100 border-slate-200 text-slate-400 flex items-center justify-center">
                  ∅
                </div>
                <span>空单元格 (0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-100 border-emerald-300 text-emerald-600 flex items-center justify-center text-lg">
                  🍊
                </div>
                <span>新鲜橘子 (1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-100 border-orange-400 text-orange-700 flex items-center justify-center text-lg">
                  🦠
                </div>
                <span>腐烂橘子 (2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-100 border-2 border-red-500 text-red-700 flex items-center justify-center text-lg shadow-sm">
                  🦠
                </div>
                <span>刚被感染</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Logic & Helpers ---

function getCellColor(
  cell: GridCell,
  isActive: boolean | undefined,
  isJustRotted: boolean | undefined
): string {
  if (cell.value === "0") {
    return "bg-slate-50 border-slate-200 text-slate-300";
  }

  if (cell.value === "1") {
    return "bg-emerald-50 border-emerald-200 text-emerald-500";
  }

  // Value is 2 (Rotten)
  if (isJustRotted) {
    return "bg-red-50 border-red-500 text-red-600 shadow-md z-10";
  }

  if (isActive) {
    return "bg-orange-100 border-orange-500 text-orange-700 shadow-sm";
  }

  return "bg-orange-50 border-orange-300 text-orange-600";
}

function getCellIcon(value: CellValue): string {
  switch (value) {
    case "0":
      return "";
    case "1":
      return "🍊";
    case "2":
      return "🦠";
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case "init":
      return "初始化";
    case "spread":
      return "腐烂扩散";
    case "no-change":
      return "无变化";
    case "finished":
      return "完成";
    case "impossible":
      return "无法完成";
    default:
      return action;
  }
}

function parseGridInput(input: string): GridCell[][] {
  const rows = input.trim().split("\n");
  return rows.map((rowStr, r) =>
    rowStr
      .trim()
      .split("")
      .filter((c) => c.trim().length > 0) // handle potential spaces if user types "2 1 1"
      .map((char, c) => {
        if (char !== "0" && char !== "1" && char !== "2")
          throw new Error(
            `Invalid character at row ${r + 1}, col ${c + 1}: ${char}`
          );
        return {
          row: r,
          col: c,
          value: char as CellValue,
          status: char === "0" ? "empty" : char === "1" ? "fresh" : "rotten",
        };
      })
  );
}

function generateSteps(initialGrid: GridCell[][]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const m = initialGrid.length;
  if (m === 0) return steps;
  const n = initialGrid[0].length;

  // Deep copy helper
  const cloneGrid = (g: GridCell[][]) =>
    g.map((row) => row.map((c) => ({ ...c })));

  let stepId = 0;
  let currentGrid = cloneGrid(initialGrid);
  let queue: [number, number][] = [];
  let freshCount = 0;

  // 1. Initialization
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (currentGrid[i][j].value === "2") {
        queue.push([i, j]);
        currentGrid[i][j].status = "source";
      } else if (currentGrid[i][j].value === "1") {
        freshCount++;
      }
    }
  }

  steps.push({
    id: stepId++,
    title: "初始状态",
    description: `统计发现 ${freshCount} 个新鲜橘子和 ${queue.length} 个腐烂橘子。将所有腐烂橘子加入队列。`,
    gridState: cloneGrid(currentGrid),
    minute: 0,
    freshCount,
    activeCells: [...queue],
    affectedCells: [],
    action: "init",
  });

  let minutes = 0;
  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  // 2. BFS
  while (queue.length > 0 && freshCount > 0) {
    const size = queue.length;
    let hasRotten = false;
    const currentLevelSources = [...queue]; // Capture sources for this minute
    const newRottenCells: [number, number][] = [];
    const nextQueue: [number, number][] = []; // Temporary queue for next level

    // We need to process the *entire* level for the visualization of "one minute"
    // But we can't empty the queue directly because we need to iterate.
    // Actually standard BFS uses a single queue and processes `size` elements.

    // For visualization, we want to show the spread from ALL sources simultaneously.
    // So we process all `size` elements.

    for (let i = 0; i < size; i++) {
      const [x, y] = queue.shift()!;

      // For logic, we might re-push to queue? No, standard BFS shifts.
      // But for next minute we need the NEWLY rotten ones.

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (
          nx >= 0 &&
          nx < m &&
          ny >= 0 &&
          ny < n &&
          currentGrid[nx][ny].value === "1"
        ) {
          currentGrid[nx][ny].value = "2";
          currentGrid[nx][ny].status = "just_rotted";
          newRottenCells.push([nx, ny]);
          queue.push([nx, ny]); // Push to queue for next level
          freshCount--;
          hasRotten = true;
        }
      }
    }

    if (hasRotten) {
      minutes++;

      steps.push({
        id: stepId++,
        title: `第 ${minutes} 分钟`,
        description: `腐烂扩散！${newRottenCells.length} 个新鲜橘子被感染。`,
        gridState: cloneGrid(currentGrid),
        minute: minutes,
        freshCount,
        activeCells: currentLevelSources,
        affectedCells: newRottenCells,
        action: "spread",
      });

      // After this step, we should update status from "just_rotted" to "rotten" for next step visual stability
      // But `cloneGrid` copies the state at that moment.
      // We need to "clean up" the `just_rotted` status in the *working* grid for future steps,
      // but keep it for the current step's snapshot.
      // Actually, it's better to keep them as "rotten" in grid, and only distinguish in `affectedCells` prop.

      // Let's refine:
      // The `status` field in GridCell is persistent.
      // If I set it to `just_rotted`, it stays that way unless changed.
      // I should reset it to `rotten` after the snapshot.
      newRottenCells.forEach(([r, c]) => {
        currentGrid[r][c].status = "rotten";
      });
    } else {
      // If queue not empty but no fresh oranges reachable (shouldn't happen if check freshCount > 0 loop condition usually)
      // But if we have rotten oranges trapped by empty cells, queue processes but nothing rots.
      // In that case time doesn't advance.
    }
  }

  // 3. Final Result
  if (freshCount === 0) {
    steps.push({
      id: stepId++,
      title: "完成",
      description: `所有新鲜橘子都已腐烂。总耗时: ${minutes} 分钟。`,
      gridState: cloneGrid(currentGrid),
      minute: minutes,
      freshCount,
      activeCells: [],
      affectedCells: [],
      action: "finished",
    });
  } else {
    steps.push({
      id: stepId++,
      title: "无法完成",
      description: `还有 ${freshCount} 个新鲜橘子无法被感染（被空单元格隔离）。返回 -1。`,
      gridState: cloneGrid(currentGrid),
      minute: minutes,
      freshCount,
      activeCells: [],
      affectedCells: [],
      action: "impossible",
    });
  }

  return steps;
}
