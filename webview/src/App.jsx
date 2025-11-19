import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import ExpandableNode from "./componenets/ExpandableNode";
import graphData from "./data/datagraph.json";

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({ expandable: ExpandableNode }), []);

  useEffect(() => {
    // 1. Convert JSON to ReactFlow nodes
    const rfNodes = graphData.nodes.map((item, i) => ({
      id: item.id,
      type: "expandable",
      position: { x: 100 + (i % 10) * 280, y: 80 + Math.floor(i / 10) * 160 },
      data: {
        label: item.name,
        file: item.file,
        type: item.type,
        scope: item.scope,
        sections: [
          {
            id: `sec-${item.id}`,
            name: "Info",
            subnodes: [
              { id: `${item.id}-type`, label: `Type: ${item.type}` },
              { id: `${item.id}-file`, label: `File: ${item.file}` },
            ],
          },

          {
            id: `sec-scope-${item.id}`,
            name: "Scope",
            subnodes: item.scope.map((sc, idx) => ({
              id: `${item.id}-scope-${idx}`,
              label: sc,
            })),
          },
        ],
      },
    }));

    // 2. Auto-connect by scope:
    const rfEdges = [];
    graphData.nodes.forEach((item) => {
      item.scope.forEach((parentId) => {
        rfEdges.push({
          id: `edge-${parentId}-${item.id}`,
          source: parentId,
          target: item.id,
        });
      });
    });

    setNodes(rfNodes);
    setEdges(rfEdges);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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
