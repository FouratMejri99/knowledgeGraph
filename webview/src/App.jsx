import {
  Background,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import dataGraph from "./data/datagraph.json";
import ExpandableNode from "./node/ExpandableNode";
import FolderNode from "./node/FolderNode";
import { graphToFlow } from "./utils/graphToFlow";

function buildLookups(flowNodes) {
  const nodeLookup = new Map();
  const sectionLookup = new Map();

  const walk = (node) => {
    if (!node) return;
    nodeLookup.set(node.id, node);
    (node.sections || []).forEach((sec) => {
      sectionLookup.set(sec.id, sec);
      (sec.subnodes || []).forEach((child) => walk(child));
    });
    (node.subnodes || []).forEach((child) => walk(child));
  };

  flowNodes.forEach((fn) => walk(fn.data));
  return { nodeLookup, sectionLookup };
}

function computeEdges(flowNodes, relationships) {
  const lookups = buildLookups(flowNodes);

  const dedupe = new Set();
  const edges = [];

  relationships.forEach((rel, index) => {
    const edge = rel.toEdge(lookups, index);
    const key = `${edge.source}-${edge.target}-${rel.relation}`;
    if (dedupe.has(key)) return;
    dedupe.add(key);

    edges.push(edge);
  });

  return edges;
}

function classifyEndpoint(flowNodes, nodeId, handleId) {
  const { nodeLookup, sectionLookup } = buildLookups(flowNodes);
  const baseId = handleId ? handleId.replace(/-(source|target)$/, "") : nodeId;

  if (sectionLookup.has(baseId)) {
    return { id: baseId, type: "section" };
  }

  const node = nodeLookup.get(baseId);
  if (node) {
    return { id: baseId, type: node.parentNodeId ? "subnode" : "node" };
  }

  return { id: baseId, type: "unknown" };
}

// Toggle helpers to update expansion state deep in the tree (nodes and sections)
function toggleNodeById(node, targetId) {
  let changed = false;
  let newNode = node;

  if (node.id === targetId) {
    newNode = { ...node, expanded: !node.expanded };
    changed = true;
  }

  let sectionsChanged = false;
  const newSections = node.sections?.map((sec) => {
    const { section: updatedSec, changed: secChanged } = toggleNodeInSection(
      sec,
      targetId
    );
    if (secChanged) sectionsChanged = true;
    return updatedSec;
  });

  let subsChanged = false;
  const newSubnodes = node.subnodes?.map((sub) => {
    const { node: updatedSub, changed: subChanged } = toggleNodeById(
      sub,
      targetId
    );
    if (subChanged) subsChanged = true;
    return updatedSub;
  });

  if (sectionsChanged || subsChanged) {
    changed = true;
    newNode = {
      ...newNode,
      sections: sectionsChanged ? newSections : newNode.sections,
      subnodes: subsChanged ? newSubnodes : newNode.subnodes,
    };
  }

  return { node: newNode, changed };
}

function toggleNodeInSection(section, targetId) {
  let changed = false;
  let newSection = section;

  const newSubnodes = section.subnodes?.map((sub) => {
    const { node: updatedSub, changed: subChanged } = toggleNodeById(
      sub,
      targetId
    );
    if (subChanged) changed = true;
    return updatedSub;
  });

  if (changed) {
    newSection = { ...newSection, subnodes: newSubnodes };
  }

  return { section: newSection, changed };
}

function toggleSectionById(node, sectionId) {
  let changed = false;
  let newNode = node;

    const newSections = node.sections?.map((sec) => {
      let secChanged = false;
      let updatedSec = sec;

      if (sec.id === sectionId) {
        updatedSec = { ...sec, expanded: !sec.expanded };
        secChanged = true;
      }

      // Only process subnodes if they exist
      if (sec.subnodes && sec.subnodes.length > 0) {
        const newSubnodes = sec.subnodes.map((sub) => {
          const { node: updatedSub, changed: subChanged } = toggleSectionById(
            sub,
            sectionId
          );
          if (subChanged) secChanged = true;
          return updatedSub;
        });

        if (secChanged) {
          updatedSec = { ...updatedSec, subnodes: newSubnodes };
          changed = true;
        }
      } else if (secChanged) {
        // If section was toggled but has no subnodes, just update the expanded state
        changed = true;
      }

      return updatedSec;
    });

  const newSubnodes = node.subnodes?.map((sub) => {
    const { node: updatedSub, changed: subChanged } = toggleSectionById(
      sub,
      sectionId
    );
    if (subChanged) changed = true;
    return updatedSub;
  });

  if (changed) {
    newNode = {
      ...newNode,
      sections: newSections || newNode.sections,
      subnodes: newSubnodes || newNode.subnodes,
    };
  }

  return { node: newNode, changed };
}

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [relationships, setRelationships] = useState([]);
  const [userEdges, setUserEdges] = useState([]);

  const [nodesInitialized, setNodesInitialized] = useState(false);
  const [extractedNodes, setExtractedNodes] = useState(new Set());

  useEffect(() => {
    if (!nodesInitialized) {
      const { nodes: flowNodes, relationships: rels } = graphToFlow(
        dataGraph.nodes,
        dataGraph.edges
      );
      setNodes(flowNodes);
      setRelationships(rels);
      setNodesInitialized(true);
    }
  }, [setNodes, nodesInitialized]);

  // Update edges when nodes or userEdges change, but preserve node state
  useEffect(() => {
    if (nodesInitialized) {
      setEdges([...computeEdges(nodes, relationships), ...userEdges]);
    }
  }, [nodes, relationships, userEdges, setEdges, nodesInitialized]);

  const updateEdgesFor = useCallback(
    (nodesSnapshot, rels = relationships, customEdges = userEdges) => {
      setEdges([...computeEdges(nodesSnapshot, rels), ...(customEdges || [])]);
    },
    [relationships, setEdges, userEdges]
  );

  const handleToggleNode = useCallback(
    (nodeId) => {
      setNodes((prev) => {
        const node = prev.find((n) => n.id === nodeId);
        if (!node) return prev;

        const isExtracted = extractedNodes.has(nodeId);
        const willBeCollapsed = node.data.expanded;

        // If node is extracted and being collapsed, return it to folder
        if (isExtracted && willBeCollapsed) {
          const originalPosition = node.data.originalPosition;
          const originalParentId = node.data.originalParentId;

          if (originalPosition && originalParentId) {
            setExtractedNodes((prevExtracted) => {
              const next = new Set(prevExtracted);
              next.delete(nodeId);
              return next;
            });

            return prev.map((n) => {
              if (n.id === nodeId) {
                const { node: updated } = toggleNodeById(n.data, nodeId);
                return {
                  ...n,
                  data: {
                    ...updated,
                    originalPosition: originalPosition,
                    originalParentId: originalParentId,
                  },
                  position: originalPosition,
                  parentId: originalParentId,
                  extent: originalParentId ? "parent" : undefined,
                  draggable: false,
                };
              }
              return n;
            });
          }
        }

        // Normal toggle - preserve position and originalPosition/originalParentId
        const next = prev.map((n) => {
          if (n.id === nodeId) {
            const { node: updated, changed } = toggleNodeById(n.data, nodeId);
            if (changed) {
              // Preserve position - use originalPosition if available, otherwise current position
              const preservedPosition = n.data.originalPosition || n.position;
              return {
                ...n,
                data: {
                  ...updated,
                  originalPosition: n.data.originalPosition,
                  originalParentId: n.data.originalParentId,
                },
                position: preservedPosition,
              };
            }
          }
          return n;
        });
        updateEdgesFor(next);
        return next;
      });
    },
    [setNodes, updateEdgesFor, extractedNodes]
  );

  const handleToggleSection = useCallback(
    (parentNodeId, sectionId) => {
      setNodes((prev) => {
        const next = prev.map((n) => {
          if (n.id !== parentNodeId) return n;
          const { node: updated, changed } = toggleSectionById(
            n.data,
            sectionId
          );
          if (changed) {
            // Preserve originalPosition and originalParentId when updating data
            // Also ensure all data properties are preserved
            return {
              ...n,
              data: {
                ...updated,
                // Explicitly preserve these properties
                originalPosition: n.data.originalPosition,
                originalParentId: n.data.originalParentId,
                // Ensure sections are included (should be in updated, but be explicit)
                sections: updated.sections || n.data.sections,
                subnodes: updated.subnodes || n.data.subnodes,
              },
            };
          }
          return n;
        });
        updateEdgesFor(next);
        return next;
      });
    },
    [setNodes, updateEdgesFor]
  );

  const handleExtractNodeFromRoot = useCallback(
    (nodeId) => {
      setNodes((prev) => {
        const node = prev.find((n) => n.id === nodeId);
        if (!node || !node.parentId || extractedNodes.has(nodeId)) return prev;

        // Store original position if not already stored
        const originalPosition = node.data.originalPosition || node.position;
        const originalParentId = node.data.originalParentId || node.parentId;

        // Calculate position outside folder (to the right)
        const rootFolder = prev.find((n) => n.id === "root-folder");
        const extractX = rootFolder
          ? rootFolder.position.x + (rootFolder.style?.width || 1000) + 100
          : node.position.x + 400;
        const extractY = node.position.y;

        setExtractedNodes((prevExtracted) => {
          const next = new Set(prevExtracted);
          next.add(nodeId);
          return next;
        });

        return prev.map((n) => {
          if (n.id === nodeId) {
            // Extract node: remove parent, make draggable, expand it, position outside
            // Don't toggle - just set expanded to true
            return {
              ...n,
              data: {
                ...n.data,
                expanded: true, // Extract expanded
                originalPosition: originalPosition,
                originalParentId: originalParentId,
              },
              position: { x: extractX, y: extractY },
              parentId: undefined,
              extent: undefined,
              draggable: true,
            };
          }
          return n;
        });
      });
    },
    [setNodes, extractedNodes]
  );

  const handleToggleRootFolder = useCallback(
    (folderId) => {
      setNodes((prev) => {
        const folder = prev.find((n) => n.id === folderId);
        if (!folder || folder.type !== "folder") return prev;
        
        const willBeExpanded = !folder.data.expanded;
        
        // Recursive function to get all descendant node IDs
        const getDescendantIds = (parentId, nodes) => {
          const directChildren = nodes.filter(n => n.parentId === parentId);
          const allDescendants = [...directChildren];
          directChildren.forEach(child => {
            if (child.type === "folder") {
              allDescendants.push(...getDescendantIds(child.id, nodes));
            }
          });
          return allDescendants.map(n => n.id);
        };
        
        const descendantIds = getDescendantIds(folderId, prev);
        
        // Update folder state and hide/show all descendants
        return prev.map((n) => {
          // Update the folder itself
          if (n.id === folderId && n.type === "folder") {
            const HEADER_HEIGHT = 50;
            const newHeight = willBeExpanded 
              ? (n.style?.height || (n.data.totalContentHeight ? HEADER_HEIGHT + n.data.totalContentHeight : "auto"))
              : HEADER_HEIGHT;
            return {
              ...n,
              data: { ...n.data, expanded: willBeExpanded },
              style: {
                ...n.style,
                height: newHeight,
              },
            };
          }
          // Hide/show all descendant nodes (but not extracted ones)
          if (descendantIds.includes(n.id) && !extractedNodes.has(n.id)) {
            return {
              ...n,
              hidden: !willBeExpanded,
            };
          }
          return n;
        });
      });
    },
    [setNodes, extractedNodes]
  );

  const nodeTypes = useMemo(
    () => ({
      expandable: (props) => {
        const isInFolder = props.parentId === "root-folder" || (props.parentId && props.parentId.startsWith("subfolder-"));
        return (
          <ExpandableNode
            {...props}
            onToggleNode={handleToggleNode}
            onToggleSection={handleToggleSection}
            onNodeClick={isInFolder ? handleExtractNodeFromRoot : undefined}
            parentId={props.parentId}
          />
        );
      },
      folder: (props) => (
        <FolderNode
          {...props}
          onToggle={handleToggleRootFolder}
        />
      ),
    }),
    [handleToggleNode, handleToggleSection, handleToggleRootFolder, handleExtractNodeFromRoot]
  );

  const handleConnect = useCallback(
    (params) => {
      // Generate unique ID for each edge
      const edgeId = `user-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newEdge = {
        ...params,
        id: edgeId,
        type: "smoothstep",
        style: { stroke: "#5c3cb3ff", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#5c3cb3ff",
        },
      };

      setUserEdges((prev) => {
        const next = [...prev, newEdge];
        updateEdgesFor(nodes, relationships, next);
        return next;
      });
    },
    [nodes, relationships, updateEdgesFor]
  );

  // Custom handler to preserve positions for nodes in folders
  const handleNodesChange = useCallback(
    (changes) => {
      // Apply ReactFlow's default changes first
      onNodesChange(changes);
      
      // Then fix positions for nodes in folders
      setNodes((prev) => {
        return prev.map((node) => {
          // If node is in a folder and has originalPosition, lock it to that position
          if (node.parentId && node.data.originalPosition && !extractedNodes.has(node.id)) {
            return {
              ...node,
              position: node.data.originalPosition,
            };
          }
          return node;
        });
      });
    },
    [setNodes, onNodesChange, extractedNodes]
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        fitView={!nodesInitialized}
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
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
