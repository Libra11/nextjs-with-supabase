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

type TraversalMethod = "recursive" | "iterative";

interface TreeNode {
  id: string;
  value: number;
  index: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

type StepAction = "compare" | "mirror" | "enqueue" | "dequeue" | "complete" | "fail";

type NodeStatus = "current" | "stack" | "queue" | "matched" | "mismatched" | "default";

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
}

interface BuildTreeResult {
  root: TreeNode | null;
  nodes: TreeNode[];
}

type PairIndices = [number | null, number | null];

interface MirrorStep {
  id: number;
  title: string;
  description: string;
  action: StepAction;
  currentPair: PairIndices;
  stackPairs: PairIndices[];
  queuePairs: PairIndices[];
  matched: number[];
  mismatched: number[];
  status: "pending" | "symmetric" | "not-symmetric";
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

const DEFAULT_INPUT = "1,2,2,3,4,4,3";
const DEFAULT_VALUES: (number | null)[] = [1, 2, 2, 3, 4, 4, 3];
const MAX_NODES = 31;
const NODE_SIZE = 96;
const EDGE_COLOR = "rgba(59,130,246,0.7)";

const methodDescriptions: Record<TraversalMethod, string> = {
  recursive:
    "递归同步比较左、右子树：先判断当前节点对，再分别比较外侧与内侧子树，利用系统栈天然回溯。",
  iterative:
    "使用队列维护镜像节点对：不断出队比较，再将对应的子节点成对入队，直到队列为空或发现冲突。",
};

const actionLabels: Record<StepAction, string> = {
  compare: "比较",
  mirror: "镜像",
  enqueue: "入队",
  dequeue: "出队",
  complete: "完成",
  fail: "终止",
};

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary",
  stack: "bg-amber-500/20 border-amber-500/80 text-amber-800",
  queue: "bg-purple-500/20 border-purple-500/70 text-purple-700",
  matched: "bg-emerald-500/20 border-emerald-500/80 text-emerald-700",
  mismatched: "bg-destructive/15 border-destructive text-destructive",
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

export default function SymmetricTreeAnimation() {
  const [method, setMethod] = useState<TraversalMethod>("recursive");
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

  const symmetrySteps = useMemo(() => {
    return method === "iterative"
      ? generateIterativeSteps(treeData.root)
      : generateRecursiveSteps(treeData.root);
  }, [method, treeData.root]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [method, treeData.root]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= symmetrySteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, symmetrySteps.length - 1));
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, symmetrySteps.length]);

  const stepInfo = symmetrySteps[currentStep] ?? symmetrySteps[0];
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const flowGraph = useMemo(() => buildFlowElements(treeData.root, stepInfo), [treeData.root, stepInfo]);

  const treeDepth = useMemo(() => getTreeDepth(treeData.root), [treeData.root]);
  const canvasHeight = Math.max(360, (treeDepth + 1) * 180);
  const progress = symmetrySteps.length <= 1 ? 1 : currentStep / (symmetrySteps.length - 1);

  const structureLabel = method === "recursive" ? "递归栈（镜像对）" : "队列（镜像对）";
  const structureItems = method === "recursive" ? stepInfo?.stackPairs ?? [] : stepInfo?.queuePairs ?? [];

  const matchedNodes = useMemo(() => {
    return (stepInfo?.matched ?? []).map((idx) => ({
      index: idx,
      value: valueLookup.get(idx) ?? null,
    }));
  }, [stepInfo?.matched, valueLookup]);

  const mismatchedNodes = useMemo(() => {
    return (stepInfo?.mismatched ?? []).map((idx) => ({
      index: idx,
      value: valueLookup.get(idx) ?? null,
    }));
  }, [stepInfo?.mismatched, valueLookup]);

  const recentSteps = useMemo(() => {
    const start = Math.max(0, currentStep - 2);
    return symmetrySteps.slice(start, currentStep + 1);
  }, [currentStep, symmetrySteps]);

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
    setCurrentStep((prev) => Math.min(prev + 1, symmetrySteps.length - 1));
  };

  const nodeTypes = nodeTypesRef.current;

  const formatStructurePair = (pair: PairIndices) => {
    const formatSide = (idx: number | null) => {
      if (idx === null) return "null";
      const value = valueLookup.get(idx);
      return value === undefined ? `#${idx}` : `#${idx}(${value})`;
    };
    return `${formatSide(pair[0])} ⇔ ${formatSide(pair[1])}`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/80 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">对称二叉树验证动画</h3>
            <p className="text-sm text-muted-foreground">
              输入层序遍历构建二叉树，使用递归 DFS 与迭代 BFS 两种方式展示镜像校验的过程。
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={method === "recursive" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("recursive")}
            >
              递归 DFS
            </Button>
            <Button
              variant={method === "iterative" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("iterative")}
            >
              迭代 BFS
            </Button>
          </div>
        </div>

        <form onSubmit={handleApplyInput} className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              value={levelOrderInput}
              onChange={(event) => setLevelOrderInput(event.target.value)}
              placeholder="例如：1,2,2,3,4,4,3"
            />
            {inputError ? (
              <p className="mt-1 text-xs text-destructive">{inputError}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                逗号或空格分隔，使用 null 表示缺失节点，最多 {MAX_NODES} 个节点。
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
                  提供非空树即可查看可视化。
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
                  Step {currentStep + 1} / {symmetrySteps.length}
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
              {stepInfo?.description ?? "请输入合法的层序序列以开始动画。"}
            </p>
            <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground">
              {methodDescriptions[method]}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">{structureLabel}</h4>
              <span className="text-xs text-muted-foreground">{structureItems.length} 对</span>
            </div>
            {structureItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">结构为空。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {structureItems.map((pair, index) => (
                  <div key={`${pair[0]}-${pair[1]}-${index}`} className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                    {formatStructurePair(pair)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">已匹配节点</h4>
              <span className="text-xs text-muted-foreground">{matchedNodes.length}</span>
            </div>
            {matchedNodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">尚未确认任何镜像节点。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {matchedNodes.map(({ index, value }) => (
                  <div key={index} className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700">
                    #{index} · {value ?? "null"}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">冲突节点</h4>
              <span className="text-xs text-muted-foreground">{mismatchedNodes.length}</span>
            </div>
            {mismatchedNodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂无冲突。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mismatchedNodes.map(({ index, value }) => (
                  <div key={index} className="rounded-full border border-destructive/60 bg-destructive/10 px-2.5 py-1 text-xs text-destructive">
                    #{index} · {value ?? "null"}
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

function buildFlowElements(root: TreeNode | null, step?: MirrorStep): FlowGraphResult {
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

  const currentSet = new Set<number>();
  (step?.currentPair ?? []).forEach((idx) => {
    if (typeof idx === "number") currentSet.add(idx);
  });

  const stackSet = new Set<number>();
  (step?.stackPairs ?? []).forEach(([left, right]) => {
    if (typeof left === "number") stackSet.add(left);
    if (typeof right === "number") stackSet.add(right);
  });

  const queueSet = new Set<number>();
  (step?.queuePairs ?? []).forEach(([left, right]) => {
    if (typeof left === "number") queueSet.add(left);
    if (typeof right === "number") queueSet.add(right);
  });

  const matchedSet = new Set(step?.matched ?? []);
  const mismatchedSet = new Set(step?.mismatched ?? []);

  const nodes: Node<TreeNodeFlowData>[] = treeNodes.map((node) => {
    const layout = dagreGraph.node(node.id) as { x: number; y: number } | undefined;
    const x = layout ? layout.x : 0;
    const y = layout ? layout.y : 0;
    const status = getNodeStatus(
      node.index,
      currentSet,
      stackSet,
      queueSet,
      matchedSet,
      mismatchedSet,
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
  current: Set<number>,
  stack: Set<number>,
  queue: Set<number>,
  matched: Set<number>,
  mismatched: Set<number>,
): NodeStatus {
  if (mismatched.has(index)) return "mismatched";
  if (current.has(index)) return "current";
  if (matched.has(index)) return "matched";
  if (stack.has(index)) return "stack";
  if (queue.has(index)) return "queue";
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

function pairIndices(left: TreeNode | null, right: TreeNode | null): PairIndices {
  return [left ? left.index : null, right ? right.index : null];
}

function snapshotPairs(pairs: Array<{ left: TreeNode | null; right: TreeNode | null }>): PairIndices[] {
  return pairs.map(({ left, right }) => pairIndices(left, right));
}

function generateRecursiveSteps(root: TreeNode | null): MirrorStep[] {
  const steps: MirrorStep[] = [];
  let id = 1;
  const matched = new Set<number>();
  const mismatched = new Set<number>();

  const pushStep = (step: Omit<MirrorStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，自然视为对称。",
      action: "complete",
      currentPair: [null, null],
      stackPairs: [],
      queuePairs: [],
      matched: [],
      mismatched: [],
      status: "symmetric",
    });
    return steps;
  }

  const stack: Array<{ left: TreeNode | null; right: TreeNode | null }> = [];

  const dfs = (left: TreeNode | null, right: TreeNode | null): boolean => {
    stack.push({ left, right });
    pushStep({
      title: `比较 ${formatValue(left)} 与 ${formatValue(right)}`,
      description: "先判断当前节点对是否镜像。",
      action: "compare",
      currentPair: pairIndices(left, right),
      stackPairs: snapshotPairs(stack),
      queuePairs: [],
      matched: Array.from(matched),
      mismatched: Array.from(mismatched),
      status: "pending",
    });

    if (!left && !right) {
      pushStep({
        title: "空节点匹配",
        description: "这一对都是 null，符合镜像条件。",
        action: "mirror",
        currentPair: [null, null],
        stackPairs: snapshotPairs(stack),
        queuePairs: [],
        matched: Array.from(matched),
        mismatched: Array.from(mismatched),
        status: "pending",
      });
      stack.pop();
      return true;
    }

    if (!left || !right) {
      if (left) mismatched.add(left.index);
      if (right) mismatched.add(right.index);
      pushStep({
        title: "结构不对称",
        description: "只有一侧存在节点，镜像立即失败。",
        action: "fail",
        currentPair: pairIndices(left, right),
        stackPairs: snapshotPairs(stack),
        queuePairs: [],
        matched: Array.from(matched),
        mismatched: Array.from(mismatched),
        status: "not-symmetric",
      });
      stack.pop();
      return false;
    }

    if (left.value !== right.value) {
      mismatched.add(left.index);
      mismatched.add(right.index);
      pushStep({
        title: "节点值不相等",
        description: `值 ${left.value} 与 ${right.value} 不一致，破坏对称。`,
        action: "fail",
        currentPair: pairIndices(left, right),
        stackPairs: snapshotPairs(stack),
        queuePairs: [],
        matched: Array.from(matched),
        mismatched: Array.from(mismatched),
        status: "not-symmetric",
      });
      stack.pop();
      return false;
    }

    pushStep({
      title: "值匹配，深入子树",
      description: "继续比较外层 (L.left vs R.right) 与内层 (L.right vs R.left)。",
      action: "mirror",
      currentPair: pairIndices(left, right),
      stackPairs: snapshotPairs(stack),
      queuePairs: [],
      matched: Array.from(matched),
      mismatched: Array.from(mismatched),
      status: "pending",
    });

    const outer = dfs(left.left, right.right);
    if (!outer) {
      stack.pop();
      return false;
    }
    const inner = dfs(left.right, right.left);
    if (!inner) {
      stack.pop();
      return false;
    }

    matched.add(left.index);
    matched.add(right.index);
    pushStep({
      title: "当前节点镜像成立",
      description: `节点 ${left.value} 与 ${right.value} 的左右子树均镜像对称。`,
      action: "mirror",
      currentPair: pairIndices(left, right),
      stackPairs: snapshotPairs(stack),
      queuePairs: [],
      matched: Array.from(matched),
      mismatched: Array.from(mismatched),
      status: "pending",
    });

    stack.pop();
    return true;
  };

  const isSymmetric = dfs(root.left, root.right);

  pushStep({
    title: isSymmetric ? "树是轴对称" : "树不对称",
    description: isSymmetric
      ? "所有镜像节点对均匹配，验证完成。"
      : "存在无法匹配的节点对，镜像失败。",
    action: isSymmetric ? "complete" : "fail",
    currentPair: [null, null],
    stackPairs: [],
    queuePairs: [],
    matched: Array.from(matched),
    mismatched: Array.from(mismatched),
    status: isSymmetric ? "symmetric" : "not-symmetric",
  });

  return steps;
}

function generateIterativeSteps(root: TreeNode | null): MirrorStep[] {
  const steps: MirrorStep[] = [];
  let id = 1;
  const matched = new Set<number>();
  const mismatched = new Set<number>();

  const pushStep = (step: Omit<MirrorStep, "id">) => {
    steps.push({ id: id++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "树为空，自然视为对称。",
      action: "complete",
      currentPair: [null, null],
      stackPairs: [],
      queuePairs: [],
      matched: [],
      mismatched: [],
      status: "symmetric",
    });
    return steps;
  }

  type Pair = { left: TreeNode | null; right: TreeNode | null };
  const queue: Pair[] = [{ left: root.left, right: root.right }];

  pushStep({
    title: "初始化队列",
    description: "将根节点的左右子树作为首个镜像对。",
    action: "enqueue",
    currentPair: pairIndices(root.left, root.right),
    stackPairs: [],
    queuePairs: snapshotPairs(queue),
    matched: [],
    mismatched: [],
    status: "pending",
  });

  let isSymmetric = true;

  while (queue.length > 0) {
    const pair = queue.shift()!;
    const currentPair = pairIndices(pair.left, pair.right);

    pushStep({
      title: `出队比较 ${formatValue(pair.left)} 与 ${formatValue(pair.right)}`,
      description: "检查当前镜像节点是否一致。",
      action: "dequeue",
      currentPair,
      stackPairs: [],
      queuePairs: snapshotPairs(queue),
      matched: Array.from(matched),
      mismatched: Array.from(mismatched),
      status: "pending",
    });

    const left = pair.left;
    const right = pair.right;

    if (!left && !right) {
      pushStep({
        title: "空节点匹配",
        description: "两个节点都是 null，继续处理下一对。",
        action: "mirror",
        currentPair,
        stackPairs: [],
        queuePairs: snapshotPairs(queue),
        matched: Array.from(matched),
        mismatched: Array.from(mismatched),
        status: "pending",
      });
      continue;
    }

    if (!left || !right) {
      if (left) mismatched.add(left.index);
      if (right) mismatched.add(right.index);
      pushStep({
        title: "结构不匹配",
        description: "只有一侧存在节点，镜像失败。",
        action: "fail",
        currentPair,
        stackPairs: [],
        queuePairs: snapshotPairs(queue),
        matched: Array.from(matched),
        mismatched: Array.from(mismatched),
        status: "not-symmetric",
      });
      isSymmetric = false;
      break;
    }

    if (left.value !== right.value) {
      mismatched.add(left.index);
      mismatched.add(right.index);
      pushStep({
        title: "值不匹配",
        description: `节点值 ${left.value} 与 ${right.value} 不相等。`,
        action: "fail",
        currentPair,
        stackPairs: [],
        queuePairs: snapshotPairs(queue),
        matched: Array.from(matched),
        mismatched: Array.from(mismatched),
        status: "not-symmetric",
      });
      isSymmetric = false;
      break;
    }

    matched.add(left.index);
    matched.add(right.index);
    pushStep({
      title: "节点匹配成功",
      description: "按镜像顺序将子节点入队等待比较。",
      action: "mirror",
      currentPair,
      stackPairs: [],
      queuePairs: snapshotPairs(queue),
      matched: Array.from(matched),
      mismatched: Array.from(mismatched),
      status: "pending",
    });

    queue.push({ left: left.left, right: right.right });
    queue.push({ left: left.right, right: right.left });

    pushStep({
      title: "子节点入队",
      description: "外层与内层子节点按顺序排入队列。",
      action: "enqueue",
      currentPair,
      stackPairs: [],
      queuePairs: snapshotPairs(queue),
      matched: Array.from(matched),
      mismatched: Array.from(mismatched),
      status: "pending",
    });
  }

  if (isSymmetric) {
    pushStep({
      title: "队列清空，镜像成立",
      description: "所有镜像节点对均匹配，树为轴对称。",
      action: "complete",
      currentPair: [null, null],
      stackPairs: [],
      queuePairs: [],
      matched: Array.from(matched),
      mismatched: Array.from(mismatched),
      status: "symmetric",
    });
  } else {
    pushStep({
      title: "镜像验证失败",
      description: "队列中发现结构或数值冲突。",
      action: "fail",
      currentPair: [null, null],
      stackPairs: [],
      queuePairs: [],
      matched: Array.from(matched),
      mismatched: Array.from(mismatched),
      status: "not-symmetric",
    });
  }

  return steps;
}

function formatValue(node: TreeNode | null): string {
  if (!node) return "null";
  return `${node.value}`;
}
