import test from "node:test";
import assert from "node:assert/strict";
import { adaptTier, downshift, isSoftwareRendererName } from "../js/field/tier.js";

test("software renderer names are recognized", () => {
  for (const name of [
    "Google SwiftShader",
    "ANGLE (Google, Vulkan 1.3 SwiftShader Device)",
    "llvmpipe (LLVM 18.1.8, 256 bits)",
    "Mesa Offscreen",
    "lavapipe",
    "Software Rasterizer",
  ]) assert.equal(isSoftwareRendererName(name), true, name);
  assert.equal(isSoftwareRendererName("NVIDIA GeForce RTX 4070 SUPER"), false);
  assert.equal(isSoftwareRendererName("AMD Radeon RX 7900 XTX"), false);
});

test("tier downshift preserves existing hardware ladder", () => {
  assert.equal(downshift(1), 2);
  assert.equal(downshift(2), 4);
  assert.equal(downshift(3), 4);
  assert.equal(downshift(4), 4);
  assert.equal(downshift(0), 0);
});

test("three sub-45fps samples downshift a hardware tier", () => {
  let state={tier:3,lowStreak:0};
  state=adaptTier({...state,fps:40});
  assert.deepEqual(state,{tier:3,lowStreak:1,staticFallback:false});
  state=adaptTier({...state,fps:40});
  assert.deepEqual(state,{tier:3,lowStreak:2,staticFallback:false});
  state=adaptTier({...state,fps:40});
  assert.deepEqual(state,{tier:4,lowStreak:0,staticFallback:false});
});

test("sustained unusable tier-4 performance becomes static", () => {
  let state=adaptTier({tier:4,fps:24,lowStreak:0});
  assert.deepEqual(state,{tier:4,lowStreak:1,staticFallback:false});
  state=adaptTier({tier:4,fps:24,lowStreak:state.lowStreak});
  assert.deepEqual(state,{tier:0,lowStreak:0,staticFallback:true});
});

test("healthy samples reset the low-fps streak", () => {
  assert.deepEqual(
    adaptTier({tier:4,fps:60,lowStreak:2}),
    {tier:4,lowStreak:0,staticFallback:false}
  );
});
