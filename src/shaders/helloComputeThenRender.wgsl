// for helloCompute.ts
struct Matrix {
  size : vec2<f32>,
  numbers: array<f32>,
}

@group(0) @binding(0) var<storage, read> firstMatrix : Matrix;
@group(0) @binding(1) var<storage, read> secondMatrix : Matrix;
@group(0) @binding(2) var<storage, read_write> resultMatrix : Matrix;

// https://www.w3.org/TR/WGSL/#attribute-workgroup_size
// https://www.w3.org/TR/WGSL/#built-in-values-global_invocation_id

@compute @workgroup_size(8, 8)
fn main_comp(@builtin(global_invocation_id) global_id : vec3<u32>) {
  if (global_id.x >= u32(firstMatrix.size.x) || global_id.y >= u32(secondMatrix.size.y)) {
    return;
  }

  resultMatrix.size = vec2(firstMatrix.size.x, secondMatrix.size.y);

  let resultCell = vec2(global_id.x, global_id.y);
  var result = 0.0;
  for (var i = 0u; i < u32(firstMatrix.size.y); i = i + 1u) {
    let a = i + resultCell.x * u32(firstMatrix.size.y);
    let b = resultCell.y + i * u32(secondMatrix.size.y);
    result = result + firstMatrix.numbers[a] * secondMatrix.numbers[b];
  }

  let index = resultCell.y + resultCell.x * u32(secondMatrix.size.y);
  resultMatrix.numbers[index] = result;
}

@vertex
fn main_vert(
  @builtin(vertex_index) VertexIndex : u32
) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 0.5),
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5)
  );

  return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}

@fragment
fn main_frag() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}