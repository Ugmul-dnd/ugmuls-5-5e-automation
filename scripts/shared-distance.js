// Shared token-footprint measurement in scene distance units.
// Callers own scene/visibility/range policy; elevation uses max(horizontal, vertical),
// not a Euclidean 3D calculation. Missing grid measurement returns Infinity.
export function tokenDistance(a,b){
 const size=a.parent.grid.size,point=t=>({x:t.x+size/2,y:t.y+size/2,w:Math.max(1,t.width??1),h:Math.max(1,t.height??1)}),s=point(a),t=point(b);
 const x=Math.max(s.x,Math.min(t.x,s.x+(s.w-1)*size)),y=Math.max(s.y,Math.min(t.y,s.y+(s.h-1)*size)),tx=Math.max(t.x,Math.min(x,t.x+(t.w-1)*size)),ty=Math.max(t.y,Math.min(y,t.y+(t.h-1)*size));
 // Use the first token's scene grid; the GM's active canvas may be elsewhere.
 const grid=a.parent.grid,activeGrid=globalThis.canvas?.scene?.id===a.parent.id?globalThis.canvas?.grid:null;
 const distance=(grid.measurePath?grid:activeGrid)?.measurePath?.([{x,y},{x:tx,y:ty}])?.distance;return Math.max(distance??Infinity,Math.abs(Number(a.elevation??0)-Number(b.elevation??0)));
}
