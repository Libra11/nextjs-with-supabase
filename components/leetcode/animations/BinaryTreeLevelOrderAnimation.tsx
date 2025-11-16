"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  NodeTypes,
  Position,
} from "reactflow";
import dagre from "dagre";

import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TraversalMethod = "bfs" | "dfs";

interface TreeNode {
  id: string;
  value: number;
  index: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

type StepAction = "enqueue" | "dequeue" | "visit" | "descend" | "complete";

type NodeStatus = "current" | "queue" | "stack" | "level" | "visited" | "default";

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
}

interface BuildTreeResult {
  root: TreeNode | null;
  nodes: TreeNode[];
}

interface LevelOrderStep {
  id: number;
  title: string;
  description: string;
  action: StepAction;
  currentNode: number | null;
  level: number;
  queue: number[];
  stack: number[];
  visited: number[];
  currentLevel: number[];
  resultSnapshot: number[][];
}

interface ParseSuccess {
  ok: true;
  values: (number | null)[];
}

interface ParseError {
  ok: false;
  error: string;
}

type ParseResult = ParseSuccess | ParseError;

interface FlowGraphResult {
  nodes: Node<TreeNodeFlowData>[];
  edges: Edge[];
}

const DEFAULT_INPUT = "3,9,20,null,null,15,7";
const DEFAULT_VALUES: (number | null)[] = [3, 9, 20, null, null, 15, 7];
const MAX_NODES = 41;
const NODE_SIZE = 96;
const EDGE_COLOR = "rgba(59,130,246,0.7)";

const methodDescriptions: Record<TraversalMethod, string> = {
  bfs: "使用队列逐层弹出节点，按层宽度控制，天然完成层序遍历，是最经典实现。",
  dfs: "通过递归记录层号，将每个节点的值直接写入对应层数组，真实展示 DFS 也能完成层序遍历。",
};

const actionLabels: Record<StepAction, string> = {
  enqueue: "入队",
  dequeue: "出队",
  visit: "访问",
  descend: "递归",
  complete: "完成",
};

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary",
  queue: "bg-purple-500/20 border-purple-500/70 text-purple-700",
  stack: "bg-amber-500/20 border-amber-500/80 text-amber-800",
  level: "bg-sky-500/20 border-sky-500 text-sky-700",
  visited: "bg-emerald-500/20 border-emerald-500/80 text-emerald-700",
  default: "bg-card/90 border-border text-foreground",
};

