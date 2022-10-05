// for helloCompute.ts
struct Matrix {
  size : vec2<f32>,
  numbers: array<f32>,
}


@compute @workgroup_size(3, 4)
fn main_comp(@builtin(global_invocation_id) global_id : vec3<u32>) {


}

struct VSOut{
  @builtin(position) pos : vec4<f32>,
  @location(0) color : vec4<f32>
}

@vertex 
fn main_vert(
  @location(0) inPos :vec3<f32>,
  @location(1) color :vec3<f32>
) 
  -> VSOut 
{
  var o:VSOut;
  o.pos = vec4<f32>(inPos.xyz*0.5, 1.0);
  o.color = vec4<f32>(color, 1.0);
  return o;
}

@fragment
fn main_frag(@location(0) color : vec4<f32>) 
  -> @location(0) vec4<f32> {
  return  vec4<f32>(color);
}