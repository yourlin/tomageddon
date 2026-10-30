/** Face voluntary travel, retaining the last side during vertical motion.
 * Target facing is only appropriate when stationary; knockback is not a gait.
 */
export function motionFacing(vx: number, vy: number, stationaryFacing = 0): number {
  const speed = Math.hypot(vx, vy);
  if (speed < 0.01) return stationaryFacing;
  return Math.abs(vx) > Math.max(0.01, speed * 0.05) ? Math.sign(vx) : 0;
}
