/*

----  KNOWN BUGS ----
o   Balls will not rest on top of each other
o   Collisions do not work properly when firing a small ball dwonwards onto a large, stationary balls
o   Momentum is not conserved - large, fast masses turn around when colliding with small, light masses
o   Some balls are very similar to background colour
o   Very unstable for large number of grounded balls

*/

// Set variables to control room size and ground depth
var xbound = 600;
var ybound = 600;
var groundDepth = 30;

// For force directions
var down;

//For creation of balls
var sizeofnew=0;
var mouseposb;

// Control global variables
var friction = 0.1;

var elasticityFloor = 0.6;
var elasticityWalls = 0.75;
var restitution = 0.5;

// Control ball variables
var initialWidth1 = 200;
var initialHeight1 = 550;
var initialVelX1 = -24;
var initialVelY1 = 0;
var accelX1 = 0;
var accelY1 = 0.75;
var diameter1 = 40;

var initialWidth2 = 400;
var initialHeight2 = 550;
var initialVelX2 = 12;
var initialVelY2 = 0;
var accelX2 = 0;
var accelY2 = 0.75;
var diameter2 = 40;

// Initialise control for balls
var ctrl;

function setup() {
  // put setup code here
  createCanvas(xbound, ybound);
  down = createVector(0,1);
	ctrl = new BallControl();
}

var Ball = function(position, velocity, acceleration, diameter) {
  this.start = position.copy();
  this.pos = position.copy();
	this.vel = velocity.copy();
	this.acc = acceleration.copy();
  this.accSaved = acceleration.copy();
  this.mass = diameter/40;
	this.d = diameter;
  this.bounceFloor = false;
  this.onFloor = false;
  this.bounceWall = false;
  this.floorDist = ybound - groundDepth - this.d/2 - this.start.y;
  this.initialKinetic = 0.5 * this.mass * (this.vel.y)^2;
  this.maxEnergy = (this.mass * this.acc.y * this.floorDist) + this.initialKinetic;
  this.termVel = Math.sqrt(((2 * this.acc.y * this.floorDist) + (2 * this.initialKinetic))/this.mass);
  this.collided = false;
  this.cr = random(1,255);
  this.cg = random(1,255);
  this.cb = random(1,255);
  this.momentum = this.vel.mag() * this.mass;
}

// Occurs when ball reaches peak of arc: update new GPE and terminal velocity
Ball.prototype.stationaryPoint = function() {
    this.vel.y = 0;
    this.floorDist = ybound - groundDepth - this.d/2 - this.pos.y;
    this.maxEnergy = this.mass * this.acc.y * this.floorDist;
    this.termVel = Math.sqrt(2 * this.acc.y * this.floorDist);
}

Ball.prototype.display = function() {
  fill(this.cr,this.cg,this.cb);
  //if (this.acc.y == 0) fill(255,0,0);
	noStroke();
	ellipse(this.pos.x, this.pos.y, this.d, this.d);
}

Ball.prototype.update = function() {
  this.acc.y = this.accSaved.y;
  this.onFloor = false;
  // Detect border collisions
  if (this.bounceFloor) {
    this.vel.y = this.vel.y * -1 * elasticityFloor; // elasticity constant of ball and floor (between 0 and 1)
    this.vel.x = this.vel.x * (1-friction); // NOT SURE
    this.bounceFloor = false;
  }
  if (this.bounceWall) {
    this.vel.x = this.vel.x * -1 * elasticityWalls; // elasticity constant of ball and walls (between 0 and 1)
    this.bounceWall = false;
  }
  // Sort out y velocity
  if (this.vel.y == 0 || (this.vel.y < 0 && this.vel.y + this.acc.y > 0)) this.stationaryPoint(); // detect stationary points
  this.pos.add(this.vel);
  if (Math.abs(this.vel.y + this.acc.y) >= this.termVel) {
    this.vel.y = this.termVel * (this.vel.y/Math.abs(this.vel.y));
    this.acc.y = 0;
  }
  this.vel.y += this.acc.y;
  // Sort out x velocity
  if (this.pos.y == ybound-groundDepth-this.d/2) this.onFloor = true;
  if (this.onFloor) this.vel.x = this.vel.x * (1-friction); // coefficient of friction (between 0 and 1)
}

Ball.prototype.checkFloor = function() {
	if (this.pos.y >= ybound-groundDepth-this.d/2) {
    this.pos.y = ybound-groundDepth-this.d/2;
    this.bounceFloor = true;
  }
}

Ball.prototype.checkWalls = function() {
	if (this.pos.x <= this.d/2) {
    this.pos.x = this.d/2;
    this.bounceWall = true;
  }
  if (this.pos.x >= xbound-this.d/2) {
    this.pos.x = xbound-this.d/2;
    this.bounceWall = true;
  }
}

