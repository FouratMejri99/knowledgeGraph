import { Handle, Position } from "@xyflow/react";

const SPACING = 8;
const BORDER_RADIUS = 8;

export default function FolderNode({ data }) {
  const expanded = data.expanded ?? true;

  return (
    <div
      style={{
        border: "2px dashed #999",
        borderRadius: BORDER_RADIUS,
        padding: SPACING,
        background: "#f8f8f8",
        minWidth: 260,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Folder handles (optional, usually disabled) */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      {/* Header */}
      <div
        style={{
          fontWeight: "bold",
          marginBottom: SPACING,
          cursor: "pointer",
        }}
      >
        📁 {data.label}
      </div>

      {/* Children rendered by React Flow parentId */}
      {expanded && (
        <div
          style={{
            display: "flex",
            gap: SPACING,
            flexWrap: "wrap",
          }}
        >
          {/* React Flow injects children automatically */}
        </div>
      )}
    </div>
  );
}
