/* Pointer → world-space projection (PLAN §5.3/§2.5). Projects the cursor onto the
   camera-facing plane through the origin; touch drags behave like the pointer. */

import * as THREE from "three/webgpu";

export function createPointer(canvasHost) {
  const state = { x: 0, y: 0, active: 0, strength: 0, world: new THREE.Vector3() };
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const ndc = new THREE.Vector2();

  const set = (e) => {
    state.x = (e.clientX / innerWidth) * 2 - 1;
    state.y = -((e.clientY / innerHeight) * 2 - 1);
    state.active = 1;
  };
  const clear = () => { state.active = 0; };

  addEventListener("pointermove", set, { passive: true });
  addEventListener("pointerdown", set, { passive: true });
  addEventListener("pointerup", clear, { passive: true });
  canvasHost.ownerDocument.documentElement.addEventListener("pointerleave", clear);

  return {
    state,
    /* per-frame: ease strength, unproject onto the origin plane facing the camera */
    update(camera, dt) {
      state.strength += (state.active - state.strength) * Math.min(1, dt * 8);
      if (state.strength < 0.01) return;
      ndc.set(state.x, state.y);
      ray.setFromCamera(ndc, camera);
      plane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new THREE.Vector3()).negate(),
        new THREE.Vector3(0, 0, 0)
      );
      ray.ray.intersectPlane(plane, state.world);
    },
    dispose() {
      removeEventListener("pointermove", set);
      removeEventListener("pointerdown", set);
      removeEventListener("pointerup", clear);
      canvasHost.ownerDocument.documentElement.removeEventListener("pointerleave", clear);
    },
  };
}
