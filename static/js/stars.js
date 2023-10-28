const fMath = new FMath();
const PI = Math.PI;
const TAU = 2 * PI;
const cos = n => fMath.cos(n);
const sin = n => fMath.sin(n);
const rand = n => n * Math.random();

class VectorArrayObject {
  constructor({count = 0, max = 0}) {
    this.count = count;
    this.max = max;
    this.values = new Float32Array(max * 2);
  }
  get(i) {
    return new Vector2(
      this.values[i * 2],
      this.values[i * 2 + 1]
    );
  }
  getX(i) {
    return this.values[i * 2];
  }
  getY(i) {
    return this.values[i * 2 + 1];
  }
  set(i, x, y) {
    this.values[i * 2] = x;
    this.values[i * 2 + 1] = y;
    return this;
  }
  setX(i, x) {
    this.values[i * 2] = x;
    return this;
  }
  setY(i, y) {
    this.values[i * 2 + 1] = y;
    return this;
  }
}

class VectorArrayObjectController {
  constructor({count, max}) {
    this.count = count || max || 0;
    this.max = max || 0;
    this.life = new VectorArrayObject({count, max});
    this.vertices = new VectorArrayObject({count, max});
    this.velocities = new VectorArrayObject({count, max});
  }
  getLife(i) {
    return this.life.getX(i);
  }
  getTTL(i) {
    return this.life.getY(i);
  }
  setLife(i, life) {
    this.life.setX(i, life);
    return this;
  }
  setTTL(i, ttl) {
    this.life.setY(i, ttl);
    return this;
  }
  getVertex(i) {
    return this.vertices.get(i);
  }
  setVertex(i, x, y) {
    this.vertices.set(i, x, y);
    return this;
  }
  getVelocity(i) {
    return this.velocities.get(i);
  }
  setVelocity(i, x, y) {
    this.velocities.set(i, x, y);
    return this;
  }
}

class RenderObject {
  constructor(x, y) {
    this.position = new Vector2(x, y);
    this.lastPosition = this.position.clone();
    this.velocity = new Vector2();
    this.renderProps = {};
  }
  getPosition() {
    return this.position.clone();
  }
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
    return this;
  }
  setLastPosition() {
    this.lastPosition.x = this.position.x;
    this.lastPosition.y = this.position.y;
    return this;
  }
  getVelocity() {
    return this.velocity.clone();
  }
  setVelocity(x, y) {
    this.velocity.x = x;
    this.velocity.y = y;
    return this;
  }
  getLife() {
    return this.life;
  }
  setLife(n) {
    this.life = n;
    return this;
  }
  render(buffer) {
    for (let prop in this.renderProps) {
      buffer[prop](this.renderProps[prop]);
    }
  }
}

class Canvas {
  constructor(selector) {
    this.element =
      document.querySelector(selector) ||
      (() => {
        let element = document.createElement("canvas");
        element.style = `   position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            z-index: -1;
                            background-repeat: no-repeat;
                            background-attachment: scroll;`;
        document.body.appendChild(element);
        return element;
      })();
    this.ctx = this.element.getContext("2d");
    this.frame = document.createElement("canvas");
    this.buffer = this.frame.getContext("2d");
    this.dimensions = {
      x: 0,
      y: 0
    };
    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
  }
  resize() {
    this.element.width = this.frame.width = this.dimensions.x = window.innerWidth;
    this.element.height = this.frame.height = this.dimensions.y = window.innerHeight;
  }
  fill(c = "green") {
    this.buffer.fillStyle = c;
    this.buffer.fillRect(0, 0, this.dimensions.x, this.dimensions.y);
  }
  clear() {
    this.ctx.clearRect(0, 0, this.dimensions.x, this.dimensions.y);
    this.buffer.clearRect(0, 0, this.dimensions.x, this.dimensions.y);
  }
  clearAt({
    x1 = 0,
    y1 = 0, 
    x2 = 0, 
    y2 = 0
  }) {
    this.ctx.clearRect(x1, y1, x2, y2);
    this.buffer.clearRect(x1, y1, x2, y2);
  }
  line({
    x1 = 0, 
    y1 = 0,
    x2 = 0, 
    y2 = 0, 
    w = 0, 
    lc = "square", 
    c = "green"
  }) {
    this.buffer.beginPath();
    this.buffer.lineCap = lc;
    this.buffer.strokeStyle = c;
    this.buffer.lineWidth = w;
    this.buffer.moveTo(x1, y1);
    this.buffer.lineTo(x2, y2);
    this.buffer.stroke();
    this.buffer.closePath();
  }
  rect({
    x = 0, 
    y = 0, 
    w = 0, 
    h = 0, 
    c = "green"
  }) {
    this.buffer.fillStyle = c;
    this.buffer.fillRect(x, y, w, h);
  }
  arc({
    x = 0, 
    y = 0, 
    r = 0, 
    s = 0, 
    e = 0, 
    c = "green"
  }) {
    this.buffer.beginPath();
    this.buffer.fillStyle = c;
    this.buffer.arc(x, y, r, s, e);
    this.buffer.fill();
    this.buffer.closePath();
  }
  rectLine({
    x = 0, 
    y = 0, 
    w = 0, 
    h = 0, 
    c = "green"
  }) {
    this.buffer.strokeStyle = c;
    this.buffer.strokeRect(x, y, w, h);
  }
  arcLine({
    x = 0, 
    y = 0, 
    r = 0, 
    s = 0, 
    e = 0, 
    c= "green"
  }) {
    this.buffer.beginPath();
    this.buffer.strokeStyle = c;
    this.buffer.arc(x, y, r, s, e);
    this.buffer.stroke();
    this.buffer.closePath();
  }
  drawImage({
    image,
    x = 0, 
    y = 0
  }) {
    this.buffer.drawImage(image, x, y);
  }
  render() {
    this.ctx.drawImage(this.frame, 0, 0);
  }
}

