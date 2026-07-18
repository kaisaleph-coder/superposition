/* Instanced point-sprite rendering (PLAN §5.3, recolored at I4) — size ∝ clamp(speed).
   Rest color: each particle's pale home-domain hue (static buffer — color is meaning);
   velocity/focus still charge toward one deeper accent. The field stays lighter than
   the text so copy always reads first. */

import * as THREE from "three/webgpu";
import { float, uniform, vec3, vec4, mix, clamp, length } from "three/tsl";

export function createRenderMesh(N, sim, { mobile }) {
  const uLive = uniform(new THREE.Color("#2743FF"));
  const uTone = uniform(1.0); // dark scheme brightens the pastels slightly
  const uSize = uniform(mobile ? 0.0042 : 0.0052);
  // collapsed-domain cast: rest colors lean toward the active domain's hue (I4);
  // 0 at home/record so the superposition stays the multi-hue self-portrait
  const uStateColor = uniform(new THREE.Color("#A9BDD6"));
  const uCast = uniform(0);

  const material = new THREE.SpriteNodeMaterial({ depthWrite: false, depthTest: false });
  const posC = sim.positions.toAttribute(); // vec4: xyz position, w focus charge (§2.4)
  material.positionNode = posC.xyz;

  const speed = length(sim.velocities.toAttribute());
  const charge = clamp(speed.mul(1.9).add(posC.w), 0, 1);
  const rest = mix(sim.colors.toAttribute(), vec3(uStateColor), uCast).mul(uTone);

  material.colorNode = vec4(mix(rest, vec3(uLive), charge), float(0.5).add(charge.mul(0.4)));
  material.scaleNode = uSize.mul(float(0.75).add(charge.mul(0.5)));
  material.transparent = true;

  const mesh = new THREE.Sprite(material);
  mesh.count = N;
  mesh.frustumCulled = false;

  return { mesh, uniforms: { uLive, uTone, uSize, uStateColor, uCast } };
}
