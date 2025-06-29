precision highp float;
precision highp int;

uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec2 vUv2;

#define LOG_DEPTH
#define CUSTOM_NEAR_FAR


void main() {

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    // Model normal
    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

    vNormal = modelNormal;
    vUv = uv;
    // vUv2 = uv2;
    vPosition = modelPosition.xyz;

    #ifdef LOG_DEPTH
    #define m22 projectionMatrix[2][2]
    #define m32 projectionMatrix[3][2]
    
    float zn = m32 / (m22 - 1.0);
    float zf = m32 / (m22 + 1.0);
    
    #ifdef CUSTOM_NEAR_FAR
        zn = 0.1;
        zf = 15.0;
    #endif
    
    #undef m22
    #undef m32

    #define z gl_Position.z
    #define w gl_Position.w
        z = log2(z / zn) / log2(zf / zn) * w;
    #undef z
    #undef w
    #endif    
}