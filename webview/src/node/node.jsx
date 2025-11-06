import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";

import { createSampleGraph } from "../utils/sampleGraph";

function Flow() {
  const graphData = useMemo(() => createSampleGraph(), []);
  const initialNodes = [];
  const initialEdges = [];

  graphData.forEach((node) => {
    // Top node
    initialNodes.push({
      id: node.id,
      data: { label: node.name },
      position: { x: 0, y: 0 },
      style: { background: "#b2ebf2", border: "1px solid #00796b" },
    });

    node.sections.forEach((section, i) => {
      const sectionId = `${node.id}-${section.id}`;
      initialNodes.push({
        id: sectionId,
        data: { label: section.name },
        position: { x: 250, y: i * 150 },
        style: { background: "#ffe0b2", border: "1px solid #f57c00" },
      });
      initialEdges.push({
        id: `e-${node.id}-${sectionId}`,
        source: node.id,
        target: sectionId,
      });

      section.subnodes.forEach((sub, j) => {
        const subId = `${sectionId}-${sub.id}`;
        initialNodes.push({
          id: subId,
          data: { label: sub.name },
          position: { x: 500, y: i * 150 + j * 80 },
          style: { background: "#c5cae9", border: "1px solid #3f51b5" },
        });
        initialEdges.push({
          id: `e-${sectionId}-${subId}`,
          source: sectionId,
          target: subId,
        });
      });
    });
  });

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
