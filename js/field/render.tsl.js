/* Instanced point-sprite rendering (PLAN §5.3) — size ∝ clamp(speed),
   color mix(ink, kleinLive, speed): motion is charge, the only color logic. */

import * as THREE from "three/webgpu";
import { float, uniform, vec3, vec4, mix, clamp, length } from "three/tsl";

export function createRenderMesh(N, sim, { mobile }) {
  const uInk = uniform(new THREE.Color("#10131A"));
  const uLive = uniform(new THREE.Color("#2743FF"));
  const uSize = uniform(mobile ? 0.0042 : 0.0052);

  const material = new THREE.SpriteNodeMaterial({ depthWrite: false, depthTest: false });
  const posC = sim.positions.toAttribute(); // vec4: xyz position, w focus charge (§2.4)
  material.positionNode = posC.xyz;

  const speed = length(sim.velocities.toAttribute());
  const charge = clamp(speed.mul(1.9).add(posC.w), 0, 1);

  material.colorNode = vec4(mix(vec3(uInk), vec3(uLive), charge), float(0.40).add(charge.mul(0.45)));
  material.scaleNode = uSize.mul(float(0.75).add(charge.mul(0.5)));
  material.transparent = true;

  const mesh = new THREE.Sprite(material);
  mesh.count = N;
  mesh.frustumCulled = false;

  return { mesh, uniforms: { uInk, uLive, uSize } };
}
