const SPEED = 2;
const CELL_SIZE = 25;
const nodes = [];
const edges = [];

let mode = "wait";
let currentNode = null;

class Edge {
  start;
  end;
  signals = [];

  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.start.edges.push(this);
  }

  draw() {
    const dx = this.end.position.x - this.start.position.x;
    const dy = this.end.position.y - this.start.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    for (let i = this.signals.length - 1; i >= 0; i--) {
      this.signals[i] += SPEED;
      if (this.signals[i] > dist) {
        this.signals.splice(i, 1);
        this.end.fire();
      }
    }

    stroke(255);
    line(
      this.start.position.x,
      this.start.position.y,
      this.end.position.x,
      this.end.position.y
    );

    for (let signal of this.signals) {
      fill(255);
      const x = Math.cos(angle) * signal + this.start.position.x;
      const y = Math.sin(angle) * signal + this.start.position.y;
      ellipse(x, y, 5, 5);
    }
  }

  addSignal() {
    this.signals.push(0);
  }
}

class Node {
  edges = [];
  position = { x: 0, y: 0 };
  note = "E3";
  excitement = 0;
  mode = "multicast";
  previousEdge = 0;

  constructor(x, y, note, mode = "multicast") {
    this.position = { x, y };
    this.monoSynth = new p5.MonoSynth();
    this.note = note;
    this.mode = mode;
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  draw() {
    noFill();
    if (this.mode == "multicast") {
      stroke(255);
    } else if (this.mode == "roundrobin") {
      stroke(255, 0, 255);
    }

    fill(255, this.excitement * 255);
    this.excitement *= 0.9;
    ellipse(this.position.x, this.position.y, 10, 10);

    if (currentNode == this) {
      stroke(255);
      ellipse(this.position.x, this.position.y, 20, 20);
    }

    const gridPoint = closestGridPoint(this.position.x, this.position.y);
    this.position.x = gridPoint.x;
    this.position.y = gridPoint.y;
  }

  fire() {
    this.monoSynth.play(this.note, 1, 0, 0.01);

    if (this.mode == "multicast") {
      for (const edge of this.edges) {
        edge.addSignal();
      }
    } else if (this.mode == "roundrobin") {
      this.edges[this.previousEdge].addSignal();
      this.previousEdge = (this.previousEdge + 1) % this.edges.length;
    }
    this.excitement = 1;
  }
}

function closestGridPoint(x, y) {
  const gridX = Math.round(x / CELL_SIZE) * CELL_SIZE;
  const gridY = Math.round(y / CELL_SIZE) * CELL_SIZE;
  return { x: gridX, y: gridY };
}

function setup() {
  canvas = createCanvas(1000, 1000);

  const node1 = new Node(100, 100, "E5");
  nodes.push(node1);

  const node2 = new Node(120, 100, "E5");
  nodes.push(node2);

  const node3 = new Node(120, 120, "E5");
  nodes.push(node3);

  const node4 = new Node(100, 120, "E6");
  nodes.push(node4);

  const node5 = new Node(300, 120, "E2", "roundrobin");
  nodes.push(node5);

  const node6 = new Node(400, 120, "A3");
  nodes.push(node6);

  const node7 = new Node(400, 140, "G2");
  nodes.push(node7);

  const edge1 = new Edge(node1, node2);
  edges.push(edge1);

  const edge2 = new Edge(node2, node3);
  edges.push(edge2);

  const edge3 = new Edge(node3, node4);
  edges.push(edge3);

  const edge4 = new Edge(node4, node1);
  edges.push(edge4);

  const edge5 = new Edge(node3, node5);
  edges.push(edge5);

  edges.push(new Edge(node5, node6));
  edges.push(new Edge(node5, node7));
}

function draw() {
  background(0);

  // draw grid with dots
  fill(100);
  noStroke();
  for (let x = 0; x < width; x += CELL_SIZE) {
    for (let y = 0; y < height; y += CELL_SIZE) {
      ellipse(x, y, 2, 2);
    }
  }

  // stroke(50);
  // for (let x = 0; x < width; x += CELL_SIZE) {
  //   line(x, 0, x, height);
  // }
  // for (let y = 0; y < height; y += CELL_SIZE) {
  //   line(0, y, width, y);
  // }

  switch (mode) {
    case "wait":
      fill(255);
      noStroke();
      text("CLICK TO BEGIN", width / 2, height / 2);
      break;
    case "drag-node":
      currentNode.position.x = mouseX;
      currentNode.position.y = mouseY;
      break;
  }

  for (const edge of edges) {
    edge.draw();
  }

  for (const node of nodes) {
    node.draw();
  }
}

function nodeAtPoint(x, y) {
  for (node of nodes) {
    const dx = node.position.x - x;
    const dy = node.position.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) {
      return node;
    }
  }
}

function dragNode() {
  const selected = nodeAtPoint(mouseX, mouseY);
  if (selected) {
    currentNode = selected;
    mode = "drag-node";
  }
}

function createNodeOrEdge() {
  const selected = nodeAtPoint(mouseX, mouseY);
  if (selected) {
    currentNode = selected;
    mode = "create-edge";
  } else {
    const node = new Node(mouseX, mouseY, "E3");
    nodes.push(node);
  }
}

function playNode() {
  const selected = nodeAtPoint(mouseX, mouseY);
  if (selected) {
    selected.fire();
  }
}

function keyPressed() {
  console.log(keyCode);
  if (keyCode == 8) {
    if (currentNode) {
      for (let i = edges.length - 1; i >= 0; i--) {
        const edge = edges[i];
        if (edge.start == currentNode || edge.end == currentNode) {
          edges.splice(i, 1);
        }
      }

      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node == currentNode) {
          nodes.splice(i, 1);
        }
      }
      currentNode = null;
    }
  }
}

function mousePressed() {
  switch (mode) {
    case "wait":
      userStartAudio();
      mode = "select";
      break;
    case "select":
      if (keyIsDown(16)) {
        dragNode();
      } else if (keyIsDown(224)) {
        createNodeOrEdge();
      } else {
        currentNode = nodeAtPoint(mouseX, mouseY);
      }
      break;
  }
}

function mouseReleased() {
  switch (mode) {
    case "drag-node":
      mode = "select";
      currentNode = null;
      break;
    case "create-edge":
      const selected = nodeAtPoint(mouseX, mouseY);
      if (selected) {
        const edge = new Edge(currentNode, selected);
        edges.push(edge);
      }
      mode = "select";
      currentNode = null;
      break;
  }
}

function doubleClicked() {
  switch (mode) {
    case "select":
      playNode();
      break;
  }
}
