import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import Section from "./section";

// Define colors per node type
const NODE_TYPE_COLORS = {
  Folder: "#ffd180",
  File: "#90caf9",
  Class: "#f48fb1",
  Method: "#a5d6a7", // Class Function
  Object: "#ce93d8",
  "Local Function": "#80cbc4",
  "External Function": "#ffab91",
  Variable: "#ffe082",
  "Local Library": "#b39ddb",
  "External Library": "#c5e1a5",
};

export default function Node({ data, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [nodeName, setNodeName] = useState(data.label || "Node");

  const toggleNode = () => setExpanded((p) => !p);

  const headerColor = data.color || "#4caf50";

  return (
    <div
      style={{
        border: `1px solid ${headerColor}`,
        borderRadius: 8,
        background: "#fafafa",
        padding: 6,
        minWidth: 220,
        fontFamily: "Arial, sans-serif",
        fontSize: 13,
        color: "#000",
      }}
    >
      {depth === 0 && (
        <>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </>
      )}

      {/* Node Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: headerColor,
          borderRadius: 6,
          padding: "4px 6px",
          cursor: "pointer",
        }}
      >
        <input
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
          style={{
            border: "none",
            background: "transparent",
            color: "#000",
            fontWeight: "bold",
            fontSize: 13,
            width: "100%",
          }}
        />
        <button
          onClick={toggleNode}
          style={{
            width: 22,
            height: 22,
            background: "#fff",
            color: headerColor,
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 14,
          }}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {/* Sections */}
      {expanded && (
        <div style={{ marginTop: 6 }}>
          {data.sections?.map((sec) => (
            <Section key={sec.id} section={sec} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
