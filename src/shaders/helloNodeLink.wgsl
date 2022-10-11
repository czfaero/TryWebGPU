struct Uniforms {
  viewProjectionMatrix : mat4x4<f32>
}
struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>
}

@binding(0) @group(0) var<uniform> uniforms : Uniforms;

@vertex
fn main_node_vert(
  @location(0) vpos : vec3<f32>,
  @location(1) npos : vec3<f32>,
  @location(2) color : vec3<f32>,
) -> VertexOutput {
  var output : VertexOutput;
  output.Position = uniforms.viewProjectionMatrix * vec4(vpos + npos, 1.0);
  output.color = vec4(color, 1.0);
  return output;
}


@fragment
fn main_frag(@location(0) color : vec4<f32>) 
  -> @location(0) vec4<f32> {
  return  vec4<f32>(color);
}