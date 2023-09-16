const SPEED = 2;
const nodes = [];
const edges = [];
let monoSynth;


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
    this.position = {x, y};
    this.monoSynth = new p5.MonoSynth();
    this.note = note;
    this.mode = mode;
    // this.monoSynth.setADSR(0, 0.0001, 0, 0);

  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  draw() {
    noFill();
    stroke(255);
    fill(255, this.excitement * 255);
    this.excitement *= 0.9;
    ellipse(this.position.x, this.position.y, 10, 10);
  }

  fire() {
    this.monoSynth.play(this.note, 1, 0, 0.01);

    if (this.mode == 'multicast') {
      for (const edge of this.edges) {
        edge.addSignal();
      }
    } else if (this.mode == 'roundrobin') {
      this.edges[this.previousEdge].addSignal();
      this.previousEdge = (this.previousEdge + 1) % this.edges.length;
    }
    this.excitement = 1;
  }
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

  for (const edge of edges) {
    edge.draw();
  }

  for (const node of nodes) {
    node.draw();
  }
}

function mousePressed() {
  userStartAudio();
  nodes[0].fire();
}