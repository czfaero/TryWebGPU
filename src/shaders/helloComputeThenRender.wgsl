

@group(0) @binding(0) var<storage, read> src: array<f32>;
@group(0) @binding(1) var<storage, read_write> dst: array<f32>;

@compute @workgroup_size(3, 1)
fn main_comp(@builtin(global_invocation_id) tid : vec3<u32>) {
  const d = 1.0/60;
  var addr = tid.x * 3;
  var i:u32=0;
  for(;i<3;i++)
  {
    if(src[addr+i] == 0.0f 
       && src[addr+(i+1)%3] != 0.0f)
    {
      dst[addr+i] = 0.0f;
      var t = src[addr+(i+1)%3] - d;
      dst[addr+(i+1)%3] = select(t, 0.0f, t<d);
      dst[addr+(i+2)%3] = clamp(src[addr+(i+2)%3] + d, 0.0f, 1.0f);
      break;
    }
  }
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