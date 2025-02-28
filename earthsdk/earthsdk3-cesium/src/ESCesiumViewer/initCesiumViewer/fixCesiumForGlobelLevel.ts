import * as Cesium from 'cesium';

// https://blog.csdn.net/u011520181/article/details/114133219

// 全球材质增加色调映射

export function czmInitGlobelLevelOnViewerCreating(viewer: Cesium.Viewer) {
    // @ts-ignore
    var sources = viewer.scene.globe._surfaceShaderSet.baseFragmentShaderSource.sources
    const n = sources.length - 1;
    sources[n] = sources[n].replace('materialInput.aspect = v_aspect;', 'materialInput.aspect = v_aspect;materialInput.color = color;');
}

export function fixCesiumForGlobelLevel() {
    // @ts-ignore
    const cbus = Cesium.ShaderSource._czmBuiltinsAndUniforms;
    if (cbus['czm_materialInput'].indexOf('vec4 color') !== -1) return;
    cbus['czm_materialInput'] = cbus['czm_materialInput'].replace('float aspect;', 'float aspect; vec4 color;');
}

export const globeLevelSource = `\
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

uniform vec3 input_shadows;
uniform vec3 input_highlights;
uniform vec3 midtones;
uniform vec3 output_shadows;
uniform vec3 output_highlights;

czm_material czm_getMaterial(czm_materialInput materialInput)
{
czm_material material = czm_getDefaultMaterial(materialInput);

vec3 c = materialInput.color.rgb;

// 输入色阶映射
c = (c - input_shadows) / (input_highlights - input_shadows);
c = clamp(c, vec3(0), vec3(1.0));

// 中间调处理
c = pow(c, 1.0 / midtones);

// 输出色阶映射
c = c * (output_highlights - output_shadows) + output_shadows;
c = clamp(c, vec3(0), vec3(1.0));

//material.diffuse = materialInput.color.rgb * vec3(1.0, 1.0, 0.0);
//material.alpha = materialInput.color.a;
material.diffuse = c;
material.alpha = materialInput.color.a;

return material;
}
`

// @ts-ignore
Cesium.Material.GlobeLevelMaterialType = "GlobelLevel";
// @ts-ignore
Cesium.Material._materialCache.addMaterial(Cesium.Material.GlobeLevelMaterialType, {
  fabric: {
    // @ts-ignore
    type: Cesium.Material.GlobeLevelMaterialType,
    uniforms: {
        input_shadows: new Cesium.Cartesian3(0.0, 0.0, 0.0),
        input_highlights: new Cesium.Cartesian3(1.0, 1.0, 1.0),
        midtones: new Cesium.Cartesian3(.5, .5, .5),
        output_shadows: new Cesium.Cartesian3(0.0, 0.0, 0.0),
        output_highlights: new Cesium.Cartesian3(1.0, 1.0, 1.0),
    },
    source: globeLevelSource,
  },
  translucent: false,
});

// export function getGlobeLevelMaterial() {
//     // Creates a composite material with both elevation shading and contour lines
//     return new Cesium.Material({
//         fabric: {
//             type: "GlobeLevel",
//             uniforms: {
//                 input_shadows: new Cesium.Cartesian3(0.0, 0.0, 0.0),
//                 input_highlights: new Cesium.Cartesian3(1.0, 1.0, 1.0),
//                 midtones: new Cesium.Cartesian3(.5, .5, .5),
//                 output_shadows: new Cesium.Cartesian3(0.0, 0.0, 0.0),
//                 output_highlights: new Cesium.Cartesian3(1.0, 1.0, 1.0),
//             },
//             source: `
//   #ifdef GL_OES_standard_derivatives
//       #extension GL_OES_standard_derivatives : enable
//   #endif
  
//   uniform vec3 input_shadows;
//   uniform vec3 input_highlights;
//   uniform vec3 midtones;
//   uniform vec3 output_shadows;
//   uniform vec3 output_highlights;
  
//   czm_material czm_getMaterial(czm_materialInput materialInput)
//   {
//       czm_material material = czm_getDefaultMaterial(materialInput);
  
//       vec3 c = materialInput.color.rgb;
  
//       // 输入色阶映射
//       c = (c - input_shadows) / (input_highlights - input_shadows);
//       c = clamp(c, vec3(0), vec3(1.0));
  
//       // 中间调处理
//       c = pow(c, 1.0 / midtones);
  
//       // 输出色阶映射
//       c = c * (output_highlights - output_shadows) + output_shadows;
//       c = clamp(c, vec3(0), vec3(1.0));
  
//       //material.diffuse = materialInput.color.rgb * vec3(1.0, 1.0, 0.0);
//       //material.alpha = materialInput.color.a;
//       material.diffuse = c;
//       material.alpha = materialInput.color.a;
  
//       return material;
//   }
//         `
//         },
//         translucent: false,
//     });
// }

