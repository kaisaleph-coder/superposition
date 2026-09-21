/* S4 contract test: execute multi-surface builders without a GPU using a tiny Three-compatible mock. */
import { createSurfaceScene } from '../js/field/v2/surface-scene.js';
import { compileRecipe } from '../js/field/v2/recipe-compiler.js';

class Obj {
  constructor(){this.children=[];this.userData={};this.rotation={x:0,y:0,z:0};this.scale={setScalar(v){this.value=v}};this.parent=null;}
  add(o){this.children.push(o);o.parent=this;}
  remove(o){this.children=this.children.filter(x=>x!==o);o.parent=null;}
  traverse(fn){fn(this);for(const c of this.children)c.traverse?c.traverse(fn):fn(c)}
  removeFromParent(){this.parent?.remove(this)}
}
class Group extends Obj{}
class BufferGeometry {constructor(){this.attrs={};this.index=null;this.disposed=false}setAttribute(k,v){this.attrs[k]=v}setIndex(v){this.index=v}computeVertexNormals(){}dispose(){this.disposed=true}}
class Float32BufferAttribute {constructor(array,size){this.array=array;this.itemSize=size}}
class Mat {constructor(o){Object.assign(this,o)}dispose(){this.disposed=true}}
class LineBasicMaterial extends Mat{}; class MeshBasicMaterial extends Mat{};
class GeometryObj extends Obj {constructor(g,m){super();this.geometry=g;this.material=m;this.frustumCulled=true}}
class Line extends GeometryObj{};class LineSegments extends GeometryObj{};class Mesh extends GeometryObj{}
class Color {constructor(v){this.value=v}}
const THREE={Group,BufferGeometry,Float32BufferAttribute,LineBasicMaterial,MeshBasicMaterial,Line,LineSegments,Mesh,Color,DoubleSide:2,AdditiveBlending:2,NormalBlending:1};

const domains=['home','finance','restaurant','construction','investor','entrepreneur','ai','skills','hobbies'];
const results=[];
for(const backend of ['webgpu','webgl']) for(const mobile of [false,true]){
  for(const domain of domains){
    const recipe=compileRecipe(domain,0,271828);
    const scene=createSurfaceScene(THREE,{backend,mobile});
    const out=scene.applyRecipe(recipe);
    scene.update(1.25,{x:.2,y:-.1});
    const bad=[];
    scene.root.traverse(o=>{
      const a=o.geometry?.attrs?.position?.array;
      if(a && [...a].some(v=>!Number.isFinite(v))) bad.push('non-finite-position');
    });
    if(bad.length) throw new Error(`${backend}/${mobile}/${domain}: ${bad}`);
    results.push({backend,mobile,domain,recipeLayers:recipe.layers.length,surfaceLayers:out.layers,primitiveCount:out.primitiveCount,signature:recipe.signature});
    scene.dispose();
  }
}
console.log(JSON.stringify(results,null,2));
