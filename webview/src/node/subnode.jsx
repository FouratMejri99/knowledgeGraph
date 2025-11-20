import Node from "./node";

export default function Subnode({ data, depth }) {
  // A subnode is basically a recursive node
  return <Node id={data.id} data={data} depth={depth} />;
}
