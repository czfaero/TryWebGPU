struct VSOut{
  @builtin(position) pos : vec4<f32>,
  @location(0) color : vec4<f32>
}

@vertex 
fn main_vert(
  @location(0) vPos :vec3<f32>,
  @location(1) color :vec3<f32>,
  @location(2) mPos : vec3<f32>
) 
  -> VSOut 
{
  var o : VSOut;
  o.pos = vec4<f32>(vPos.xyz * 0.2 + mPos.xyz*0.5, 1.0);
  o.color = vec4<f32>(color, 1.0);
  return o;
}

@fragment
fn main_frag(@location(0) color : vec4<f32>) 
  -> @location(0) vec4<f32> {
  return  vec4<f32>(color);
}