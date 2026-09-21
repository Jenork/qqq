export function gameplayPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; right: number; width: number; height: number },
  width: number,
  height: number,
  rotated: boolean,
) {
  // Invert the single gameplay root's clockwise rotation before interpreting input.
  return rotated
    ? { x: (clientY - rect.top) * width / rect.height, y: (rect.right - clientX) * height / rect.width }
    : { x: (clientX - rect.left) * width / rect.width, y: (clientY - rect.top) * height / rect.height }
}

export function joystickVector(x: number, y: number, radius: number) {
  const distance = Math.hypot(x, y)
  const scale = distance > radius ? radius / distance : 1
  return { x: x * scale, y: y * scale }
}
