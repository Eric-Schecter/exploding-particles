#pragma glslify:curlNoise=require(glsl-curl-noise)

uniform float uTime;
uniform float uDistortion;

varying vec2 vUv;

void main(){
  vUv=uv;
  
  vec3 distortion=vec3(position.x*2.,position.y,1.) * 
  curlNoise(vec3(position.x * 0.002+uTime* 0.1,position.y* 0.008+uTime* 0.1,(position.x+position.y)* 0.02))* 
  uDistortion;
  
  vec3 pos=position+distortion;
  vec4 mvPosition=modelViewMatrix*vec4(pos,1.);
  gl_PointSize=2.;
  gl_Position=projectionMatrix*mvPosition;
}