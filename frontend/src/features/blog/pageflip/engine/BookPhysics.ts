export class BookPhysics {
  public position = 0;
  public velocity = 0;
  public target = 0;

  constructor(
    private mass = 1.0,
    private stiffness = 120.0 // k constant
  ) {}

  public reset(pos: number, target: number) {
    this.position = pos;
    this.target = target;
    this.velocity = 0;
  }

  public step(dt: number) {
    // Prevent time step explosions on frame drops
    const delta = Math.min(dt, 0.032);

    // Critically damped friction: c = 2 * sqrt(k * m)
    const damping = 2.0 * Math.sqrt(this.stiffness * this.mass);

    // Forces calculation: F = -k*x - c*v
    const displacement = this.position - this.target;
    const springForce = -this.stiffness * displacement;
    const dampingForce = -damping * this.velocity;
    const acceleration = (springForce + dampingForce) / this.mass;

    this.velocity += acceleration * delta;
    this.position += this.velocity * delta;

    // Check if settled to prevent tiny continuous oscillation ticks
    if (Math.abs(this.position - this.target) < 0.0001 && Math.abs(this.velocity) < 0.001) {
      this.position = this.target;
      this.velocity = 0;
    }
  }

  public isSettled(): boolean {
    return this.position === this.target && this.velocity === 0;
  }
}
