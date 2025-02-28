export const SkyAtmosphereFS = `\
in vec3 v_outerPositionWC;

uniform vec3 u_hsbShift;

#ifndef PER_FRAGMENT_ATMOSPHERE
in vec3 v_mieColor;
in vec3 v_rayleighColor;
in float v_opacity;
in float v_translucent;
#endif

uniform samplerCube u_cubeMap; // vtxf 
uniform mat3 u_rotateMatrix; // vtxf

void main (void)
{
    float lightEnum = u_radiiAndDynamicAtmosphereColor.z;
    vec3 lightDirection = czm_getDynamicAtmosphereLightDirection(v_outerPositionWC, lightEnum);
   
    vec3 mieColor;
    vec3 rayleighColor;
    float opacity;
    float translucent;

    #ifdef PER_FRAGMENT_ATMOSPHERE
        computeAtmosphereScattering(
            v_outerPositionWC,
            lightDirection,
            rayleighColor,
            mieColor,
            opacity,
            translucent
        );
    #else
        mieColor = v_mieColor;
        rayleighColor = v_rayleighColor;
        opacity = v_opacity;
        translucent = v_translucent;
    #endif

    vec4 color = computeAtmosphereColor(v_outerPositionWC, lightDirection, rayleighColor, mieColor, opacity);

    #ifndef HDR
        color.rgb = czm_acesTonemapping(color.rgb);
        color.rgb = czm_inverseGamma(color.rgb);
    #endif

    #ifdef COLOR_CORRECT
        // Convert rgb color to hsb
        vec3 hsb = czm_RGBToHSB(color.rgb);
        // Perform hsb shift
        hsb.x += u_hsbShift.x; // hue
        hsb.y = clamp(hsb.y + u_hsbShift.y, 0.0, 1.0); // saturation
        hsb.z = hsb.z > czm_epsilon7 ? hsb.z + u_hsbShift.z : 0.0; // brightness
        // Convert shifted hsb back to rgb
        color.rgb = czm_HSBToRGB(hsb);
    #endif

    // For the parts of the sky atmosphere that are not behind a translucent globe,
    // we mix in the default opacity so that the sky atmosphere still appears at distance.
    // This is needed because the opacity in the sky atmosphere is initially adjusted based
    // on the camera height.
    if (translucent == 0.0) {
        color.a = mix(color.b, 1.0, color.a) * smoothstep(0.0, 1.0, czm_morphTime);
    }

    // out_FragColor = color; // vtxf 
    // ------------------ skybox vtxf begin -------------------
    vec4 positionEC = czm_windowToEyeCoordinates(gl_FragCoord);
    vec3 me = positionEC.xyz * czm_viewRotation * u_rotateMatrix;
    // webgl2需要将 textureCube -> texture 
    vec4 skyBoxColor = texture(u_cubeMap, normalize(vec3(me.x, -me.yz)));

    float skyBoxAlpha = 1.0 - clamp((czm_eyeHeight - 2000.0) / (5000.0 - 2000.0), 0.0, 1.0);
    color.rgb = color.rgb * (1.0 - skyBoxAlpha) + skyBoxColor.rgb * (skyBoxAlpha);
    color.a = color.a;
    out_FragColor = color;
    // ------------------ skybox vtxf end -------------------
}
`;
