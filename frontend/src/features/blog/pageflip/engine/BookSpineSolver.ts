export class BookSpineSolver {
  /**
   * Calculates the spine horizontal offset based on progress to keep the book centered.
   * @param t Progress value [0.0, 1.0]
   * @param direction 'next' or 'prev'
   */
  public static getSpineOffsetX(t: number, direction: 'next' | 'prev'): number {
    const spineOffset = direction === 'next' ? 0.38 : -0.38;
    return spineOffset * (1.0 - t);
  }
}
