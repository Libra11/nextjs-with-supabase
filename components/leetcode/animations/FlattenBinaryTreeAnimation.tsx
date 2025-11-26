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
  ReactFlowProvider,
  useReactFlow,
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

type StepAction =
  | "scan"
  | "find-predecessor"
  | "rewire"
  | "move-next"
  | "complete";

type NodeStatus =
  | "current"
  | "predecessor"
  | "target"
  | "default"
  | "processed";

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
}

interface BuildTreeResult {
  root: TreeNode | null;
  nodes: TreeNode[];
}

interface FlattenStep {
  id: number;
  title: string;
  description: string;
  action: StepAction;
  currentNode: number | null;
  predecessorNode: number | null;
  targetNode: number | null; // The node being moved or connected
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

const DEFAULT_INPUT = "1,2,5,3,4,null,6";
const DEFAULT_VALUES: (number | null)[] = [1, 2, 5, 3, 4, null, 6];
const MAX_NODES = 31;
const NODE_SIZE = 50; // Smaller node size for linked list visualization
const EDGE_COLOR = "rgba(59,130,246,0.65)";

const actionLabels: Record<StepAction, string> = {
  scan: "扫描",
  "find-predecessor": "找前驱",
  rewire: "重连",
  "move-next": "移动",
  complete: "完成",
};

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary",
  predecessor: "bg-amber-500/20 border-amber-500/80 text-amber-800",
  target: "bg-purple-500/20 border-purple-500/70 text-purple-700",
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
        className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-semibold text-base shadow-lg transition-colors duration-300 ${statusClass}`}
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

export default function FlattenBinaryTreeAnimation() {
  const [levelOrderInput, setLevelOrderInput] = useState(DEFAULT_INPUT);
  const [treeValues, setTreeValues] = useState<(number | null)[]>([
    ...DEFAULT_VALUES,
  ]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const treeData = useMemo(() => buildTreeData(treeValues), [treeValues]);
  const valueLookup = useMemo(() => {
    const lookup = new Map<number, number>();
    treeData.nodes.forEach((node) => lookup.set(node.index, node.value));
    return lookup;
  }, [treeData.nodes]);

  const flattenSteps = useMemo(() => {
    const rootClone = cloneTree(treeData.root);
    return generateFlattenSteps(rootClone);
  }, [treeData.root]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [treeData.root]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= flattenSteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, flattenSteps.length - 1));
    }, 1000); // Slightly faster animation

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, flattenSteps.length]);

  const stepInfo = flattenSteps[currentStep] ?? flattenSteps[0];
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });

  // Use useMemo for flowGraph to avoid recalculating on every render if step doesn't change
  const flowGraph = useMemo(
    () => buildFlowElements(stepInfo?.tree ?? null, stepInfo),
    [stepInfo]
  );

  const treeDepth = useMemo(
    () => getTreeDepth(stepInfo?.tree ?? null),
    [stepInfo?.tree]
  );
  // Adjust canvas height dynamically based on depth, flattened tree can be very deep (long list)
  const canvasHeight = Math.max(400, (treeDepth + 1) * 80);

  const progress =
    flattenSteps.length <= 1 ? 1 : currentStep / (flattenSteps.length - 1);

  const recentSteps = useMemo(() => {
    const start = Math.max(0, currentStep - 2);
    return flattenSteps.slice(start, currentStep + 1);
  }, [currentStep, flattenSteps]);

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
    setCurrentStep((prev) => Math.min(prev + 1, flattenSteps.length - 1));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/80 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">二叉树展开为链表动画</h3>
            <p className="text-sm text-muted-foreground">
              演示 Morris 遍历思想：寻找前驱节点，将左子树移至右侧，实现 O(1)
              空间展开。
            </p>
          </div>
        </div>

        <form
          onSubmit={handleApplyInput}
          className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center"
        >
          <div className="flex-1">
            <Input
              value={levelOrderInput}
              onChange={(event) => setLevelOrderInput(event.target.value)}
              placeholder="例如：1,2,5,3,4,null,6"
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearInput}
            >
              清空
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleUseExample}
            >
              示例
            </Button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <div className="rounded-xl border border-border bg-card/80 p-4">
          <div className="flex flex-col gap-4">
            <div className="relative rounded-lg border border-dashed border-border bg-muted/20 overflow-hidden">
              {flowGraph.nodes.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
                  暂无可视化，输入非空树即可查看动画。
                </div>
              ) : (
                <ReactFlow
                  nodes={flowGraph.nodes}
                  edges={flowGraph.edges}
                  nodeTypes={nodeTypesRef.current}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  minZoom={0.2}
                  maxZoom={1.2}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  preventScrolling={false}
                  panOnScroll
                  zoomOnScroll={false}
                  style={{ minHeight: "500px", height: "500px" }} // Fixed height for consistency
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={32}
                    size={1}
                    className="opacity-70"
                  />
                  <Controls
                    showInteractive={false}
                    className="bg-background/80"
                  />
                </ReactFlow>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">进度</span>
                <span className="text-muted-foreground">
                  Step {currentStep + 1} / {flattenSteps.length}
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPlaying((prev) => !prev)}
              >
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
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  当前步骤
                </p>
                <h4 className="text-lg font-semibold">
                  {stepInfo?.title ?? "等待输入"}
                </h4>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {stepInfo ? actionLabels[stepInfo.action] : "-"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {stepInfo?.description ?? "请输入有效的层序序列以开始动画。"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">步骤日志</h4>
              <span className="text-xs text-muted-foreground">
                最近 {recentSteps.length} 条
              </span>
            </div>
            <div className="space-y-3">
              {recentSteps.map((step) => (
                <div
                  key={step.id}
                  className="rounded-lg border border-border/60 bg-background/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{step.title}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {actionLabels[step.action]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
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

// --- Helpers and Algorithm ---

function generateFlattenSteps(root: TreeNode | null): FlattenStep[] {
  const steps: FlattenStep[] = [];
  let stepId = 1;
  const processed = new Set<number>();

  const pushStep = (step: Omit<FlattenStep, "id">) => {
    steps.push({ id: stepId++, ...step });
  };

  if (!root) {
    pushStep({
      title: "空树",
      description: "没有节点需要展开。",
      action: "complete",
      currentNode: null,
      predecessorNode: null,
      targetNode: null,
      processed: [],
      tree: null,
    });
    return steps;
  }

  let curr: TreeNode | null = root;

  pushStep({
    title: "开始展开",
    description: "从根节点开始，准备将二叉树展开为链表。",
    action: "scan",
    currentNode: curr.index,
    predecessorNode: null,
    targetNode: null,
    processed: [],
    tree: cloneTree(root),
  });

  while (curr) {
    if (curr.left) {
      pushStep({
        title: `检查节点 ${curr.value}`,
        description: `节点 ${curr.value} 有左子树，需要将其移至右侧。首先寻找左子树中最右的节点（前驱）。`,
        action: "find-predecessor",
        currentNode: curr.index,
        predecessorNode: null,
        targetNode: curr.left.index,
        processed: Array.from(processed),
        tree: cloneTree(root),
      });

      let next: TreeNode = curr.left;
      let predecessor: TreeNode = next;

      while (predecessor.right) {
        predecessor = predecessor.right;
      }

      pushStep({
        title: `找到前驱节点 ${predecessor.value}`,
        description: `在左子树中找到最右节点 ${predecessor.value}。我们将把原右子树接到它的右边。`,
        action: "find-predecessor",
        currentNode: curr.index,
        predecessorNode: predecessor.index,
        targetNode: null,
        processed: Array.from(processed),
        tree: cloneTree(root),
      });

      // Modify the tree structure for visualization
      const currentTreeSnapshot = cloneTree(root); // Snapshot before modification

      // Perform the modification on the "working" tree structure that is being tracked
      // But we need to be careful to update the tree structure passed to steps
      // Since `curr`, `predecessor` are references to nodes in `root` (which is a clone), modification works directly.

      // Note: The `root` variable here is the initial clone passed to the function.
      // We continue modifying it.

      predecessor.right = curr.right;
      curr.right = curr.left;
      curr.left = null;

      pushStep({
        title: "移动子树",
        description: `将左子树移到右边，原右子树接到前驱节点 ${predecessor.value} 的后面。左子针置空。`,
        action: "rewire",
        currentNode: curr.index,
        predecessorNode: predecessor.index,
        targetNode: null,
        processed: Array.from(processed),
        tree: cloneTree(root), // This tree now reflects the structural change
      });
    } else {
      pushStep({
        title: `节点 ${curr.value} 无左子树`,
        description: "直接移动到下一个右子节点。",
        action: "move-next",
        currentNode: curr.index,
        predecessorNode: null,
        targetNode: null,
        processed: Array.from(processed),
        tree: cloneTree(root),
      });
    }

    processed.add(curr.index);
    curr = curr.right;

    if (curr) {
      pushStep({
        title: `处理下一个节点 ${curr.value}`,
        description: "继续处理链表中的下一个节点。",
        action: "scan",
        currentNode: curr.index,
        predecessorNode: null,
        targetNode: null,
        processed: Array.from(processed),
        tree: cloneTree(root),
      });
    }
  }

  pushStep({
    title: "展开完成",
    description: "所有节点已展开为单向链表。",
    action: "complete",
    currentNode: null,
    predecessorNode: null,
    targetNode: null,
    processed: Array.from(processed),
    tree: cloneTree(root),
  });

  return steps;
}

function buildFlowElements(
  root: TreeNode | null,
  step?: FlattenStep
): FlowGraphResult {
  if (!root) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // Since it becomes a linked list (very deep), we might want 'LR' or handle spacing better
  // But sticking to 'TB' (Top-Bottom) preserves the tree idea best until it becomes a list.
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 40,
    ranksep: 50,
    marginx: 20,
    marginy: 20,
  });

  const queue: TreeNode[] = [root];
  const treeNodes: TreeNode[] = [];
  const connections: Array<{
    source: string;
    target: string;
    isRight: boolean;
  }> = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    treeNodes.push(node);

    if (node.left) {
      queue.push(node.left);
      connections.push({
        source: node.id,
        target: node.left.id,
        isRight: false,
      });
    }
    if (node.right) {
      queue.push(node.right);
      connections.push({
        source: node.id,
        target: node.right.id,
        isRight: true,
      });
    }
  }

  treeNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_SIZE, height: NODE_SIZE });
  });
  connections.forEach(({ source, target }) =>
    dagreGraph.setEdge(source, target)
  );

  dagre.layout(dagreGraph);

  const processedSet = new Set(step?.processed ?? []);

  const nodes: Node<TreeNodeFlowData>[] = treeNodes.map((node) => {
    const layout = dagreGraph.node(node.id) as
      | { x: number; y: number }
      | undefined;
    const x = layout ? layout.x : 0;
    const y = layout ? layout.y : 0;
    const status = getNodeStatus(
      node.index,
      step?.currentNode ?? null,
      step?.predecessorNode ?? null,
      step?.targetNode ?? null,
      processedSet
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

  const edges: Edge[] = connections.map(({ source, target, isRight }) => ({
    id: `${source}-${target}`,
    source,
    target,
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
    style: { stroke: EDGE_COLOR, strokeWidth: 2 },
    type: "smoothstep",
    label: isRight ? "R" : "L",
    labelStyle: { fill: "gray", fontSize: 10 },
    labelBgStyle: { fill: "transparent" },
  }));

  return { nodes, edges };
}

function getNodeStatus(
  index: number,
  current: number | null,
  predecessor: number | null,
  target: number | null,
  processed: Set<number>
): NodeStatus {
  if (current === index) return "current";
  if (predecessor === index) return "predecessor";
  if (target === index) return "target";
  if (processed.has(index)) return "processed";
  return "default";
}

// --- Shared Parsing Logic ---
// (Copied from InvertBinaryTreeAnimation, simplified)

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
