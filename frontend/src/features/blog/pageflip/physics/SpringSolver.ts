export class SpringSolver {
  public position = 0;
  public velocity = 0;
  public target = 0;

  constructor(
    private mass = 1.0,
    private stiffness = 140.0, // spring k constant
    private damping = 16.0     // friction coefficient
  ) {}

  public reset(pos: number, target: number) {
    this.position = pos;
    this.target = target;
    this.velocity = 0;
  }

  public step(dt: number) {
    // Prevent time step explosions on frame drops
    const delta = Math.min(dt, 0.032);
    
    // F = -k*x - c*v
    const displacement = this.position - this.target;
    const springForce = -this.stiffness * displacement;
    const dampingForce = -this.damping * this.velocity;
    const acceleration = (springForce + dampingForce) / this.mass;

    this.velocity += acceleration * delta;
    this.position += this.velocity * delta;

    // Check if settled
    if (Math.abs(this.position - this.target) < 0.0002 && Math.abs(this.velocity) < 0.002) {
      this.position = this.target;
      this.velocity = 0;
    }
  }

  public isSettled(): boolean {
    return this.position === this.target && this.velocity === 0;
  }
}
