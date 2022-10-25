struct Uniforms {
  viewProjectionMatrix : mat4x4<f32>,
  cameraDirection: vec3<f32>
}
struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec3<f32>,
  @location(1) quadPos : vec2<f32>,
}

@binding(0) @group(0) var<uniform> uniforms : Uniforms;

@vertex
fn main_node_vert(
  @location(0) quadPos : vec2<f32>,
  @location(1) npos : vec3<f32>,
  @location(2) color : vec3<f32>,
) -> VertexOutput {
  var output : VertexOutput;
  var right = cross(uniforms.cameraDirection, vec3(0,1,0)); //camera x world up
  var up = cross(right, uniforms.cameraDirection); // camera up
  let wordPos=npos + right * quadPos.x + up * quadPos.y;
  output.Position = uniforms.viewProjectionMatrix * vec4(wordPos, 1.0);
  output.color = color;
  output.quadPos = quadPos;
  return output;
}


@fragment
fn main_frag(
  @location(0) color : vec3<f32>,
  @location(1) quadPos : vec2<f32>,
) -> @location(0) vec4<f32> {
  var r : f32 = max(1 - length(quadPos), 0);
  return vec4<f32>(color,r);
}