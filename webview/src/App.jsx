import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import ExpandableNode from "./componenets/ExpandableNode";
import { createSampleGraph } from "./utils/sampleGraph";

function Flow() {
  const graphData = useMemo(() => createSampleGraph(), []);

  // Define a single main node that uses the custom node type
  const initialNodes = [
    {
      id: "main",
      type: "expandable",
      position: { x: 80, y: 100 },
      data: graphData[0],
    },
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(
    () => ({
      expandable: ExpandableNode,
    }),
    []
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
