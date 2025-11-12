"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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

type TraversalMethod = "dfs" | "bfs";

interface TreeNode {
  id: string;
  value: number;
  index: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

type NodeStatus = "current" | "active" | "visited" | "default";

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
}

interface BuildTreeResult {
  root: TreeNode | null;
  nodes: TreeNode[];
}

interface DepthStep {
  id: number;
  title: string;
  description: string;
  action: string;
  depth: number;
  maxDepth: number;
  currentNode: number | null;
  stack: number[];
  queue: number[];
  visited: number[];
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
const MAX_NODES = 31;
const NODE_SIZE = 96;
const EDGE_COLOR = "rgba(234,179,8,0.85)";

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary",
  active: "bg-amber-500/20 border-amber-500/80 text-amber-800",
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
        <span className="text-[10px] text-muted-foreground/80 font-normal">
          #{index}
        </span>
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

export default function BinaryTreeMaxDepthAnimation() {
  const [method, setMethod] = useState<TraversalMethod>("dfs");
  const [levelOrderInput, setLevelOrderInput] = useState(DEFAULT_INPUT);
  const [treeValues, setTreeValues] = useState<(number | null)[]>([...DEFAULT_VALUES]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const treeData = useMemo(() => buildTreeData(treeValues), [treeValues]);

  const traversalSteps = useMemo(() => {
    return method === "bfs"
      ? generateBfsDepthSteps(treeData.root)
      : generateDfsDepthSteps(treeData.root);
  }, [method, treeData.root]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [method, treeData.root]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= traversalSteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, traversalSteps.length - 1));
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, traversalSteps.length]);

  const stepInfo = traversalSteps[currentStep] ?? traversalSteps[0];
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });

  const flowGraph = useMemo(() => buildFlowElements(treeData.root, stepInfo), [
    treeData.root,
    stepInfo,
  ]);

  const treeDepth = useMemo(() => getTreeDepth(treeData.root), [treeData.root]);
  const canvasHeight = Math.max(360, (treeDepth + 1) * 180);

  const progress =
    traversalSteps.length <= 1
      ? 1
      : currentStep / (traversalSteps.length - 1);

  const visitedValues = useMemo(() => {
    if (!treeData.root || !stepInfo) return [];
    return stepInfo.visited.map((idx) => findValueByIndex(treeData.nodes, idx));
  }, [treeData.nodes, treeData.root, stepInfo]);

  const auxiliaryLabel = method === "bfs" ? "队列" : "递归栈";
  const auxiliaryItems = method === "bfs" ? stepInfo.queue : stepInfo.stack;

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

  const handleNextStep = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, traversalSteps.length - 1));
  };

  const handleResetSteps = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handlePlayPause = () => {
    if (currentStep >= traversalSteps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const recentSteps = traversalSteps.slice(
    Math.max(0, currentStep - 2),
    currentStep + 1,
  );

  return (
    <div className="w-full min-h-[520px] rounded-xl bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">二叉树最大深度 - 可视化演示</h3>
        <p className="text-sm text-muted-foreground mt-1">
          选择 DFS 或 BFS，观察深度如何累计。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 mb-6">
        <form onSubmit={handleApplyInput} className="lg:col-span-3 space-y-2">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            层序遍历输入（最多 {MAX_NODES} 个节点，使用 null 表示空）
          </label>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={levelOrderInput}
              onChange={(event) => setLevelOrderInput(event.target.value)}
              placeholder="例如：3, 9, 20, null, null, 15, 7"
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                应用输入
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleUseExample}>
                使用示例
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleClearInput}>
                清空
              </Button>
            </div>
          </div>
          {inputError ? (
            <p className="text-xs text-red-500">{inputError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              示例表示根节点 3，左右子树分别是 9 与 20，20 的左右孩子为 15 和 7。
            </p>
          )}
        </form>

        <div className="lg:col-span-2 space-y-2">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            遍历方式
          </label>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant={method === "dfs" ? "default" : "outline"}
              onClick={() => setMethod("dfs")}
            >
              DFS 递归
            </Button>
            <Button
              type="button"
              size="sm"
              variant={method === "bfs" ? "default" : "outline"}
              onClick={() => setMethod("bfs")}
            >
              BFS 层序
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            DFS 沿根到叶的路径回溯累积，BFS 按层推进并统计层数。
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-xl">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>遍历进度</span>
            <span>
              步骤 {Math.min(currentStep + 1, traversalSteps.length)} / {traversalSteps.length}
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
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={handleResetSteps}>
            <RotateCcw className="h-4 w-4 mr-1" /> 重置
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleNextStep}>
            <StepForward className="h-4 w-4 mr-1" /> 单步
          </Button>
          <Button type="button" size="sm" onClick={handlePlayPause}>
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-1" /> 暂停
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" /> 播放
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            className="relative border border-border/60 bg-card/80 rounded-xl overflow-hidden"
            style={{ minHeight: canvasHeight, height: canvasHeight }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-emerald-500/5 to-amber-400/5" />

            <div className="absolute top-4 left-4 flex gap-2 flex-wrap z-10">
              {["当前节点", "辅助结构", "已确定"].map((label, idx) => (
                <span
                  key={label}
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${[
                    "bg-primary/20 border-primary text-primary",
                    "bg-amber-500/20 border-amber-500/80 text-amber-700",
                    "bg-emerald-500/20 border-emerald-500/80 text-emerald-700",
                  ][idx]}`}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="relative w-full h-full">
              {flowGraph.nodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  当前树为空，最大深度为 0。
                </div>
              ) : (
                <ReactFlow
                  nodesDraggable={false}
                  nodesConnectable={false}
                  edgesUpdatable={false}
                  panOnScroll
                  zoomOnScroll
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  style={{ width: "100%", height: "100%" }}
                  nodes={flowGraph.nodes}
                  edges={flowGraph.edges}
                  nodeTypes={nodeTypesRef.current}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={28}
                    size={1}
                    color="rgba(148,163,184,0.25)"
                  />
                  <Controls
                    className="bg-card/90 border border-border"
                    position="top-right"
                    showInteractive={false}
                  />
                </ReactFlow>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              当前步骤
            </p>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-semibold">{stepInfo?.title}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                深度 {stepInfo?.depth ?? 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stepInfo?.description}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">{auxiliaryLabel}</h4>
              <span className="text-xs text-muted-foreground">
                {method === "bfs" ? "队首在左" : "栈顶在右"}
              </span>
            </div>
            {auxiliaryItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">当前为空</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {auxiliaryItems.map((idx, key) => (
                  <div
                    key={`${idx}-${key}`}
                    className={`px-3 py-1 rounded-lg border text-sm ${
                      method === "bfs" ? "bg-amber-500/10" : "bg-primary/10"
                    }`}
                  >
                    节点 #{idx}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">累计最大深度</h4>
              <span className="text-base font-bold text-primary">{stepInfo?.maxDepth ?? 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              每次更新表示已找到的最深路径长度。
            </p>
            {visitedValues.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {visitedValues.map((value, idx) => (
                  <span
                    key={`${value}-${idx}`}
                    className="px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-sm text-emerald-700"
                  >
                    {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-3">步骤日志</h4>
        {recentSteps.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无步骤</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {recentSteps.map((step) => (
              <div key={step.id} className="border border-border rounded-lg p-3 bg-card">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">{step.title}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    depth {step.depth}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function parseLevelOrderInput(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, values: [] };
  }

  const segments = trimmed
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length > MAX_NODES) {
    return { ok: false, error: `节点数量过多，最多支持 ${MAX_NODES} 个。` };
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
        collected.push(leftNode);
        queue.push(leftNode);
      }
      pointer += 1;
    }

    if (pointer < values.length) {
      const rightValue = values[pointer];
      if (rightValue !== null && rightValue !== undefined) {
        const rightNode = createNode(rightValue, pointer);
        node.right = rightNode;
        collected.push(rightNode);
        queue.push(rightNode);
      }
      pointer += 1;
    }
  }

  return { root, nodes: collected };
}

function buildFlowElements(root: TreeNode | null, step: DepthStep): FlowGraphResult {
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

  const stackSet = new Set(step?.stack ?? []);
  const queueSet = new Set(step?.queue ?? []);
  const visitedSet = new Set(step?.visited ?? []);

  const nodes: Node<TreeNodeFlowData>[] = treeNodes.map((node) => {
    const layout = dagreGraph.node(node.id) as { x: number; y: number } | undefined;
    const x = layout ? layout.x : 0;
    const y = layout ? layout.y : 0;
    const status = getNodeStatus(
      node.index,
      step?.currentNode ?? null,
      stackSet,
      queueSet,
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
    animated: false,
  }));

  return { nodes, edges };
}

function getNodeStatus(
  index: number,
  current: number | null,
  stack: Set<number>,
  queue: Set<number>,
  visited: Set<number>,
): NodeStatus {
  if (current === index) return "current";
  if (stack.has(index) || queue.has(index)) return "active";
  if (visited.has(index)) return "visited";
  return "default";
}

function findValueByIndex(nodes: TreeNode[], index: number): number | string {
  const found = nodes.find((node) => node.index === index);
  return found ? found.value : "?";
}

function getTreeDepth(node: TreeNode | null): number {
  if (!node) return 0;
  return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

function generateDfsDepthSteps(root: TreeNode | null): DepthStep[] {
  const steps: DepthStep[] = [];
  let id = 1;

  const pushStep = (step: Omit<DepthStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，最大深度为 0。",
      action: "empty",
      depth: 0,
      maxDepth: 0,
      currentNode: null,
      stack: [],
      queue: [],
      visited: [],
    });
    return steps;
  }

  let globalMax = 0;
  const visited: number[] = [];

  const traverse = (node: TreeNode | null, path: number[]): number => {
    if (!node) return 0;

    const nextPath = [...path, node.index];
    pushStep({
      title: `深入节点 ${node.value}`,
      description: `当前路径长度 ${nextPath.length}，继续探索左子树。`,
      action: "descend",
      depth: nextPath.length,
      maxDepth: globalMax,
      currentNode: node.index,
      stack: nextPath,
      queue: [],
      visited: [...visited],
    });

    const leftDepth = traverse(node.left, nextPath);
    const rightDepth = traverse(node.right, nextPath);

    const currentDepth = Math.max(leftDepth, rightDepth) + 1;
    globalMax = Math.max(globalMax, currentDepth);
    visited.push(node.index);

    pushStep({
      title: `回溯节点 ${node.value}`,
      description: `左右子树最大深度为 ${currentDepth - 1}，当前深度更新为 ${currentDepth}。`,
      action: "evaluate",
      depth: currentDepth,
      maxDepth: globalMax,
      currentNode: node.index,
      stack: path,
      queue: [],
      visited: [...visited],
    });

    return currentDepth;
  };

  const finalDepth = traverse(root, []);

  pushStep({
    title: "遍历完成",
    description: `递归结束，最大深度为 ${finalDepth}。`,
    action: "complete",
    depth: finalDepth,
    maxDepth: finalDepth,
    currentNode: null,
    stack: [],
    queue: [],
    visited: [...visited],
  });

  return steps;
}

function generateBfsDepthSteps(root: TreeNode | null): DepthStep[] {
  const steps: DepthStep[] = [];
  let id = 1;

  const pushStep = (step: Omit<DepthStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，最大深度为 0。",
      action: "empty",
      depth: 0,
      maxDepth: 0,
      currentNode: null,
      stack: [],
      queue: [],
      visited: [],
    });
    return steps;
  }

  const queue: TreeNode[] = [root];
  let depth = 0;
  const visited: number[] = [];

  while (queue.length > 0) {
    const levelSize = queue.length;
    depth += 1;

    pushStep({
      title: `进入第 ${depth} 层`,
      description: `本层共有 ${levelSize} 个节点，处理完成后深度至少为 ${depth}。`,
      action: "level",
      depth,
      maxDepth: depth,
      currentNode: queue[0]?.index ?? null,
      stack: [],
      queue: queue.map((node) => node.index),
      visited: [...visited],
    });

    for (let i = 0; i < levelSize; i += 1) {
      const node = queue.shift()!;
      visited.push(node.index);

      pushStep({
        title: `处理节点 ${node.value}`,
        description: "将其子节点入队，等待下一层处理。",
        action: "process",
        depth,
        maxDepth: depth,
        currentNode: node.index,
        stack: [],
        queue: queue.map((item) => item.index),
        visited: [...visited],
      });

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);

      pushStep({
        title: `子节点入队`,
        description: `节点 ${node.value} 的孩子已加入队列。`,
        action: "queue",
        depth,
        maxDepth: depth,
        currentNode: node.index,
        stack: [],
        queue: queue.map((item) => item.index),
        visited: [...visited],
      });
    }
  }

  pushStep({
    title: "层序遍历完成",
    description: `所有节点按层访问完毕，最大深度为 ${depth}。`,
    action: "complete",
    depth,
    maxDepth: depth,
    currentNode: null,
    stack: [],
    queue: [],
    visited: [...visited],
  });

  return steps;
}
