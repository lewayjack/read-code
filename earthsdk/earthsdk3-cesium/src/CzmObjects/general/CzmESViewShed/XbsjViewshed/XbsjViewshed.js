//import Cesium from 'Cesium';
import * as Cesium from 'cesium';
import { ViewshedPrimitive } from './ViewshedPrimitive';

var origin_createShadowReceiveFragmentShader = Cesium.ShadowMapShader.createShadowReceiveFragmentShader
Cesium.ShadowMapShader.createShadowReceiveFragmentShader = function (fs, shadowMap, castShadows, isTerrain, hasTerrainNormal) {
    var isSpotLight = shadowMap._isSpotLight;
    var result = origin_createShadowReceiveFragmentShader.bind(this)(fs, shadowMap, castShadows, isTerrain, hasTerrainNormal);
    if (isSpotLight) {
        // var originShader = /out_FragColor.rgb \*= visibility;/g;
        var originShader = 'out_FragColor.rgb *= visibility;';
        var newShader = 'out_FragColor.rgb *= (visibility < 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0));';
        // // 就是最后投影面的颜色（黄色）以及从视角射出线的颜色（红色）
        // var newShader = 'out_FragColor.rgb *= (visibility < 0.99 ? vec3(1.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0));';
        result.sources[result.sources.length - 1] = result.sources[result.sources.length - 1].replace(originShader, newShader);

        {
            var originShader = 'vec3 directionEC = normalize(positionEC.xyz - shadowMap_lightPositionEC.xyz);';
            // var newShader = originShader + ' vec4 vtxf_rtf = czm_inverseProjection * vec4(1.0, 1.0, 1.0, 1.0); float vtxf_far = -vtxf_rtf.z / vtxf_rtf.w; if (length(directionEC) < vtxf_far) { discard; }';
            var newShader = originShader + 'if (distance(positionEC.xyz, shadowMap_lightPositionEC.xyz) > shadowMap_lightPositionEC.w) { return; }';
            result.sources[result.sources.length - 1] = result.sources[result.sources.length - 1].replace(originShader, newShader);
        }
    }

    return result;
}

// Cesium自带的DebugCameraPrimitive需要用到，暂时不要删除
// var scratchMatrix4 = new Cesium.Matrix4();
// var scratchMatrix3 = new Cesium.Matrix3();
// function createModelMatrix(position, heading, pitch, roll, radius, result) {
//     var enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, result);
//     var scaleMatrix = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(radius, radius, radius), scratchMatrix4);
//     var modelMatrix = Cesium.Matrix4.multiply(enuMatrix, scaleMatrix, enuMatrix);
//     var rotateMatrix = Cesium.Matrix3.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(heading, pitch, roll), scratchMatrix3);
//     return Cesium.Matrix4.multiplyByMatrix3(modelMatrix, rotateMatrix, modelMatrix);
// }

function getRoatetXtoNZ() {
    var rotateZ = Cesium.Matrix3.fromRotationZ(Cesium.Math.PI * 0.5);
    var rotateY = Cesium.Matrix3.fromRotationY(Cesium.Math.PI * 0.5);
    var rotateXtoNZ = new Cesium.Matrix3();
    Cesium.Matrix3.multiply(rotateZ, rotateY, rotateXtoNZ);

    return rotateXtoNZ;
}

const rotateXtoNZ = getRoatetXtoNZ();

/**
 * 视域分析类
 */
export class XbsjViewshed {
    _updateFov() {
        if (this._fovH < 0 || this._fovV < 0) return;
        this.frustum.aspectRatio = Math.tan(this._fovH * 0.5) / Math.tan(this._fovV * 0.5);
        this.frustum.fov = this._fovH > this._fovV ? this._fovH : this._fovV;
    }

    constructor(scene) {
        this._fovH = Cesium.Math.PI / 3;
        this._fovV = Cesium.Math.PI / 6;

        if (!Cesium.defined(scene)) {
            console.error('scene is not defined!');
        }

        this._scene = scene;

        this._frustum = new Cesium.PerspectiveFrustum();
        // this._frustum.fov = Cesium.Math.PI/3;
        // this._frustum.aspectRatio = 3.0;
        this._updateFov();
        this._frustum.near = 1.0;
        this._frustum.far = 400.0;

        this._spotLightCamera = new Cesium.Camera(scene);
        this._frustum.clone(this._spotLightCamera.frustum);

        this._viewshedShadowMap = new Cesium.ShadowMap({
            context: scene.context,
            lightCamera: this._spotLightCamera,
            cascadesEnabled: false
        });

        this._debugCameraPrimitive = new ViewshedPrimitive({});

        this._enabledChangedEvent = new Cesium.Event();
    }

