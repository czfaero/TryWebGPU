@group(0) @binding(0) var<storage, read_write> resultBuffer: array<f32>;

const PI = 3.14159265358979323846;
const inv4PI = 0.25/PI;

const eps = 1e-6;
fn any_compute(a : vec4<f32>, b : vec4<f32>) -> vec3f
{
  let dist = a.xyz - b.xyz;
  let invDist = inverseSqrt(dot(dist, dist) + eps); 
  let invDistCube = invDist * invDist * invDist;
  let s = b.w * invDistCube;
  return -s * inv4PI * dist;
}


@compute @workgroup_size(256, 1)
fn test(@builtin(workgroup_id) id : vec3<u32>) {
  let thread = id.x;
  for(var c = 0u; c<1000; c++){
    any_compute(vec4f(1,2,3,4),vec4f(1,2,3,4));
    if(thread==0){
    resultBuffer[c]+=1;
    }
  }
}