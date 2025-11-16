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

type StepAction = "descend" | "swap" | "backtrack" | "queue" | "complete";

type NodeStatus = "current" | "stack" | "queue" | "swapped" | "processed" | "default";

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
}

interface BuildTreeResult {
  root: TreeNode | null;
  nodes: TreeNode[];
}

interface InversionStep {
  id: number;
  title: string;
  description: string;
  action: StepAction;
  currentNode: number | null;
  stack: number[];
  queue: number[];
  swapped: number[];
  processed: number[];
  tree: TreeNode | null;
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

const DEFAULT_INPUT = "4,2,7,1,3,6,9";
const DEFAULT_VALUES: (number | null)[] = [4, 2, 7, 1, 3, 6, 9];
const MAX_NODES = 31;
const NODE_SIZE = 96;
const EDGE_COLOR = "rgba(59,130,246,0.65)";

const methodDescriptions: Record<TraversalMethod, string> = {
  recursive: "自顶向下递归：先递归翻转左右子树，再交换当前节点的左右指针，利用系统栈天然回溯。",
  iterative: "使用队列层序遍历：每次弹出队首节点，交换其左右子指针，再把子节点入队，直到队列为空。",
};

const actionLabels: Record<StepAction, string> = {
  descend: "深入",
  swap: "交换",
  backtrack: "回溯",
  queue: "入队",
  complete: "完成",
};

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary",
  stack: "bg-amber-500/20 border-amber-500/80 text-amber-800",
  queue: "bg-purple-500/20 border-purple-500/70 text-purple-700",
  swapped: "bg-sky-500/20 border-sky-500 text-sky-700",
  processed: "bg-emerald-500/20 border-emerald-500/80 text-emerald-700",
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

export default function InvertBinaryTreeAnimation() {
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

  const inversionSteps = useMemo(() => {
    const rootClone = cloneTree(treeData.root);
    return method === "iterative"
      ? generateBfsSteps(rootClone)
      : generateDfsSteps(rootClone);
  }, [treeData.root, method]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [method, treeData.root]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= inversionSteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, inversionSteps.length - 1));
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, inversionSteps.length]);

  const stepInfo = inversionSteps[currentStep] ?? inversionSteps[0];
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const flowGraph = useMemo(() => buildFlowElements(stepInfo?.tree ?? null, stepInfo), [stepInfo]);

  const treeDepth = useMemo(() => getTreeDepth(stepInfo?.tree ?? null), [stepInfo?.tree]);
  const canvasHeight = Math.max(360, (treeDepth + 1) * 180);
  const progress = inversionSteps.length <= 1 ? 1 : currentStep / (inversionSteps.length - 1);

  const auxiliaryLabel = method === "recursive" ? "递归栈" : "队列";
  const auxiliaryItems = method === "recursive" ? stepInfo?.stack ?? [] : stepInfo?.queue ?? [];
  const processedValues = useMemo(() => {
    return (stepInfo?.processed ?? []).map((idx) => ({
      index: idx,
      value: valueLookup.get(idx) ?? null,
    }));
  }, [stepInfo?.processed, valueLookup]);

  const swappedValues = useMemo(() => {
    return (stepInfo?.swapped ?? []).map((idx) => ({
      index: idx,
      value: valueLookup.get(idx) ?? null,
    }));
  }, [stepInfo?.swapped, valueLookup]);

  const recentSteps = useMemo(() => {
    const start = Math.max(0, currentStep - 2);
    return inversionSteps.slice(start, currentStep + 1);
  }, [currentStep, inversionSteps]);

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
    setCurrentStep((prev) => Math.min(prev + 1, inversionSteps.length - 1));
  };

  const nodeTypes = nodeTypesRef.current;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/80 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">翻转二叉树动画</h3>
            <p className="text-sm text-muted-foreground">
              根据输入的层序序列构建二叉树，分别用递归 DFS 与迭代 BFS 演示翻转的全过程。
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
              placeholder="例如：4,2,7,1,3,6,9"
            />
            {inputError ? (
              <p className="mt-1 text-xs text-destructive">{inputError}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                使用层序遍历输入值，节点间用逗号或空格分隔，null 代表空指针。
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
                  暂无可视化，输入非空树即可查看动画。
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
                  Step {currentStep + 1} / {inversionSteps.length}
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
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">{auxiliaryLabel}</h4>
              <span className="text-xs text-muted-foreground">{auxiliaryItems.length} 项</span>
            </div>
            {auxiliaryItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">结构为空。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {auxiliaryItems.map((idx) => (
                  <div key={idx} className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                    #{idx} · {valueLookup.get(idx) ?? "null"}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">已翻转节点</h4>
              <span className="text-xs text-muted-foreground">{processedValues.length} / {treeData.nodes.length}</span>
            </div>
            {processedValues.length === 0 ? (
              <p className="text-xs text-muted-foreground">尚未有节点完成交换。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {processedValues.map(({ index, value }) => (
                  <div key={index} className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700">
                    #{index} · {value ?? "null"}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">当前交换对</h4>
              <span className="text-xs text-muted-foreground">{swappedValues.length} 节点</span>
            </div>
            {swappedValues.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂无需要高亮的子节点。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {swappedValues.map(({ index, value }) => (
                  <div key={index} className="rounded-full border border-sky-500/50 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-700">
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

function buildFlowElements(root: TreeNode | null, step?: InversionStep): FlowGraphResult {
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

  const swappedSet = new Set(step?.swapped ?? []);
  const stackSet = new Set(step?.stack ?? []);
  const queueSet = new Set(step?.queue ?? []);
  const processedSet = new Set(step?.processed ?? []);

  const nodes: Node<TreeNodeFlowData>[] = treeNodes.map((node) => {
    const layout = dagreGraph.node(node.id) as { x: number; y: number } | undefined;
    const x = layout ? layout.x : 0;
    const y = layout ? layout.y : 0;
    const status = getNodeStatus(
      node.index,
      step?.currentNode ?? null,
      swappedSet,
      stackSet,
      queueSet,
      processedSet,
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
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
    style: { stroke: EDGE_COLOR, strokeWidth: 2 },
    type: "smoothstep",
  }));

  return { nodes, edges };
}

function getNodeStatus(
  index: number,
  current: number | null,
  swapped: Set<number>,
  stack: Set<number>,
  queue: Set<number>,
  processed: Set<number>,
): NodeStatus {
  if (swapped.has(index)) return "swapped";
  if (current === index) return "current";
  if (stack.has(index)) return "stack";
  if (queue.has(index)) return "queue";
  if (processed.has(index)) return "processed";
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

function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  const cloned: TreeNode = {
    id: node.id,
    value: node.value,
    index: node.index,
    left: null,
    right: null,
  };
  cloned.left = cloneTree(node.left);
  cloned.right = cloneTree(node.right);
  return cloned;
}

function getTreeDepth(node: TreeNode | null): number {
  if (!node) return -1;
  return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

function generateDfsSteps(root: TreeNode | null): InversionStep[] {
  const steps: InversionStep[] = [];
  let stepId = 1;
  const processed = new Set<number>();

  const pushStep = (step: Omit<InversionStep, "id">) => {
    steps.push({ id: stepId++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "没有节点需要翻转。",
      action: "complete",
      currentNode: null,
      stack: [],
      queue: [],
      swapped: [],
      processed: [],
      tree: null,
    });
    return steps;
  }

  const path: TreeNode[] = [];

  const dfs = (node: TreeNode | null) => {
    if (!node) {
      return;
    }

    path.push(node);
    pushStep({
      title: `访问节点 ${node.value}`,
      description: "递归处理左子树，再处理右子树，最后交换指针。",
      action: "descend",
      currentNode: node.index,
      stack: path.map((n) => n.index),
      queue: [],
      swapped: [],
      processed: Array.from(processed),
      tree: cloneTree(root),
    });

    dfs(node.left);
    dfs(node.right);

    const previousLeft = node.left?.index ?? null;
    const previousRight = node.right?.index ?? null;
    const temp = node.left;
    node.left = node.right;
    node.right = temp;
    processed.add(node.index);

    pushStep({
      title: `交换节点 ${node.value}`,
      description:
        previousLeft === null && previousRight === null
          ? "叶子节点没有左右子树，可视为交换空指针。"
          : "将左右子树互换，并在回溯阶段带着新的结构返回。",
      action: "swap",
      currentNode: node.index,
      stack: path.map((n) => n.index),
      queue: [],
      swapped: [node.left?.index, node.right?.index].filter(
        (idx): idx is number => typeof idx === "number",
      ),
      processed: Array.from(processed),
      tree: cloneTree(root),
    });

    path.pop();

    pushStep({
      title: `回溯节点 ${node.value}`,
      description: "递归返回上一层，继续处理父节点的另一侧。",
      action: "backtrack",
      currentNode: path[path.length - 1]?.index ?? null,
      stack: path.map((n) => n.index),
      queue: [],
      swapped: [],
      processed: Array.from(processed),
      tree: cloneTree(root),
    });
  };

  dfs(root);

  pushStep({
    title: "完成翻转",
    description: "所有节点都已交换，递归结束。",
    action: "complete",
    currentNode: null,
    stack: [],
    queue: [],
    swapped: [],
    processed: Array.from(processed),
    tree: cloneTree(root),
  });

  return steps;
}

function generateBfsSteps(root: TreeNode | null): InversionStep[] {
  const steps: InversionStep[] = [];
  let stepId = 1;
  const processed = new Set<number>();

  const pushStep = (step: Omit<InversionStep, "id">) => {
    steps.push({ id: stepId++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "没有节点需要翻转。",
      action: "complete",
      currentNode: null,
      stack: [],
      queue: [],
      swapped: [],
      processed: [],
      tree: null,
    });
    return steps;
  }

  const queue: TreeNode[] = [root];
  const queueSnapshot: number[] = [root.index];

  pushStep({
    title: "初始化队列",
    description: "将根节点入队，准备按层翻转。",
    action: "queue",
    currentNode: null,
    stack: [],
    queue: [...queueSnapshot],
    swapped: [],
    processed: [],
    tree: cloneTree(root),
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    queueSnapshot.shift();

    pushStep({
      title: `处理节点 ${node.value}`,
      description: "弹出队首节点，准备交换它的左右子节点。",
      action: "descend",
      currentNode: node.index,
      stack: [],
      queue: [...queueSnapshot],
      swapped: [],
      processed: Array.from(processed),
      tree: cloneTree(root),
    });

    const temp = node.left;
    node.left = node.right;
    node.right = temp;
    processed.add(node.index);

    pushStep({
      title: `交换节点 ${node.value}`,
      description: "当前节点的左右指针完成互换。",
      action: "swap",
      currentNode: node.index,
      stack: [],
      queue: [...queueSnapshot],
      swapped: [node.left?.index, node.right?.index].filter(
        (idx): idx is number => typeof idx === "number",
      ),
      processed: Array.from(processed),
      tree: cloneTree(root),
    });

    const enqueued: number[] = [];
    if (node.left) {
      queue.push(node.left);
      queueSnapshot.push(node.left.index);
      enqueued.push(node.left.index);
    }
    if (node.right) {
      queue.push(node.right);
      queueSnapshot.push(node.right.index);
      enqueued.push(node.right.index);
    }

    if (enqueued.length > 0) {
      pushStep({
        title: "子节点入队",
        description: "将交换后的子节点加入队列，等待后续处理。",
        action: "queue",
        currentNode: null,
        stack: [],
        queue: [...queueSnapshot],
        swapped: [],
        processed: Array.from(processed),
        tree: cloneTree(root),
      });
    }
  }

  pushStep({
    title: "完成翻转",
    description: "队列清空，所有节点都已经交换。",
    action: "complete",
    currentNode: null,
    stack: [],
    queue: [],
    swapped: [],
    processed: Array.from(processed),
    tree: cloneTree(root),
  });

  return steps;
}
