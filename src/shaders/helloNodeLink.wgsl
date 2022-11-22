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

const size = 0.5;

@vertex
fn main_node_vert(
  @location(0) quadPos : vec2<f32>,
  @location(1) npos : vec3<f32>,
  @location(2) color : vec3<f32>,
) -> VertexOutput {
  var output : VertexOutput;
  var right = cross(uniforms.cameraDirection, vec3(0,1,0)); //camera x world up
  var up = cross(right, uniforms.cameraDirection); // camera up
  let wordPos = npos + size * (right * quadPos.x + up * quadPos.y);
  output.Position = uniforms.viewProjectionMatrix * vec4(wordPos, 1.0);
  // var normal = vec3(quadPos, sqrt(1 - dot(quadPos, quadPos)));
  output.color = color;
  output.quadPos = quadPos;
  return output;
}


@fragment
fn main_node_frag(
  @location(0) color : vec3<f32>,
  @location(1) quadPos : vec2<f32>,
) -> @location(0) vec4<f32> {
  var l = 1 - dot(quadPos, quadPos);
  var r : f32 = sign(l);
  if(r < 0) { discard; }
  return vec4<f32>(color * sqrt(l), 1);
}

/// Links

const linkWidth = 0.1;


@group(0) @binding(1) var<storage> nodes : array<f32>;
@vertex
fn main_link_vert(
  @location(0) quadPos : vec2<f32>,
  @location(1) link : vec2<u32>,
  @builtin(instance_index) i_index : u32,
) -> VertexOutput {
  var output : VertexOutput;
  let i0 = link.x * 3;
  let i1 = link.y * 3;
  let node0 = vec3(nodes[i0], nodes[i0+1], nodes[i0+2]);
  let node1 = vec3(nodes[i1], nodes[i1+1], nodes[i1+2]);

  var normal = cross(uniforms.cameraDirection, node0 - node1); 
  normal = normalize(normal);

  let lineVec = node1 - node0;
  let lineDir = normalize(lineVec);


  let d_cos = dot(lineDir, uniforms.cameraDirection);
  let d_sin = sqrt(1-d_cos*d_cos);
  let offset = min(abs(size/d_sin*d_cos), size); 


  let wordPos = 
      node0 + (lineVec) * (quadPos.y + 1)/2 // Pos at the line axis
      + normal * linkWidth * quadPos.x // Pos at the width axis
      + uniforms.cameraDirection * offset // move back lines basing on node size, to let lines behind linked node
      ;
  output.Position = uniforms.viewProjectionMatrix * vec4(wordPos, 1.0);
  //output.Position = vec4(quadPos*0.1+0.25*vec2(f32(i_index),nodes[i_index+6]),0,1);//debug
  output.color = vec3(1,1,1);
  output.quadPos = quadPos;
  return output;
}


@fragment
fn main_link_frag(
  @location(0) color : vec3<f32>,
  @location(1) quadPos : vec2<f32>,
) -> @location(0) vec4<f32> {

  return vec4<f32>(color , 1);
}