function TreeNodeNode({ data }: NodeProps<TreeNodeFlowData>) {
  const { value, index, status } = data;
  const statusClass = statusClasses[status] ?? statusClasses.default;

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 pointer-events-none"
        isConnectable={false}
      />
      <div
        className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center font-semibold text-lg shadow-lg ${statusClass}`}
      >
        <span>{value}</span>
        <span className="text-[10px] text-muted-foreground/80 font-normal">#{index}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 pointer-events-none"
        isConnectable={false}
      />
    </div>
  );
}

export default function BinaryTreeLevelOrderAnimation() {
  const [method, setMethod] = useState<TraversalMethod>("bfs");
  const [levelOrderInput, setLevelOrderInput] = useState(DEFAULT_INPUT);
  const [treeValues, setTreeValues] = useState<(number | null)[]>([...DEFAULT_VALUES]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const treeData = useMemo(() => buildTreeData(treeValues), [treeValues]);
  const valueLookup = useMemo(() => {
    const lookup = new Map<number, number>();
    treeData.nodes.forEach((node) => lookup.set(node.index, node.value));
    return lookup;
  }, [treeData.nodes]);

  const steps = useMemo(() => {
    return method === "dfs"
      ? generateDfsSteps(treeData.root)
      : generateBfsSteps(treeData.root);
  }, [method, treeData.root]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [method, treeData.root]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps.length]);

  const stepInfo = steps[currentStep] ?? steps[0];
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const flowGraph = useMemo(() => buildFlowElements(treeData.root, stepInfo), [treeData.root, stepInfo]);

  const treeDepth = useMemo(() => getTreeDepth(treeData.root), [treeData.root]);
  const canvasHeight = Math.max(360, (treeDepth + 1) * 180);
  const progress = steps.length <= 1 ? 1 : currentStep / (steps.length - 1);

  const structureLabel = method === "bfs" ? "队列" : "递归栈";
  const structureItems = method === "bfs" ? stepInfo?.queue ?? [] : stepInfo?.stack ?? [];
  const visitedNodes = stepInfo?.visited ?? [];
  const currentLevelNodes = stepInfo?.currentLevel ?? [];
  const resultMatrix = stepInfo?.resultSnapshot ?? [];

  const recentSteps = useMemo(() => {
    const start = Math.max(0, currentStep - 2);
    return steps.slice(start, currentStep + 1);
  }, [currentStep, steps]);

  const handleApplyInput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseLevelOrderInput(levelOrderInput);
    if (!parsed.ok) {
      setInputError(parsed.error);
      return;
    }
    setTreeValues(parsed.values);
    setInputError(null);
  };

  const handleUseExample = () => {
    setLevelOrderInput(DEFAULT_INPUT);
    setTreeValues([...DEFAULT_VALUES]);
    setInputError(null);
  };

  const handleClearInput = () => {
    setLevelOrderInput("");
    setTreeValues([]);
    setInputError(null);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const nodeTypes = nodeTypesRef.current;

  const formatStructureItem = (idx: number) => {
    const value = valueLookup.get(idx);
    return `#${idx}${value !== undefined ? `(${value})` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/80 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">二叉树层序遍历动画</h3>
            <p className="text-sm text-muted-foreground">
              展示 BFS 队列与 DFS 递归两种思路如何逐层填充输出矩阵。
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={method === "bfs" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("bfs")}
            >
              队列 BFS
            </Button>
            <Button
              variant={method === "dfs" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("dfs")}
            >
              DFS 递归
            </Button>
          </div>
        </div>

        <form onSubmit={handleApplyInput} className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              value={levelOrderInput}
              onChange={(event) => setLevelOrderInput(event.target.value)}
              placeholder="例如：3,9,20,null,null,15,7"
            />
            {inputError ? (
              <p className="mt-1 text-xs text-destructive">{inputError}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                输入层序序列（最多 {MAX_NODES} 个），null 表示空节点。
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              应用
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleClearInput}>
              清空
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleUseExample}>
              示例
            </Button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <div className="rounded-xl border border-border bg-card/80 p-4">
          <div className="flex flex-col gap-4">
            <div className="relative rounded-lg border border-dashed border-border bg-muted/20">
              {flowGraph.nodes.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
                  输入非空树以查看动画。
                </div>
              ) : (
                <ReactFlow
                  nodes={flowGraph.nodes}
                  edges={flowGraph.edges}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  minZoom={0.2}
                  maxZoom={1.2}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  preventScrolling={false}
                  panOnScroll
                  zoomOnScroll={false}
                  style={{ minHeight: canvasHeight }}
                >
                  <Background variant={BackgroundVariant.Dots} gap={32} size={1} className="opacity-70" />
                  <Controls showInteractive={false} className="bg-background/80" />
                </ReactFlow>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">进度</span>
                <span className="text-muted-foreground">
                  Step {currentStep + 1} / {steps.length}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(4, progress * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsPlaying((prev) => !prev)}>
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> 暂停
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> 播放
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={handleStepForward}>
                <StepForward className="mr-2 h-4 w-4" /> 单步
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" /> 重置
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">当前步骤</p>
                <h4 className="text-lg font-semibold">{stepInfo?.title ?? "等待输入"}</h4>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {stepInfo ? actionLabels[stepInfo.action] : "-"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {stepInfo?.description ?? "请输入有效的层序序列以开始动画。"}
            </p>
            <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground">
              {methodDescriptions[method]}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">{structureLabel}</h4>
              <span className="text-xs text-muted-foreground">{structureItems.length} 项</span>
            </div>
            {structureItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">结构为空。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {structureItems.map((idx, index) => (
                  <div key={`${idx}-${index}`} className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                    {formatStructureItem(idx)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">当前层（Level {stepInfo?.level ?? 0})</h4>
              <span className="text-xs text-muted-foreground">{currentLevelNodes.length} 个</span>
            </div>
            {currentLevelNodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂无正在构建的层。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentLevelNodes.map((idx) => (
                  <div key={idx} className="rounded-full border border-sky-500/50 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-700">
                    {formatStructureItem(idx)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">已访问节点</h4>
              <span className="text-xs text-muted-foreground">{visitedNodes.length}</span>
            </div>
            {visitedNodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">尚未访问节点。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {visitedNodes.map((idx) => (
                  <div key={idx} className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700">
                    {formatStructureItem(idx)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">结果矩阵</h4>
              <span className="text-xs text-muted-foreground">{resultMatrix.length} 层</span>
            </div>
            {resultMatrix.length === 0 ? (
              <p className="text-xs text-muted-foreground">输出为空。</p>
            ) : (
              <div className="space-y-2 text-xs">
                {resultMatrix.map((levelValues, levelIndex) => (
                  <div key={levelIndex} className="flex items-center justify-between rounded border border-border/60 bg-background/60 px-3 py-2">
                    <span className="font-semibold">Level {levelIndex}</span>
                    <span className="text-muted-foreground">[{levelValues.join(", ")} ]</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">步骤日志</h4>
              <span className="text-xs text-muted-foreground">最近 {recentSteps.length} 条</span>
            </div>
            <div className="space-y-3">
              {recentSteps.map((step) => (
                <div key={step.id} className="rounded-lg border border-border/60 bg-background/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{step.title}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {actionLabels[step.action]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
              {recentSteps.length === 0 && (
                <p className="text-xs text-muted-foreground">暂无步骤。</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildFlowElements(root: TreeNode | null, step?: LevelOrderStep): FlowGraphResult {
  if (!root) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 110,
    ranksep: 140,
    marginx: 40,
    marginy: 40,
  });

  const queue: TreeNode[] = [root];
  const treeNodes: TreeNode[] = [];
  const connections: Array<{ source: string; target: string }> = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    treeNodes.push(node);

    if (node.left) {
      queue.push(node.left);
      connections.push({ source: node.id, target: node.left.id });
    }
    if (node.right) {
      queue.push(node.right);
      connections.push({ source: node.id, target: node.right.id });
    }
  }

  treeNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_SIZE, height: NODE_SIZE });
  });
  connections.forEach(({ source, target }) => dagreGraph.setEdge(source, target));

  dagre.layout(dagreGraph);

  const queueSet = new Set(step?.queue ?? []);
  const stackSet = new Set(step?.stack ?? []);
  const levelSet = new Set(step?.currentLevel ?? []);
  const visitedSet = new Set(step?.visited ?? []);

  const nodes: Node<TreeNodeFlowData>[] = treeNodes.map((node) => {
    const layout = dagreGraph.node(node.id) as { x: number; y: number } | undefined;
    const x = layout ? layout.x : 0;
    const y = layout ? layout.y : 0;
    const status = getNodeStatus(
      node.index,
      step?.currentNode ?? null,
      queueSet,
      stackSet,
      levelSet,
      visitedSet,
    );

    return {
      id: node.id,
      position: { x: x - NODE_SIZE / 2, y: y - NODE_SIZE / 2 },
      data: { value: node.value, index: node.index, status },
      type: "treeNode",
      draggable: false,
      selectable: false,
    } satisfies Node<TreeNodeFlowData>;
  });

  const edges: Edge[] = connections.map(({ source, target }) => ({
    id: `${source}-${target}`,
    source,
    target,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
    style: { stroke: EDGE_COLOR, strokeWidth: 2 },
  }));

  return { nodes, edges };
}

function getNodeStatus(
  index: number,
  current: number | null,
  queueSet: Set<number>,
  stackSet: Set<number>,
  levelSet: Set<number>,
  visitedSet: Set<number>,
): NodeStatus {
  if (current === index) return "current";
  if (queueSet.has(index)) return "queue";
  if (stackSet.has(index)) return "stack";
  if (levelSet.has(index)) return "level";
  if (visitedSet.has(index)) return "visited";
  return "default";
}

function parseLevelOrderInput(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: true, values: [] };
  }

  const segments = trimmed
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length > MAX_NODES) {
    return { ok: false, error: `节点数量过多，最多仅支持 ${MAX_NODES} 个。` };
  }

  const values: (number | null)[] = [];
  for (const segment of segments) {
    if (/^null$/i.test(segment)) {
      values.push(null);
      continue;
    }
    const value = Number(segment);
    if (Number.isNaN(value)) {
      return {
        ok: false,
        error: `无法解析 "${segment}"，请使用数字或 null。`,
      };
    }
    values.push(value);
  }

  return { ok: true, values };
}

function buildTreeData(values: (number | null)[]): BuildTreeResult {
  if (values.length === 0) {
    return { root: null, nodes: [] };
  }

  const [first] = values;
  if (first === null || first === undefined) {
    return { root: null, nodes: [] };
  }

  const createNode = (value: number, index: number): TreeNode => ({
    id: `node-${index}`,
    value,
    index,
    left: null,
    right: null,
  });

  const root = createNode(first, 0);
  const collected: TreeNode[] = [root];
  const queue: TreeNode[] = [root];
  let pointer = 1;

  while (queue.length > 0 && pointer < values.length) {
    const node = queue.shift()!;

    if (pointer < values.length) {
      const leftValue = values[pointer];
      if (leftValue !== null && leftValue !== undefined) {
        const leftNode = createNode(leftValue, pointer);
        node.left = leftNode;
        queue.push(leftNode);
        collected.push(leftNode);
      }
      pointer += 1;
    }

    if (pointer < values.length) {
      const rightValue = values[pointer];
      if (rightValue !== null && rightValue !== undefined) {
        const rightNode = createNode(rightValue, pointer);
        node.right = rightNode;
        queue.push(rightNode);
        collected.push(rightNode);
      }
      pointer += 1;
    }
  }

  return { root, nodes: collected };
}

function getTreeDepth(node: TreeNode | null): number {
  if (!node) return -1;
  return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

function cloneLevels(levels: number[][]): number[][] {
  return levels.map((arr) => [...arr]);
}

function cloneResult(result: number[][]): number[][] {
  return result.map((arr) => [...arr]);
}

function generateBfsSteps(root: TreeNode | null): LevelOrderStep[] {
  const steps: LevelOrderStep[] = [];
  let id = 1;
  const pushStep = (step: Omit<LevelOrderStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，层序遍历结果为空数组。",
      action: "complete",
      currentNode: null,
      level: 0,
      queue: [],
      stack: [],
      visited: [],
      currentLevel: [],
      resultSnapshot: [],
    });
    return steps;
  }

  type QueueItem = { node: TreeNode; level: number };
  const queue: QueueItem[] = [{ node: root, level: 0 }];
  const visited: number[] = [];
  const levelNodes = new Map<number, number[]>();
  const result: number[][] = [];

  pushStep({
    title: "初始化队列",
    description: "根节点入队，准备逐层处理。",
    action: "enqueue",
    currentNode: null,
    level: 0,
    queue: queue.map((item) => item.node.index),
    stack: [],
    visited: [],
    currentLevel: [],
    resultSnapshot: [],
  });

  while (queue.length > 0) {
    const { node, level } = queue.shift()!;

    pushStep({
      title: `出队节点 ${node.value}`,
      description: `处理 Level ${level} 的节点。`,
      action: "dequeue",
      currentNode: node.index,
      level,
      queue: queue.map((item) => item.node.index),
      stack: [],
      visited: [...visited],
      currentLevel: [...(levelNodes.get(level) ?? [])],
      resultSnapshot: cloneResult(result),
    });

    if (!result[level]) {
      result[level] = [];
      levelNodes.set(level, []);
    }
    result[level].push(node.value);
    levelNodes.get(level)!.push(node.index);
    visited.push(node.index);

    pushStep({
      title: `访问节点 ${node.value}`,
      description: `将值写入 Level ${level} 的结果数组。`,
      action: "visit",
      currentNode: node.index,
      level,
      queue: queue.map((item) => item.node.index),
      stack: [],
      visited: [...visited],
      currentLevel: [...(levelNodes.get(level) ?? [])],
      resultSnapshot: cloneResult(result),
    });

    const enqueued: number[] = [];
    if (node.left) {
      queue.push({ node: node.left, level: level + 1 });
      enqueued.push(node.left.index);
    }
    if (node.right) {
      queue.push({ node: node.right, level: level + 1 });
      enqueued.push(node.right.index);
    }

    if (enqueued.length > 0) {
      pushStep({
        title: "子节点入队",
        description: `将下一层的 ${enqueued.length} 个节点加入队列。`,
        action: "enqueue",
        currentNode: node.index,
        level,
        queue: queue.map((item) => item.node.index),
        stack: [],
        visited: [...visited],
        currentLevel: [...(levelNodes.get(level) ?? [])],
        resultSnapshot: cloneResult(result),
      });
    }
  }

  pushStep({
    title: "遍历完成",
    description: "队列为空，已完成所有层的访问。",
    action: "complete",
    currentNode: null,
    level: result.length - 1,
    queue: [],
    stack: [],
    visited: [...visited],
    currentLevel: [],
    resultSnapshot: cloneResult(result),
  });

  return steps;
}

function generateDfsSteps(root: TreeNode | null): LevelOrderStep[] {
  const steps: LevelOrderStep[] = [];
  let id = 1;
  const pushStep = (step: Omit<LevelOrderStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，层序遍历结果为空数组。",
      action: "complete",
      currentNode: null,
      level: 0,
      queue: [],
      stack: [],
      visited: [],
      currentLevel: [],
      resultSnapshot: [],
    });
    return steps;
  }

  const result: number[][] = [];
  const levelNodes = new Map<number, number[]>();
  const visited: number[] = [];
  const stack: TreeNode[] = [];

  const dfs = (node: TreeNode | null, level: number) => {
    if (!node) return;

    stack.push(node);
    pushStep({
      title: `递归进入 ${node.value}`,
      description: `准备填充 Level ${level}。`,
      action: "descend",
      currentNode: node.index,
      level,
      queue: [],
      stack: stack.map((n) => n.index),
      visited: [...visited],
      currentLevel: [...(levelNodes.get(level) ?? [])],
      resultSnapshot: cloneResult(result),
    });

    if (!result[level]) {
      result[level] = [];
      levelNodes.set(level, []);
    }
    result[level].push(node.value);
    levelNodes.get(level)!.push(node.index);
    visited.push(node.index);

    pushStep({
      title: `访问节点 ${node.value}`,
      description: `将值写入 Level ${level} 的数组。`,
      action: "visit",
      currentNode: node.index,
      level,
      queue: [],
      stack: stack.map((n) => n.index),
      visited: [...visited],
      currentLevel: [...(levelNodes.get(level) ?? [])],
      resultSnapshot: cloneResult(result),
    });

    dfs(node.left, level + 1);
    dfs(node.right, level + 1);

    stack.pop();
  };

  dfs(root, 0);

  pushStep({
    title: "遍历完成",
    description: "所有节点均已按层号记录。",
    action: "complete",
    currentNode: null,
    level: result.length - 1,
    queue: [],
    stack: [],
    visited: [...visited],
    currentLevel: [],
    resultSnapshot: cloneResult(result),
  });

  return steps;
}
