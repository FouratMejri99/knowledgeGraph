import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import dataGraph from "./data/datagraph.json";
import ExpandableNode from "./node/ExpandableNode";

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({ expandable: ExpandableNode }), []);

  // Define node type colors directly here
  const NODE_TYPE_COLORS = {
    folder: "#ffd180",
    file: "#90caf9",
    class: "#f48fb1",
    method: "#a5d6a7",
    object: "#ce93d8",
    function: "#da2f7eff",
    "External Function": "#ffab91",
    variable: "#ffe082",
    "Local Library": "#b39ddb",
    "External Library": "#c5e1a5",
    module: "#90a4ae", // <-- add this
  };

  useEffect(() => {
    // Map JSON nodes to ReactFlow nodes with sections and colors
    const flowNodes = dataGraph.nodes.map((node, index) => ({
      id: node.id,
      type: "expandable",
      position: {
        x: 50 + (index % 5) * 400, // increase X spacing
        y: 50 + Math.floor(index / 5) * 200, // increase Y spacing
      },
      data: {
        label: node.name || node.id,
        type: node.type,
        expanded: false,
        color: NODE_TYPE_COLORS[node.type],
        sections: (node.scope || []).map((scopeId, i) => ({
          id: `${node.id}-sec-${i}`,
          name: scopeId,
          color: "#d0f0c0",
          expanded: false,
          subnodes: [],
        })),
      },
    }));

    // Map edges
    const flowEdges = dataGraph.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.relation,
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {" "}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        {" "}
        <Background />{" "}
      </ReactFlow>{" "}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      {" "}
      <Flow />{" "}
    </ReactFlowProvider>
  );
}