class Star extends RenderObject {
  constructor(x, y) {
    super();
    this.size = 0.5;
    this.renderProps = {
      line: {
        x1: this.lastPosition.x,
        y1: this.lastPosition.y,
        x2: this.position.x,
        y2: this.position.y,
        w: this.size,
        lc: "round",
        c: ''
      }
    };
  }
  setHue(hue) {
    this.hue = hue;
    return this;
  }
  setSize(size) {
    this.size = size;
    return this;
  }
  update() {
    this.setLastPosition();
    this.position.add(this.velocity);
    this.renderProps = {
      line: {
        x1: this.lastPosition.x,
        y1: this.lastPosition.y,
        x2: this.position.x,
        y2: this.position.y,
        w: this.size,
        lc: "round",
        c: `hsla(${this.hue},50%,85%,1)`
      }
    };
    return this;
  }
}

class StarField extends VectorArrayObjectController {
  constructor({count, max}) {
    super({count, max});
    this.renderProps = {
      background: {
        fill: 'rgba(20,20,20,1)'
      }
    };
    this.bounds = new Vector2(0, 0);
    this.center = new Vector2(0, 0);
    this.background = new Canvas();
    this.foreground = new Canvas();
    this.canvas = new Canvas();
    this.hues = new Float32Array(this.count).map(() => rand(360));
    this.sizes = new Float32Array(this.count).fill(1);
    this.resize();
    this.create();
    window.addEventListener("resize", this.resize.bind(this));
  }
  resize() {
    this.bounds.x = window.innerWidth;
    this.bounds.y = window.innerHeight;
    this.center.x = 0.5 * this.bounds.x;
    this.center.y = 0.5 * this.bounds.y;
  }
  create() {
    this.renderTarget = new Star();
    for (let i = 0; i < this.count; i++) {    
      this.initRenderTarget(i);
    }
  }
  initRenderTarget(i) {
    let theta,
        x,
        y,
        vX,
        vY;
    x = rand(this.bounds.x);
    y = rand(this.bounds.y);
    theta = this.center.angleTo({x, y});
    vX = cos(theta);
    vY = sin(theta);
    
    this.renderTarget.setPosition(x, y)
      .setLastPosition(x, y)
      .setVelocity(vX, vY)
      .setSize(0.5);
    
    this.setVertex(i, x, y)
      .setVelocity(i, vX, vY)
      .setSize(i, 0.5);
  } 
  setSize(i, size) {
    this.sizes[i] = size;
    return this;
  }
  update() {
    for (let i = 0; i < this.count; i++) {
      this.sizes[i] *= 1.025;             
      this.renderTarget
        .setPosition(this.vertices.getX(i), this.vertices.getY(i))
        .setVelocity(this.velocities.getX(i) * 1.05, this.velocities.getY(i) * 1.05)
        .setHue(this.hues[i])
        .setSize(this.sizes[i])
        .update()
        .render(this.foreground);
      
      this
        .checkBounds(i)
        .setVertex(i, this.renderTarget.position.x, this.renderTarget.position.y)
        .setVelocity(i, this.renderTarget.velocity.x, this.renderTarget.velocity.y);
    }
  }
  checkBounds(i) {
    if (
      this.renderTarget.position.x > this.bounds.x ||
      this.renderTarget.position.x < 0 ||
      this.renderTarget.position.y > this.bounds.y ||
      this.renderTarget.position.y < 0
    ) {
      this.initRenderTarget(i);
    }
    return this;
  }
  render() {
    this.foreground.clear();
    this.foreground.buffer.globalCompositeOperation = "lighter";
    this.update();
    this.background.fill("rgba(0,0,0,0.5)");
    this.background.buffer.save();
    this.background.buffer.globalCompositeOperation = "lighter";
    this.background.buffer.filter = "blur(4px)";
    this.background.drawImage({
      image: this.foreground.frame,
      x: 0,
      y: 0
    });
    this.background.buffer.restore();
    this.background.render();
    this.foreground.render();
  }
}

let starField = new StarField({
  count: 500,
  max: 1000,
  bounds: {
    x: window.innerWidth,
    y: window.innerHeight
  }
});

function loop() {
  starField.render();
  window.requestAnimationFrame(loop);
}

window.addEventListener("load", loop);