Ball.prototype.checkBall = function(b) {
  var thismassratio = this.mass/(b.mass + this.mass);
  var bmassratio = b.mass/(b.mass + this.mass);

  if (this.pos.dist(b.pos)<this.d/2+b.d/2) {
    this.collided = true;
    b.collided = true;
    var oldxvel = this.vel.x;
    var oldyvel = this.vel.y;
    var bStationary;
    if (b.onFloor) bStationary = true;
    else bStationary = false;
    var normal = createVector(this.pos.x - b.pos.x, this.pos.y - b.pos.y);
    var theta = normal.angleBetween(down);
    b.vel.y = restitution * (this.mass * this.accSaved.y * (realcos(theta)^2) - (this.mass * this.accSaved.y * realcos(theta) * realsin(theta)));
    if (b.onFloor) b.vel.y = Math.floor(b.vel.y);
    if (this.pos.y > b.pos.y) b.vel.y *= -1;
    b.vel.x = restitution * (this.mass * this.accSaved.y * (realsin(theta)^2) + (this.mass * this.accSaved.y * realcos(theta) * realsin(theta)));
    if (this.pos.x > b.pos.x) b.vel.x *= -1;

    this.vel.y = restitution * (b.mass * b.accSaved.y * (realcos(theta)^2) - (b.mass * b.accSaved.y * realcos(theta) * realsin(theta)));
    if (bStationary && Math.abs(this.vel.y) > Math.abs(oldyvel) && oldyvel != 0) this.vel.y = Math.abs(oldyvel*restitution) * (this.vel.y/Math.abs(this.vel.y));
    if (this.onFloor) this.vel.y = Math.floor(this.vel.y);
    if (b.pos.y > this.pos.y) this.vel.y *= -1;
    this.vel.x = restitution * (b.mass * b.accSaved.y * (realsin(theta)^2) + (b.mass * b.accSaved.y * realcos(theta) * realsin(theta)));
    if (bStationary && Math.abs(this.vel.x) > Math.abs(oldxvel) && oldxvel != 0) this.vel.x = Math.abs(oldxvel*restitution) * (this.vel.x/Math.abs(this.vel.x));
    if (b.pos.x > this.pos.x) this.vel.x *= -1;

    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    b.pos.x += b.vel.x;
    b.pos.y += b.vel.y;
  }
}

Ball.prototype.run = function() {
  this.update();
  for (var i = 0; i < ctrl.balls.length; i++) {
    //print("Ball", i);
    if (this.collided) continue;
    var b = ctrl.balls[i];
    if (b.pos.equals(this.pos)) continue;
    else this.checkBall(b);
  }
	this.checkFloor();
  this.checkWalls();
  this.display();
  this.collided = false;
}

var BallControl = function() {
	this.balls = [new Ball(createVector(initialWidth1,ybound-initialHeight1), createVector(initialVelX1,initialVelY1), createVector(accelX1,accelY1), diameter1),
                new Ball(createVector(initialWidth2,ybound-initialHeight2), createVector(initialVelX2,initialVelY2), createVector(accelX2,accelY2), diameter2)];
}

BallControl.prototype.addBall = function(ball) {
	this.balls.push(ball);
}

BallControl.prototype.run = function() {
	for (var i = 0; i < this.balls.length; i++) {
		var b = this.balls[i];
		b.run();
	}
}

function draw() {
  // put drawing code here
  background(135,206,250);
	stroke(40);
  strokeWeight(groundDepth);
  line(0,ybound-groundDepth/2,xbound,ybound-groundDepth/2);
  ctrl.run();

  // Sam's stuff: don't touch

  if(mouseIsPressed){
    sizeofnew++;
    //print(sizeofnew);
    fill(255);
    ellipse(mouseposb.x, mouseposb.y, sizeofnew);
    stroke(255);
    strokeWeight(1);
    line(mouseposb.x, mouseposb.y, mouseX, mouseY);
  }
  if(sizeofnew!=0 && !mouseIsPressed){
    mouseposa = createVector(mouseX, mouseY); //After mouse pos
    xdiff = mouseposb.x - mouseposa.x;
    ydiff = mouseposb.y - mouseposa.y;
    diffvec = createVector(xdiff, ydiff);

    magn = mouseposb.dist(mouseposa); //Euclidean distance between the initial mouse pos, and final mouse pos
    ang = diffvec.angleBetween(createVector(0,1));


    newball = new Ball(mouseposb, diffvec.mult(.1), createVector(0,accelY1), sizeofnew);
    ctrl.balls.push(newball);

    sizeofnew=0;
  }
}

function mousePressed(){
  //Find pos of mouse
  mousexpos = mouseX; //Have to recreate vars cause of java referencing :(
  mouseypos = mouseY;
  mouseposb = createVector(mousexpos, mouseypos); //Initial mouse pos
}

function realsin(x) {
  if (x == 0 || x == Math.PI || x == 2 * Math.PI) return 0;
  else if (x == Math.PI/2) return 1;
  else if (x == 3*Math.PI/2) return -1;
  else return Math.sin(x);
}

function realcos(x) {
  if (x == 0 || x == 2 * Math.PI) return 1;
  else if (x == Math.PI/2 || x == 3*Math.PI/2) return 0;
  else if (x == Math.PI) return -1;
  else return Math.cos(x);
}
