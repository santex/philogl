attribute float indices;

varying vec4 vPosition;
varying float depth;
varying vec3 position;
varying float idx;

uniform sampler2D sampler1, sampler2, sampler3, sampler4;

uniform float multiple, near, far, platform;
uniform vec3 cameraPosition;
uniform mat4 objectMatrix, viewMatrix, worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewProjectionMatrix;
varying vec2 vTexCoord;
varying vec4 color;

uniform float devicePixelRatio;
#include "3d.glsl"

void main(void) {
  idx = indices;
  vec4 samp = texture2D(sampler2, vec2(mod(indices, 256.0) / 256.0, floor(indices / 256.0) /256.0));
  position = samp.xyz * 2. - 1.;
//  vec3 vel = getAA(sampler1, position) + 1.;
  float life = samp.w;
  color = vec4(1, 1, 1.1, 1);
  color.xyz *= smoothstep(0.3, 0.9, life);
  gl_Position = projectionMatrix * worldMatrix * vec4(position, 1);
  vPosition = gl_Position;
  float alpha = 1. - pow((1. - life), .5);
  gl_PointSize = devicePixelRatio * 40. / (gl_Position.z + 1.) * (max(0.5, alpha)); 
  depth = (gl_Position.z  - 2.)/ 5.;
  if (depth < near || far <= depth) {
    gl_PointSize = 0.;
    color = vec4(0.);
  }
  color.a *= alpha * alpha;
  vTexCoord = vec2(0);
}