    update(frameState) {
        if (!this._viewshedShadowMap.enabled) {
            return;
        }

        frameState.shadowMaps.unshift(this._viewshedShadowMap);

        if (!this._frustum.equals(this._spotLightCamera.frustum)) {
            this._frustum.clone(this._spotLightCamera.frustum);
            this._viewshedShadowMap._pointLightRadius = this._frustum.far;

            // Cesium设计上的问题，frustum更新了，不会自动更新FBO，所以这里通过_frustum强制更新下
            // 通过修改bs来更新
            // this.shadowMap._needsUpdate = true;
            const bs = this.shadowMap._boundingSphere;
            bs.radius = Math.random();
        }

        if (this._debugCameraPrimitive.show) {
            var mm = this._debugCameraPrimitive.modelMatrix;
            Cesium.Matrix4.clone(this._spotLightCamera.inverseViewMatrix, mm);
            Cesium.Matrix4.multiplyByMatrix3(mm, rotateXtoNZ, mm);
            Cesium.Matrix4.multiplyByUniformScale(mm, this._spotLightCamera.frustum.far, mm);

            const c = this._spotLightCamera;
            const frustum = c.frustum;
            // this._debugCameraPrimitive.fovV = c.frustum.fov;
            // this._debugCameraPrimitive.fovH = c.frustum.fov * c.frustum.aspectRatio;
            // Cesium的fov的傻x设计，导致必须这样更新。。
            this._debugCameraPrimitive.fovV = (frustum.aspectRatio <= 1) ? frustum.fov : Math.atan(Math.tan(frustum.fov * 0.5) / frustum.aspectRatio) * 2.0;
            this._debugCameraPrimitive.fovH = (frustum.aspectRatio > 1) ? frustum.fov : Math.atan(Math.tan(frustum.fov * 0.5) * frustum.aspectRatio) * 2.0;

            this._debugCameraPrimitive.update(frameState);
        }
    }

    setView(options) {
        this._spotLightCamera.setView(options);
    }

    get enabledChangedEvent() {
        return this._enabledChangedEvent;
    }

    isDestroyed() {
        return false;
    }

    destroy() {
        this._debugCameraPrimitive = this._debugCameraPrimitive && this._debugCameraPrimitive.destroy();
        this._viewshedShadowMap = this._viewshedShadowMap && this._viewshedShadowMap.destroy();
        return Cesium.destroyObject(this);
    }
}

