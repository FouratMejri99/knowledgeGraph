import Node from "./node";

export default function ExpandableNode({ id, data }) {
  // This is just a wrapper that renders Node with its sections
  return <Node id={id} data={data} depth={0} />;
}
