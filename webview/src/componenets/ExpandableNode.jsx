import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useState } from "react";

export default function ExpandableNode({ id, data, isRoot = false }) {
  const rf = useReactFlow();

  const [expanded, setExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [nodeName, setNodeName] = useState(data.label || "Node");
  const [sections, setSections] = useState(
    data.sections?.length
      ? data.sections
      : [{ id: `${id}-sec1`, name: "Section 1", subnodes: [] }]
  );

  const toggleNode = () => setExpanded((p) => !p);
  const toggleSection = (sectionId) =>
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const createNewChildNode = (parentNodeId) => {
    const newId = `node-${Date.now()}`;
    const parent = rf.getNode(parentNodeId);
    if (!parent) return;

    const newNode = {
      id: newId,
      type: "expandable",
      position: {
        x: parent.position.x + 240,
        y: parent.position.y + Math.random() * 80,
      },
      data: { label: "Child Node", sections: [] },
    };

    rf.addNodes(newNode);
    rf.addEdges({
      id: `edge-${parentNodeId}-${newId}`,
      source: parentNodeId,
      target: newId,
    });
  };

  const addSection = () => {
    const newSection = {
      id: `${id}-sec-${Date.now()}`,
      name: `Section ${sections.length + 1}`,
      subnodes: [],
    };
    setSections((prev) => [...prev, newSection]);
  };

  return (
    <div
      style={{
        border: "1px solid #b0bec5",
        borderRadius: 10,
        background: "#f5f5f5",
        padding: 12,
        minWidth: 220,
        position: "relative",
        fontFamily: "Arial, sans-serif",
        color: "#333",
      }}
    >
      {/* ReactFlow Handles */}
      <Handle type="target" position={Position.Left} id={`${id}-t`} />
      <Handle type="source" position={Position.Right} id={`${id}-s`} />

      {/* Node Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          background: "#4caf50",
          padding: "4px 8px",
          borderRadius: 6,
          color: "white",
          fontWeight: 600,
        }}
      >
        <input
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
          style={{
            border: "none",
            background: "transparent",
            color: "white",
            fontWeight: 600,
            width: "100%",
            outline: "none",
          }}
        />
        <button
          onClick={toggleNode}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "white",
            color: "#4caf50",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {/* Sections */}
      {expanded && (
        <div style={{ marginTop: 10 }}>
          {sections.map((section) => (
            <div
              key={section.id}
              style={{
                border: "1px solid #ffb74d",
                borderRadius: 6,
                padding: 8,
                marginTop: 6,
                background: "#fff3e0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#e65100",
                  fontWeight: 500,
                }}
              >
                <span>{section.name}</span>
                <button
                  onClick={() => toggleSection(section.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#e65100",
                  }}
                >
                  {expandedSections[section.id] ? "−" : "+"}
                </button>
              </div>

              {/* Add a child node on button click */}
              {expandedSections[section.id] && (
                <button
                  onClick={() => createNewChildNode(id)}
                  style={{
                    marginTop: 6,
                    background: "#c8e6c9",
                    border: "1px dashed #388e3c",
                    borderRadius: 6,
                    padding: "4px 6px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#2e7d32",
                  }}
                >
                  + Create Subnode (Real Node)
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addSection}
            style={{
              marginTop: 8,
              background: "#bbdefb",
              border: "1px dashed #2196f3",
              borderRadius: 6,
              padding: "4px 8px",
              cursor: "pointer",
              color: "#0d47a1",
              fontWeight: 500,
            }}
          >
            + Add Section
          </button>
        </div>
      )}
    </div>
  );
}
