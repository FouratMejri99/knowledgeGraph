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

    const newSubnodes = sec.subnodes?.map((sub) => {
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

  useEffect(() => {
    const { nodes: flowNodes, relationships: rels } = graphToFlow(
      dataGraph.nodes,
      dataGraph.edges
    );
    setNodes(flowNodes);
    setRelationships(rels);
    setEdges([...computeEdges(flowNodes, rels), ...userEdges]);
  }, [setNodes, setEdges, userEdges]);

  const updateEdgesFor = useCallback(
    (nodesSnapshot, rels = relationships, customEdges = userEdges) => {
      setEdges([...computeEdges(nodesSnapshot, rels), ...(customEdges || [])]);
    },
    [relationships, setEdges, userEdges]
  );

  const handleToggleNode = useCallback(
    (nodeId) => {
      setNodes((prev) => {
        const next = prev.map((n) => {
          const { node: updated, changed } = toggleNodeById(n.data, nodeId);
          return changed ? { ...n, data: updated } : n;
        });
        updateEdgesFor(next);
        return next;
      });
    },
    [setNodes, updateEdgesFor]
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
          return changed ? { ...n, data: updated } : n;
        });
        updateEdgesFor(next);
        return next;
      });
    },
    [setNodes, updateEdgesFor]
  );

  const nodeTypes = useMemo(
    () => ({
      expandable: (props) => (
        <ExpandableNode
          {...props}
          onToggleNode={handleToggleNode}
          onToggleSection={handleToggleSection}
        />
      ),
    }),
    [handleToggleNode, handleToggleSection]
  );

  const handleConnect = useCallback(
    (params) => {
      const sourceEp = classifyEndpoint(
        nodes,
        params.source,
        params.sourceHandle
      );
      const targetEp = classifyEndpoint(
        nodes,
        params.target,
        params.targetHandle
      );

      const newEdge = {
        ...params,
        style: { stroke: "#999", strokeWidth: 2 },
        markerEnd: undefined,
      };
      setUserEdges((prev) => {
        const next = [...prev, newEdge];
        updateEdgesFor(nodes, relationships, next);
        return next;
      });
    },
    [nodes, relationships, updateEdgesFor]
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
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
