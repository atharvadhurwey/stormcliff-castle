uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;
uniform float uColorOpacity;

uniform float uLightIntensity;
uniform vec3 uLightPosition;
uniform float uLightSpecularPower;
uniform float uLightDecay;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

// #include ../includes/ambientLight.glsl
// #include ../includes/directionalLight.glsl
#include ../includes/pointLight.glsl

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);

    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    mixStrength = smoothstep(0.0, 1.0, mixStrength);
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    

    vec3 light = vec3(0.0);

    light += pointLight(
        vec3(1.0),
        uLightIntensity,
        normal,
        uLightPosition,
        viewDirection,
        uLightSpecularPower,
        vPosition,
        uLightDecay
    );
    
    color *= light;
    
    gl_FragColor = vec4(color, uColorOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}