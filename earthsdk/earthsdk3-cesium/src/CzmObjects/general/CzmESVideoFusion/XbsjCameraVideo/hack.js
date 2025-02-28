import * as Cesium from 'cesium';

var originPMSP = Cesium.Primitive._modifyShaderPosition;
Cesium.Primitive._modifyShaderPosition = function (classificationPrimitive, vs, scene3DOnly) {
    var vs = originPMSP(classificationPrimitive, vs, scene3DOnly);

    // if (g_classificationPrimitives.indexOf(classificationPrimitive) !== -1) {
    if (classificationPrimitive.isCameraVideo) {
        // 修复升级到Cesium1.70以后，视频融合不起作用的问题
        // 升级到Cesium1.70以后，这里已经把czm_depthClampFarPlane -> czm_depthClamp
        if (vs.indexOf('XBSJ_CAMERA_VIDEO') === -1) {
                vs = vs.replace('void main()', `
            #ifdef XBSJ_CAMERA_VIDEO
            uniform mat4 u_boxMV;
            #endif

            void main()
        `).replace('gl_Position = czm_depthClamp(czm_modelViewProjectionRelativeToEye * position);', `
            #ifdef XBSJ_CAMERA_VIDEO

            position.y -= 1.001;
            position = u_boxMV * position;
            position.xyz /= position.w;
            position.w = 1.0;
            gl_Position = czm_depthClamp(czm_projection * position);

            #else

            gl_Position = czm_depthClamp(czm_modelViewProjectionRelativeToEye * position);

            #endif
        `).replace('vec4 position = czm_computePosition();', `
            vec4 position = czm_computePosition();
            #ifdef XBSJ_CAMERA_VIDEO
            position = vec4(position3DLow + position3DHigh, 1.0);
            #endif
        `)
        }
    }

    return vs;
}

var originhaftcp = Cesium.ShadowVolumeAppearance.hasAttributesForTextureCoordinatePlanes;
Cesium.ShadowVolumeAppearance.hasAttributesForTextureCoordinatePlanes = function (attributes) {
    if (Cesium.defined(attributes.isCameraVideo)) {
        return true;
    } else {
        return originhaftcp(attributes);
    }
}

var originSVAPCFS = Cesium.ShadowVolumeAppearance.prototype.createFragmentShader;
Cesium.ShadowVolumeAppearance.prototype.createFragmentShader = function(columbusView2D) {
    var fs = originSVAPCFS.bind(this)(columbusView2D);
    if (this._appearance.isCameraVideo) {
        var toDels = ['TEXTURE_COORDINATES', 'CULL_FRAGMENTS', 'USES_ST'];
        toDels.forEach(function (toDel) {
            var tc = fs.defines.indexOf(toDel);
            if (tc !== -1) {
                fs.defines.splice(tc, 1);
            }
        });

        fs.defines.push('XBSJ_CAMERA_VIDEO');

        fs.sources.forEach(function (source, index) {
            if (source.indexOf('XBSJ_CAMERA_VIDEO') !== -1) return;

            fs.sources[index] = source.replace('void main(void)', `
                #ifdef XBSJ_CAMERA_VIDEO
                uniform mat4 u_inverseBoxMV;
                #endif

                void main(void)
            `).replace('czm_material material = czm_getMaterial(materialInput);', `

                #ifdef XBSJ_CAMERA_VIDEO
                    vec4 shadowPosition = u_inverseBoxMV * eyeCoordinate;
                    shadowPosition.xyz = shadowPosition.xyz / shadowPosition.w;
                    materialInput.st = shadowPosition.xy * 0.5 + 0.5;
                #endif

                    czm_material material = czm_getMaterial(materialInput);
            `);
        });
    }

    return fs;
}

var originSVAPCVS = Cesium.ShadowVolumeAppearance.prototype.createVertexShader;
Cesium.ShadowVolumeAppearance.prototype.createVertexShader = function (defines, vertexShaderSource, columbusView2D, mapProjection) {
    var vs = originSVAPCVS.bind(this)(defines, vertexShaderSource, columbusView2D, mapProjection);
    if (this._appearance.isCameraVideo) {
        var toDels = ['TEXTURE_COORDINATES', 'CULL_FRAGMENTS', 'USES_ST'];
        toDels.forEach(function (toDel) {
            var tc = vs.defines.indexOf(toDel);
            if (tc !== -1) {
                vs.defines.splice(tc, 1);
            }
        });

        vs.defines.push('XBSJ_CAMERA_VIDEO');
    }

    return vs;
}


