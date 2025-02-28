export const vertexShaderSourceReadMe = `\
### 默认顶点Shader示例
\`\`\`
in vec3 position;
in vec3 normal;
in vec2 st;
out vec3 v_normalEC;
out vec2 v_st;
void main()
{
    // 如果这一句注释，要相应地注释掉attribute中的normal，也就是说顶点属性要和shader中的一一匹配！
    v_normalEC = czm_normal * normal; 
    v_st = st;
    gl_Position = czm_modelViewProjection * vec4(position, 1.0);
}
\`\`\`

### 相对完整的顶点Shader
\`\`\`
// vtxf 使用double类型的position进行计算
// in vec3 position3DHigh;
// in vec3 position3DLow;
in vec3 position;
in vec3 normal;
in vec2 st;
in float batchId;
out vec3 v_positionEC;
out vec3 v_normalEC;
out vec2 v_st;
void main()
{
    // vtxf 使用double类型的position进行计算
    // vec4 p = czm_translateRelativeToEye(position3DHigh, position3DLow);
    // v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
    // v_normalEC = czm_normal * normal;                         // normal in eye coordinates
    // v_st = st;
    // gl_Position = czm_modelViewProjectionRelativeToEye * p;
    v_positionEC = (czm_modelView * vec4(position, 1.0)).xyz;       // position in eye coordinates
    v_normalEC = czm_normal * normal;                               // normal in eye coordinates
    v_st = st;
    gl_Position = czm_modelViewProjection * vec4(position, 1.0);
}
\`\`\`
`;

export const fragmentShaderSourceReadMe = `\
### 默认片元Shader示例
\`\`\`
in vec2 v_st;
uniform sampler2D u_image;
uniform vec4 u_color;
void main()
{
    vec4 imageColor = texture(u_image, v_st);
    out_FragColor = imageColor * u_color;
}
\`\`\`

### xe2VisibleAlpha使用示例
xe2VisibleAlpha是根据视距范围自动计算出来的alpha值，用来设置透明，产生渐显的效果。
\`\`\` 
in vec2 v_st;
uniform sampler2D u_image;
uniform vec4 u_color;
uniform float u_xe2VisibleAlpha;
void main()
{
    vec4 imageColor = texture(u_image, v_st);
    out_FragColor = imageColor * u_color * vec4(1., 1., 1., u_xe2VisibleAlpha);
}
\`\`\`

### 相对完整的片元Shader示例
\`\`\`
in vec3 v_positionEC;
in vec3 v_normalEC;
in vec2 v_st;
uniform sampler2D myImage;
void main()
{
    vec3 positionToEyeEC = -v_positionEC;
    vec3 normalEC = normalize(v_normalEC);
#ifdef FACE_FORWARD
    normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
#endif
    czm_materialInput materialInput;
    materialInput.normalEC = normalEC;
    materialInput.positionToEyeEC = positionToEyeEC;
    materialInput.st = v_st;
    //czm_material material = czm_getMaterial(materialInput);
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec4 imageColor = texture(myImage, materialInput.st);
    material.diffuse = imageColor.rgb;
    material.alpha = imageColor.a;
// #ifdef FLAT
    out_FragColor = vec4(material.diffuse + material.emission, material.alpha);
// #else
    // out_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
// #endif
}
\`\`\`
`;

// // vtxf 使用double类型的position进行计算
// // in vec3 position3DHigh;
// // in vec3 position3DLow;
// in vec3 position;
// in vec3 normal;
// in vec2 st;
// in float batchId;
// in vec3 v_positionEC;
// in vec3 v_normalEC;
// in vec2 v_st;
// void main()
// {
//     // vtxf 使用double类型的position进行计算
//     // vec4 p = czm_translateRelativeToEye(position3DHigh, position3DLow);
//     // v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
//     // v_normalEC = czm_normal * normal;                         // normal in eye coordinates
//     // v_st = st;
//     // gl_Position = czm_modelViewProjectionRelativeToEye * p;
//     v_positionEC = (czm_modelView * vec4(position, 1.0)).xyz;       // position in eye coordinates
//     v_normalEC = czm_normal * normal;                               // normal in eye coordinates
//     v_st = st;
//     gl_Position = czm_modelViewProjection * vec4(position, 1.0);
// }