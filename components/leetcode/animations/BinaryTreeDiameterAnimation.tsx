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

interface TreeNode {
  id: string;
  value: number;
  index: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

type StepAction = "descend" | "compute" | "update" | "complete";

type NodeStatus = "current" | "stack" | "candidate" | "best" | "default";

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
}

interface BuildTreeResult {
  root: TreeNode | null;
  nodes: TreeNode[];
}

interface DiameterStep {
  id: number;
  title: string;
  description: string;
  action: StepAction;
  currentNode: number | null;
  stack: number[];
  leftDepth: number;
  rightDepth: number;
  depthResult: number;
  candidateDiameter: number;
  bestDiameter: number;
  candidatePath: number[];
  bestPath: number[];
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

interface DepthInfo {
  depth: number;
  pathDown: number[];
}

const DEFAULT_INPUT = "1,2,3,4,5";
const DEFAULT_VALUES: (number | null)[] = [1, 2, 3, 4, 5];
const MAX_NODES = 31;
const NODE_SIZE = 96;
const EDGE_COLOR = "rgba(59,130,246,0.7)";

const actionLabels: Record<StepAction, string> = {
  descend: "递归",
  compute: "计算",
  update: "更新",
  complete: "完成",
};

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary",
  stack: "bg-amber-500/20 border-amber-500/80 text-amber-800",
  candidate: "bg-sky-500/20 border-sky-500 text-sky-700",
  best: "bg-emerald-500/25 border-emerald-500 text-emerald-700",
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

export default function BinaryTreeDiameterAnimation() {
  const [levelOrderInput, setLevelOrderInput] = useState(DEFAULT_INPUT);
  const [treeValues, setTreeValues] = useState<(number | null)[]>([...DEFAULT_VALUES]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const treeData = useMemo(() => buildTreeData(treeValues), [treeValues]);

  const diameterSteps = useMemo(() => generateDiameterSteps(treeData.root), [treeData.root]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [treeData.root]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= diameterSteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, diameterSteps.length - 1));
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, diameterSteps.length]);

  const stepInfo = diameterSteps[currentStep] ?? diameterSteps[0];
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const flowGraph = useMemo(() => buildFlowElements(treeData.root, stepInfo), [treeData.root, stepInfo]);

  const treeDepth = useMemo(() => getTreeDepth(treeData.root), [treeData.root]);
  const canvasHeight = Math.max(360, (treeDepth + 1) * 180);
  const progress = diameterSteps.length <= 1 ? 1 : currentStep / (diameterSteps.length - 1);

  const bestPathNodes = useMemo(() => stepInfo?.bestPath ?? [], [stepInfo?.bestPath]);
  const candidateNodes = useMemo(() => stepInfo?.candidatePath ?? [], [stepInfo?.candidatePath]);

  const recentSteps = useMemo(() => {
    const start = Math.max(0, currentStep - 2);
    return diameterSteps.slice(start, currentStep + 1);
  }, [currentStep, diameterSteps]);

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
    setCurrentStep((prev) => Math.min(prev + 1, diameterSteps.length - 1));
  };

  const nodeTypes = nodeTypesRef.current;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/80 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">二叉树直径动画</h3>
            <p className="text-sm text-muted-foreground">
              利用 DFS 统计每个节点的左右深度，展示实时的最长路径（直径）更新过程。
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> 重置
            </Button>
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
          </div>
        </div>

        <form onSubmit={handleApplyInput} className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              value={levelOrderInput}
              onChange={(event) => setLevelOrderInput(event.target.value)}
              placeholder="例如：1,2,3,4,5"
            />
            {inputError ? (
              <p className="mt-1 text-xs text-destructive">{inputError}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                输入层序遍历，使用 null 表示缺失节点，最多 {MAX_NODES} 个元素。
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
                  提供非空树即可查看动画。
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
                  Step {currentStep + 1} / {diameterSteps.length}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(4, progress * 100)}%` }}
                />
              </div>
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
            <div className="mt-3 grid gap-3 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>左子树深度</span>
                <span className="font-semibold">{stepInfo?.leftDepth ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>右子树深度</span>
                <span className="font-semibold">{stepInfo?.rightDepth ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>当前路径长度</span>
                <span className="font-semibold">{stepInfo?.candidateDiameter ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>全局直径</span>
                <span className="font-semibold text-primary">{stepInfo?.bestDiameter ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">最佳路径节点</h4>
              <span className="text-xs text-muted-foreground">{bestPathNodes.length} 个</span>
            </div>
            {bestPathNodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">尚未形成完整的直径。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bestPathNodes.map((idx) => (
                  <div key={idx} className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700">
                    #{idx}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">当前候选路径</h4>
              <span className="text-xs text-muted-foreground">{candidateNodes.length} 个</span>
            </div>
            {candidateNodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂无候选。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {candidateNodes.map((idx) => (
                  <div key={idx} className="rounded-full border border-sky-500/50 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-700">
                    #{idx}
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

function buildFlowElements(root: TreeNode | null, step?: DiameterStep): FlowGraphResult {
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
  const candidateSet = new Set(step?.candidatePath ?? []);
  const bestSet = new Set(step?.bestPath ?? []);

  const nodes: Node<TreeNodeFlowData>[] = treeNodes.map((node) => {
    const layout = dagreGraph.node(node.id) as { x: number; y: number } | undefined;
    const x = layout ? layout.x : 0;
    const y = layout ? layout.y : 0;
    const status = getNodeStatus(
      node.index,
      step?.currentNode ?? null,
      stackSet,
      candidateSet,
      bestSet,
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
  stack: Set<number>,
  candidate: Set<number>,
  best: Set<number>,
): NodeStatus {
  if (best.has(index)) return "best";
  if (candidate.has(index)) return "candidate";
  if (current === index) return "current";
  if (stack.has(index)) return "stack";
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

function generateDiameterSteps(root: TreeNode | null): DiameterStep[] {
  const steps: DiameterStep[] = [];
  let id = 1;
  let bestDiameter = 0;
  let bestPath: number[] = [];
  const stack: TreeNode[] = [];

  const pushStep = (step: Omit<DiameterStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，直径为 0。",
      action: "complete",
      currentNode: null,
      stack: [],
      leftDepth: 0,
      rightDepth: 0,
      depthResult: 0,
      candidateDiameter: 0,
      bestDiameter: 0,
      candidatePath: [],
      bestPath: [],
    });
    return steps;
  }

  const dfs = (node: TreeNode | null): DepthInfo => {
    if (!node) {
      return { depth: 0, pathDown: [] };
    }

    stack.push(node);
    pushStep({
      title: `进入节点 ${node.value}`,
      description: "递归向下，收集左右子树深度。",
      action: "descend",
      currentNode: node.index,
      stack: stack.map((n) => n.index),
      leftDepth: 0,
      rightDepth: 0,
      depthResult: 0,
      candidateDiameter: 0,
      bestDiameter,
      candidatePath: [],
      bestPath: [...bestPath],
    });

    const leftInfo = dfs(node.left);
    const rightInfo = dfs(node.right);

    const leftDepth = leftInfo.depth;
    const rightDepth = rightInfo.depth;
    const depthResult = Math.max(leftDepth, rightDepth) + 1;
    const candidateDiameter = leftDepth + rightDepth;
    const candidatePath = buildCandidatePath(node, leftInfo.pathDown, rightInfo.pathDown);

    pushStep({
      title: `计算节点 ${node.value}`,
      description: `左深度 ${leftDepth}，右深度 ${rightDepth}，当前路径 ${candidateDiameter}。`,
      action: "compute",
      currentNode: node.index,
      stack: stack.map((n) => n.index),
      leftDepth,
      rightDepth,
      depthResult,
      candidateDiameter,
      bestDiameter,
      candidatePath,
      bestPath: [...bestPath],
    });

    if (
      candidateDiameter > bestDiameter ||
      (candidateDiameter === bestDiameter && candidatePath.length > bestPath.length)
    ) {
      bestDiameter = candidateDiameter;
      bestPath = [...candidatePath];
      pushStep({
        title: `更新直径 = ${candidateDiameter}`,
        description: "当前路径成为新的最长路径。",
        action: "update",
        currentNode: node.index,
        stack: stack.map((n) => n.index),
        leftDepth,
        rightDepth,
        depthResult,
        candidateDiameter,
        bestDiameter,
        candidatePath,
        bestPath: [...bestPath],
      });
    }

    stack.pop();

    const downPath = [node.index];
    if (leftDepth >= rightDepth && leftInfo.pathDown.length > 0) {
      downPath.push(...leftInfo.pathDown);
    } else if (rightInfo.pathDown.length > 0) {
      downPath.push(...rightInfo.pathDown);
    }

    return { depth: depthResult, pathDown: downPath };
  };

  const rootInfo = dfs(root);

  pushStep({
    title: "遍历结束",
    description: `最终直径为 ${bestDiameter}，路径长度即左右深度和。`,
    action: "complete",
    currentNode: null,
    stack: [],
    leftDepth: 0,
    rightDepth: 0,
    depthResult: rootInfo.depth,
    candidateDiameter: 0,
    bestDiameter,
    candidatePath: [],
    bestPath,
  });

  return steps;
}

function buildCandidatePath(
  node: TreeNode,
  leftPath: number[],
  rightPath: number[],
): number[] {
  const leftSegment = leftPath.length > 0 ? [...leftPath].reverse() : [];
  const combined: number[] = [];
  if (leftSegment.length > 0) {
    combined.push(...leftSegment);
  }
  combined.push(node.index);
  if (rightPath.length > 0) {
    combined.push(...rightPath);
  }

  return combined;
}
