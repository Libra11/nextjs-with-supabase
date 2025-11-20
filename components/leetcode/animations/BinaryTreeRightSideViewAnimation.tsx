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

type StepAction = "enqueue" | "dequeue" | "visit" | "descend" | "complete" | "found";

type NodeStatus = "current" | "queue" | "stack" | "level" | "visited" | "found" | "default";

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
}

interface BuildTreeResult {
  root: TreeNode | null;
  nodes: TreeNode[];
}

interface RightSideViewStep {
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
  resultSnapshot: number[]; // The right side view result so far
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

const DEFAULT_INPUT = "1,2,3,null,5,null,4";
const DEFAULT_VALUES: (number | null)[] = [1, 2, 3, null, 5, null, 4];
const MAX_NODES = 31;
const NODE_SIZE = 60;
const EDGE_COLOR = "rgba(59,130,246,0.7)";

const methodDescriptions: Record<TraversalMethod, string> = {
  bfs: "BFS 层序遍历：每层遍历时，取该层的最后一个节点加入结果。",
  dfs: "DFS (根-右-左)：优先访问右子树，记录每一层首次访问的节点。",
};

const actionLabels: Record<StepAction, string> = {
  enqueue: "入队",
  dequeue: "出队",
  visit: "访问",
  descend: "递归",
  complete: "完成",
  found: "记录结果",
};

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary",
  queue: "bg-purple-500/20 border-purple-500/70 text-purple-700",
  stack: "bg-amber-500/20 border-amber-500/80 text-amber-800",
  level: "bg-sky-500/20 border-sky-500 text-sky-700",
  visited: "bg-emerald-500/20 border-emerald-500/80 text-emerald-700",
  found: "bg-red-500/20 border-red-500 text-red-700 font-bold ring-2 ring-red-500/50",
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
        className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-semibold text-sm shadow-lg transition-colors duration-300 ${statusClass}`}
      >
        <span>{value}</span>
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

export default function BinaryTreeRightSideViewAnimation() {
  const [method, setMethod] = useState<TraversalMethod>("bfs");
  const [levelOrderInput, setLevelOrderInput] = useState(DEFAULT_INPUT);
  const [treeValues, setTreeValues] = useState<(number | null)[]>([...DEFAULT_VALUES]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const treeData = useMemo(() => buildTreeData(treeValues), [treeValues]);
  
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
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps.length]);

  const stepInfo = steps[currentStep] ?? steps[0];
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const flowGraph = useMemo(() => buildFlowElements(treeData.root, stepInfo), [treeData.root, stepInfo]);

  const treeDepth = useMemo(() => getTreeDepth(treeData.root), [treeData.root]);
  const canvasHeight = Math.max(360, (treeDepth + 1) * 100);
  const progress = steps.length <= 1 ? 1 : currentStep / (steps.length - 1);

  const structureLabel = method === "bfs" ? "队列" : "递归栈";
  const structureItems = method === "bfs" ? stepInfo?.queue ?? [] : stepInfo?.stack ?? [];
  const resultList = stepInfo?.resultSnapshot ?? [];

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

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/80 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">二叉树的右视图动画</h3>
            <p className="text-sm text-muted-foreground">
              从右侧观察二叉树，每一层只能看到最右边的节点。
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={method === "bfs" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("bfs")}
            >
              BFS 层序遍历
            </Button>
            <Button
              variant={method === "dfs" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("dfs")}
            >
              DFS (右优先)
            </Button>
          </div>
        </div>

        <form onSubmit={handleApplyInput} className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              value={levelOrderInput}
              onChange={(event) => setLevelOrderInput(event.target.value)}
              placeholder="例如：1,2,3,null,5,null,4"
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
                    #{idx}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">右视图结果</h4>
              <span className="text-xs text-muted-foreground">{resultList.length} 个节点</span>
            </div>
            {resultList.length === 0 ? (
              <p className="text-xs text-muted-foreground">结果为空。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {resultList.map((val, idx) => (
                  <div key={`${val}-${idx}`} className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 border border-red-500 text-red-700 font-bold text-sm">
                    {val}
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

function buildFlowElements(root: TreeNode | null, step?: RightSideViewStep): FlowGraphResult {
  if (!root) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 50,
    ranksep: 50,
    marginx: 20,
    marginy: 20,
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
  const visitedSet = new Set(step?.visited ?? []);
  const resultSet = new Set(step?.resultSnapshot ?? []); // This stores values, not indices, so be careful.
  // Actually we need to know which nodes are in the result to highlight them.
  // But resultSnapshot stores values.
  // Let's use a different approach. We can check if the node's value is in resultSnapshot, but values might be duplicate.
  // Better to track indices in result.
  // For simplicity in this visualization, let's assume values are unique or just highlight based on visited status + logic.
  // Actually, let's modify the step to include resultIndices.
  
  // Re-evaluating: `resultSnapshot` contains values.
  // Let's add `resultIndices` to `RightSideViewStep`.
  // But for now, let's just use `visitedSet` and `currentNode`.
  // Wait, I can't easily know which nodes are "found" just from values if duplicates exist.
  // I will add `resultIndices` to the step interface in the next iteration if needed, 
  // but for now let's just highlight `found` nodes if we can track them.
  
  // Let's try to deduce "found" status.
  // In BFS, the last node of each level is found.
  // In DFS, the first node of each depth is found.
  
  // Let's pass `foundIndices` in the step.
  
  const nodes: Node<TreeNodeFlowData>[] = treeNodes.map((node) => {
    const layout = dagreGraph.node(node.id) as { x: number; y: number } | undefined;
    const x = layout ? layout.x : 0;
    const y = layout ? layout.y : 0;
    
    // Determine status
    let status: NodeStatus = "default";
    
    // We need a way to know if this node is in the result set.
    // Since I didn't add resultIndices to the interface yet, let's do it in the generator functions
    // and pass it via a new property or just use a set passed to this function.
    // I'll update the interface below.
    
    // For now, let's use a hack or just update the interface.
    // I'll update the interface in the file content I'm writing.
    
    return {
      id: node.id,
      position: { x: x - NODE_SIZE / 2, y: y - NODE_SIZE / 2 },
      data: { value: node.value, index: node.index, status: "default" }, // Placeholder, will be updated
      type: "treeNode",
      draggable: false,
      selectable: false,
    } satisfies Node<TreeNodeFlowData>;
  });

  // Update status with correct logic
  // I need to pass resultIndices to this function.
  // Let's assume step has `resultIndices`.
  const resultIndices = new Set((step as any)?.resultIndices ?? []);

  nodes.forEach(node => {
      if (node.data.index === step?.currentNode) node.data.status = "current";
      else if (resultIndices.has(node.data.index)) node.data.status = "found";
      else if (queueSet.has(node.data.index)) node.data.status = "queue";
      else if (stackSet.has(node.data.index)) node.data.status = "stack";
      else if (visitedSet.has(node.data.index)) node.data.status = "visited";
      else node.data.status = "default";
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
  visitedSet: Set<number>,
  foundSet: Set<number>
): NodeStatus {
  if (current === index) return "current";
  if (foundSet.has(index)) return "found";
  if (queueSet.has(index)) return "queue";
  if (stackSet.has(index)) return "stack";
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

function generateBfsSteps(root: TreeNode | null): (RightSideViewStep & { resultIndices: number[] })[] {
  const steps: (RightSideViewStep & { resultIndices: number[] })[] = [];
  let id = 1;
  const pushStep = (step: Omit<RightSideViewStep, "id"> & { resultIndices: number[] }) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，右视图为空。",
      action: "complete",
      currentNode: null,
      level: 0,
      queue: [],
      stack: [],
      visited: [],
      currentLevel: [],
      resultSnapshot: [],
      resultIndices: [],
    });
    return steps;
  }

  type QueueItem = { node: TreeNode; level: number };
  const queue: QueueItem[] = [{ node: root, level: 0 }];
  const visited: number[] = [];
  const result: number[] = [];
  const resultIndices: number[] = [];

  pushStep({
    title: "初始化队列",
    description: "根节点入队。",
    action: "enqueue",
    currentNode: null,
    level: 0,
    queue: queue.map((item) => item.node.index),
    stack: [],
    visited: [],
    currentLevel: [],
    resultSnapshot: [],
    resultIndices: [],
  });

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevelIndices = queue.map(item => item.node.index);
    
    pushStep({
        title: "开始新一层",
        description: `当前层有 ${levelSize} 个节点: [${queue.map(q => q.node.value).join(", ")}]。`,
        action: "visit",
        currentNode: null,
        level: queue[0].level,
        queue: currentLevelIndices,
        stack: [],
        visited: [...visited],
        currentLevel: currentLevelIndices,
        resultSnapshot: [...result],
        resultIndices: [...resultIndices],
    });

    for (let i = 0; i < levelSize; i++) {
        const { node, level } = queue.shift()!;
        visited.push(node.index);
        
        const isLast = i === levelSize - 1;
        
        pushStep({
            title: `访问 ${node.value}`,
            description: isLast 
                ? `节点 ${node.value} 是本层最后一个，**加入右视图结果**。`
                : `节点 ${node.value} 不是本层最后一个，跳过。`,
            action: isLast ? "found" : "visit",
            currentNode: node.index,
            level,
            queue: queue.map((item) => item.node.index),
            stack: [],
            visited: [...visited],
            currentLevel: currentLevelIndices,
            resultSnapshot: isLast ? [...result, node.value] : [...result],
            resultIndices: isLast ? [...resultIndices, node.index] : [...resultIndices],
        });

        if (isLast) {
            result.push(node.value);
            resultIndices.push(node.index);
        }

        if (node.left) queue.push({ node: node.left, level: level + 1 });
        if (node.right) queue.push({ node: node.right, level: level + 1 });
    }
  }

  pushStep({
    title: "遍历完成",
    description: "所有层处理完毕。",
    action: "complete",
    currentNode: null,
    level: -1,
    queue: [],
    stack: [],
    visited: [...visited],
    currentLevel: [],
    resultSnapshot: [...result],
    resultIndices: [...resultIndices],
  });

  return steps;
}

function generateDfsSteps(root: TreeNode | null): (RightSideViewStep & { resultIndices: number[] })[] {
  const steps: (RightSideViewStep & { resultIndices: number[] })[] = [];
  let id = 1;
  const pushStep = (step: Omit<RightSideViewStep, "id"> & { resultIndices: number[] }) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空。",
      action: "complete",
      currentNode: null,
      level: 0,
      queue: [],
      stack: [],
      visited: [],
      currentLevel: [],
      resultSnapshot: [],
      resultIndices: [],
    });
    return steps;
  }

  const visited: number[] = [];
  const result: number[] = [];
  const resultIndices: number[] = [];
  const stack: TreeNode[] = [];

  pushStep({
    title: "开始递归",
    description: "从根节点开始，优先向右子树递归。",
    action: "descend",
    currentNode: root.index,
    level: 0,
    queue: [],
    stack: [],
    visited: [],
    currentLevel: [],
    resultSnapshot: [],
    resultIndices: [],
  });

  const dfs = (node: TreeNode, depth: number) => {
      stack.push(node);
      visited.push(node.index);
      
      const isFirstAtDepth = depth === result.length;
      
      pushStep({
        title: `访问 ${node.value} (Depth ${depth})`,
        description: isFirstAtDepth
            ? `深度 ${depth} 首次访问，**加入右视图结果**。`
            : `深度 ${depth} 已有节点 ${result[depth]}，跳过。`,
        action: isFirstAtDepth ? "found" : "visit",
        currentNode: node.index,
        level: depth,
        queue: [],
        stack: stack.map(n => n.index),
        visited: [...visited],
        currentLevel: [],
        resultSnapshot: isFirstAtDepth ? [...result, node.value] : [...result],
        resultIndices: isFirstAtDepth ? [...resultIndices, node.index] : [...resultIndices],
      });

      if (isFirstAtDepth) {
          result.push(node.value);
          resultIndices.push(node.index);
      }

      if (node.right) {
          pushStep({
            title: "向右递归",
            description: `准备访问 ${node.value} 的右子节点 ${node.right.value}。`,
            action: "descend",
            currentNode: node.right.index,
            level: depth + 1,
            queue: [],
            stack: stack.map(n => n.index),
            visited: [...visited],
            currentLevel: [],
            resultSnapshot: [...result],
            resultIndices: [...resultIndices],
          });
          dfs(node.right, depth + 1);
      }

      if (node.left) {
          pushStep({
            title: "向左递归",
            description: `准备访问 ${node.value} 的左子节点 ${node.left.value}。`,
            action: "descend",
            currentNode: node.left.index,
            level: depth + 1,
            queue: [],
            stack: stack.map(n => n.index),
            visited: [...visited],
            currentLevel: [],
            resultSnapshot: [...result],
            resultIndices: [...resultIndices],
          });
          dfs(node.left, depth + 1);
      }
      
      stack.pop();
  };

  dfs(root, 0);

  pushStep({
    title: "递归结束",
    description: "所有节点遍历完毕。",
    action: "complete",
    currentNode: null,
    level: -1,
    queue: [],
    stack: [],
    visited: [...visited],
    currentLevel: [],
    resultSnapshot: [...result],
    resultIndices: [...resultIndices],
  });

  return steps;
}
