export function createSampleGraph() {
  const inputs = {
    id: "inputs",
    name: "Inputs",
    subnodes: [
      { id: "dataset", name: "Dataset" },
      { id: "labels", name: "Labels" },
    ],
  };

  const outputs = {
    id: "outputs",
    name: "Outputs",
    subnodes: [
      { id: "model", name: "Model" },
      { id: "error", name: "Error" },
    ],
  };

  return [
    {
      id: "main",
      name: "Neural Network",
      sections: [inputs, outputs],
    },
  ];
}
