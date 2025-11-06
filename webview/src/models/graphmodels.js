export class Subnode {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

export class Section {
  constructor(id, name, type, subnodes = []) {
    this.id = id;
    this.name = name;
    this.type = type; // e.g. "Inputs" or "Outputs"
    this.subnodes = subnodes; // array of Subnode
  }
}

export class Node {
  constructor(id, label, sections = []) {
    this.id = id;
    this.label = label;
    this.sections = sections; // array of Section
  }
}
