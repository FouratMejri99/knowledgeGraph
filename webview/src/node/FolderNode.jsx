import { Handle, Position } from "@xyflow/react";

const SPACING = 8;
const BORDER_RADIUS = 8;

export default function FolderNode({ data, id, onToggle }) {
  const expanded = data.expanded ?? true;
  const isSubfolder = data.isSubfolder ?? false;
  const isRootFolder = data.isRootFolder ?? false;

  const borderColor = isSubfolder ? "#ff9800" : "#5c3cb3";
  const backgroundGradient = isSubfolder 
    ? "linear-gradient(to bottom, #fff3e0 0%, #ffe0b2 100%)"
    : "linear-gradient(to bottom, #f0f0f0 0%, #e8e8e8 100%)";
  const headerGradient = isSubfolder
    ? "linear-gradient(to bottom, #ff9800 0%, #f57c00 100%)"
    : "linear-gradient(to bottom, #5c3cb3 0%, #4a2fa8 100%)";

  const HEADER_HEIGHT = 50;
  const calculatedHeight = expanded 
    ? (data.height || (data.totalContentHeight ? HEADER_HEIGHT + data.totalContentHeight : "auto"))
    : HEADER_HEIGHT;

  return (
    <div
      style={{
        border: `3px solid ${borderColor}`,
        borderRadius: BORDER_RADIUS,
        padding: 0,
        background: backgroundGradient,
        minWidth: 260,
        fontFamily: "Arial, sans-serif",
        width: data.width || "auto",
        height: calculatedHeight,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        overflow: expanded ? "visible" : "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "height 0.3s ease",
      }}
    >
      {/* Folder handles (optional, usually disabled) */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      {/* Header with toggle */}
      <div
        style={{
          fontWeight: "bold",
          padding: `14px 20px`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: SPACING + 4,
          background: headerGradient,
          color: "white",
          borderBottom: expanded ? `2px solid ${isSubfolder ? "#e65100" : "#3d2588"}` : "none",
          boxShadow: expanded ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none",
          minHeight: "50px",
          flexShrink: 0,
        }}
        onClick={() => onToggle && onToggle(id)}
      >
        <button
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: "pointer",
            padding: "2px 8px",
            minWidth: "24px",
            color: "white",
            fontWeight: "bold",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggle) onToggle(id);
          }}
        >
          {expanded ? "−" : "+"}
        </button>
        <span style={{ fontSize: "18px" }}>📁</span>
        <span>{data.label}</span>
      </div>

      {/* Content area - positioned below header */}
      {expanded && (
        <div
          style={{
            marginTop: 0,
            padding: isSubfolder ? "24px 20px" : "24px 24px",
            background: isSubfolder 
              ? "rgba(255, 243, 224, 0.95)" 
              : "rgba(248, 248, 252, 0.9)",
            minHeight: "100px",
            flex: 1,
            position: "relative",
            overflow: "visible",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* ReactFlow injects child nodes here, positioned relative to folder container */}
        </div>
      )}
    </div>
  );
}