Object.defineProperties(XbsjViewshed.prototype, {
    /**
     * 视锥体
     * @type {Cesium.Frustum}
     * @memberof XbsjViewshed.prototype
     */
    frustum: {
        get: function () {
            // return this._spotLightCamera.frustum;
            return this._frustum;
        }
    },
    /**
     * 水平广角
     * @type {number}
     * @memberof XbsjViewshed.prototype
     */
    // fovH: {
    //     get: function () {
    //         const aspectRatio = this.frustum.aspectRatio;
    //         const fov = this.frustum.fov;
    //         if (aspectRatio > 1.0) {
    //             return fov;
    //         } else {
    //             const fovV = fov;
    //             const fovH = Math.atan((aspectRatio * Math.tan(fovV * 0.5))) * 2.0;
    //             return fovH;
    //         }
    //     },
    //     set: function (value) {
    //         const fovH = value;
    //         this.frustum.aspectRatio = Math.tan(fovH * 0.5) / Math.tan(this.fovV * 0.5);
    //         this.frustum.fov = fovH > this.fovV ? fovH : this.fovV;
    //     }
    // },
    fovH: {
        get: function () {
            return this._fovH;
        },
        set: function (value) {
            this._fovH = value;
            this._updateFov();
        }
    },
    /**
     * 垂直广角
     * @type {number}
     * @memberof XbsjViewshed.prototype
     */
    // fovV: {
    //     get: function () {
    //         const aspectRatio = this.frustum.aspectRatio;
    //         const fov = this.frustum.fov;
    //         if (aspectRatio < 1.0) {
    //             return fov;
    //         } else {
    //             const fovH = fov;
    //             const fovV = Math.atan(Math.tan(fovH * 0.5) / aspectRatio) * 2.0;
    //             return fovV;
    //         }
    //     },
    //     set: function (value) {
    //         const fovV = value;
    //         this.frustum.aspectRatio = Math.tan(this.fovH * 0.5) / Math.tan(fovV * 0.5);
    //         this.frustum.fov = this.fovH > fovV ? this.fovH : fovV;
    //     }
    // },
    fovV: {
        get: function () {
            return this._fovV;
        },
        set: function (value) {
            this._fovV = value;
            this._updateFov();
        }
    },
    /**
     * 近裁
     * @type {number}
     * @memberof XbsjViewshed.prototype
     */
    near: {
        get: function () {
            return this.frustum.near;
        },
        set: function (value) {
            if (this.frustum.near !== value) {
                this.frustum.near = value;
            }
        }
    },
    /**
     * 远裁
     * @type {number}
     * @memberof XbsjViewshed.prototype
     */
    far: {
        get: function () {
            return this.frustum.far;
        },
        set: function (value) {
            if (this.frustum.far !== value) {
                this.frustum.far = value;
            }
        }
    },
    /**
     * 起始位置
     * @type {Cesium.Cartesian3}
     * @memberof XbsjViewshed.prototype
     */
    position: {
        get: function () {
            return this._spotLightCamera.positionWC;
        },
        set: function (value) {
            this.setView({
                destination: value,
                orientation: {
                    heading: this._spotLightCamera.heading,
                    pitch: this._spotLightCamera.pitch,
                    roll: this._spotLightCamera.roll,
                }
            });
        }
    },
    /**
     * 偏航角
     * @type {number}
     * @memberof XbsjViewshed.prototype
     */
    heading: {
        get: function () {
            return this._spotLightCamera.heading;
        },
        set: function (value) {
            if (this._spotLightCamera.heading === value) {
                return;
            }

            this.setView({
                destination: this._spotLightCamera.positionWC,
                orientation: {
                    heading: value,
                    pitch: this._spotLightCamera.pitch,
                    roll: this._spotLightCamera.roll,
                }
            });
        }
    },
    /**
     * 俯仰角
     * @type {number}
     * @memberof XbsjViewshed.prototype
     */
    pitch: {
        get: function () {
            return this._spotLightCamera.pitch;
        },
        set: function (value) {
            if (this._spotLightCamera.pitch === value) {
                return;
            }

            this.setView({
                destination: this._spotLightCamera.positionWC,
                orientation: {
                    heading: this._spotLightCamera.heading,
                    pitch: value,
                    roll: this._spotLightCamera.roll,
                }
            });
        }
    },
    showHelper: {
        get: function () {
            return this._debugCameraPrimitive.show;
        },
        set: function (value) {
            this._debugCameraPrimitive.show = value;
        }
    },
    /**
     * 翻滚角
     * @type {number}
     * @memberof XbsjViewshed.prototype
     */
    roll: {
        get: function () {
            return this._spotLightCamera.roll;
        },
        set: function (value) {
            if (this._spotLightCamera.roll === value) {
                return;
            }

            this._spotLightCamera.setView({
                destination: this._spotLightCamera.positionWC,
                orientation: {
                    heading: this._spotLightCamera.heading,
                    pitch: this._spotLightCamera.pitch,
                    roll: value,
                }
            });
        }
    },
    shadowMap: {
        get: function () {
            return this._viewshedShadowMap;
        }
    },
    lightCamera: {
        get: function () {
            return this._spotLightCamera;
        }
    },
    /**
     * 视域分析是否可用
     * @type {boolean}
     * @memberof XbsjViewshed.prototype
     */
    enabled: {
        get: function () {
            return this._viewshedShadowMap.enabled;
        },
        set: function (value) {
            if (this._viewshedShadowMap.enabled === value) {
                return;
            }

            if (value) {
                // this._debugCameraPrimitive.show = true;
                this._viewshedShadowMap.enabled = true;
                this._viewshedShadowMap._pointLightRadius = this._spotLightCamera.frustum.far; // vtxf add 把radius传进去做扇形
            } else {
                // this._debugCameraPrimitive.show = false;
                this._viewshedShadowMap.enabled = false;
            }

            this._enabledChangedEvent.raiseEvent(value);
        }
    },
});
