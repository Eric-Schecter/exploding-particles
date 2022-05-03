uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform vec2 uResolution;
uniform float uTime;
uniform float uProgress;

varying vec2 vUv;

void main(){
  vec4 color1=texture2D(uTexture1,vUv);
  vec4 color2=texture2D(uTexture2,vUv);
  vec4 color=mix(color1,color2,uProgress);
  if(color.r<.1&&color.g<.1&&color.b<.1){
    discard;
  }
  gl_FragColor=color;
}