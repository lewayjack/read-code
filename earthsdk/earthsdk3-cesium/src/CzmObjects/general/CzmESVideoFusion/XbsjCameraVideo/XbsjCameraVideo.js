import './hack';
import createBoxGeoemtry from './createBoxGeometry';
import { getSceneScaleForScreenPixelSize } from '../../../../utils'
import * as Cesium from 'cesium';

//TODO
// Cesium.defineProperties = Object.defineProperties;

var cameraVideoHelperVS =
    `
in vec3 position3DHigh;
in vec3 position3DLow;
in vec4 color;
in float batchId;

out vec4 v_color;

uniform mat4 u_boxMV;

void main()
{
    v_color = color;

    vec4 p = vec4(position3DHigh + position3DLow, 1.0);
    p.y -= 1.001;
    p = u_boxMV * p;
    p.xyz /= p.w;
    p.w = 1.0;
    gl_Position = czm_projection * p;
}
`
/**
 * 视频融合类
 * @class
 * 
 * @param {Object} options 相关参数选项
 * @param {Cesium.Matrix4} options.inverseViewMatrix 视频融合的姿态矩阵
 * @param { () => Cesium.Texture | undefined } options.videoTextureFunc 源视频回调
 * @param { () => Cesium.Texture | undefined } options.alphaTextureFunc 遮罩视频回调
 * @param {boolean} options.showHelperPrimitive 是否显示辅助线框
 * @param {Cesium.Frustum} options.frustum 视频融合的投影体
 */
export function XbsjCameraVideo(options) {
    if (!Cesium.defined(options.inverseViewMatrix)) {
        throw new Error('XbsjCameraVideo error!');
    }

    this.videoTextureFunc = options.videoTextureFunc;
    this.alphaTextureFunc = options.alphaTextureFunc;

    var showHelperPrimitive = Cesium.defaultValue(options.showHelperPrimitive, false);

    /** 
     * 视频融合的姿态矩阵
     * @member {Cesium.Matrix4} 
     * */
    this.inverseViewMatrix = Cesium.Matrix4.clone(options.inverseViewMatrix);
    this._inverseViewMatrix = new Cesium.Matrix4();

    if (!Cesium.defined(options.frustum)) {
        this.frustum = new Cesium.PerspectiveFrustum({
            fov: Cesium.Math.toRadians(30.0),
            aspectRatio: 1.333,
            near: 10,
            far: 100,
        });
    } else {
        this.frustum = options.frustum.clone();
    }

    this._boxMV = new Cesium.Matrix4();
    this._primitiveModelMatrix = new Cesium.Matrix4();

    this._inverseBoxMV = new Cesium.Matrix4();

    var that = this;
    var vtxfVideoCameraUniformMap = {
        u_inverseBoxMV: function () {
            return that._inverseBoxMV;
        },
        u_boxMV: function () {
            return that._boxMV;
        }
    };

    // var material = Cesium.Material.fromType('Image');
    // material.uniforms.image = options.videoElement;

    var material = new Cesium.Material({
        fabric: {
            type: 'XbsjCameraVideo',
            uniforms: {
                image: '', // Cesium有bug，此处不能直接赋值video
                // alphaImage : require('../../Demos/static/images/xbsjMask.jpg'),
                alphaImage: Cesium.Material.DefaultImageId,
            },
            components: {
                diffuse: 'texture(image, fract(materialInput.st)).rgb',
                // alpha : 'texture2D(alphaImage, fract(repeat * materialInput.st)).a * color.a'
                alpha: 'texture(alphaImage, fract(materialInput.st)).r',
            }
        }
    });
    // material.uniforms.image = options.videoElement;

    {
        // @ts-ignore
        const originFunc = material._uniforms["image_0"];
        // @ts-ignore
        material._uniforms["image_0"] = () => {
            const texture = this.videoTextureFunc && this.videoTextureFunc();
            if (texture) {
                return texture;
            }
            return originFunc();
        };
    }

    {
        // @ts-ignore
        const originFunc = material._uniforms["alphaImage_1"];
        // @ts-ignore
        material._uniforms["alphaImage_1"] = () => {
            const texture = this.alphaTextureFunc && this.alphaTextureFunc();
            if (texture) {
                return texture;
            }
            return originFunc();
        };
    }

    var appearance = new Cesium.MaterialAppearance({
        material: material,
        closed: false,
        // faceForward: false
    });

    appearance._vertexFormat = Cesium.VertexFormat.POSITION_ONLY;
    appearance.isCameraVideo = true;

    var primitive = new Cesium.ClassificationPrimitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: createBoxGeoemtry(),
            // modelMatrix : tempModelMatrix, // 只能在这里使用。。
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 0.0, 0.0, 1)),
                show: new Cesium.ShowGeometryInstanceAttribute(true),
                isCameraVideo: new Cesium.ShowGeometryInstanceAttribute(true),
            },
            id: 'volume'
        }),
        classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
        _uniformMap: vtxfVideoCameraUniformMap,
        appearance: appearance,
        asynchronous: false,
        compressVertices: false,
        allowPicking: false,
        // modelMatrix : modelMatrix, // 这里使用无效
        // debugShowBoundingVolume: true
    });

    primitive.isCameraVideo = true;

    Object.defineProperties(primitive, {
        _sp: {
            set: function (value) {
                if (this.__sp === value) {
                    return;
                }

                if (value) {
                    var sp = value;

                    var vs = sp.vertexShaderSource;

                    if (vs.defines.indexOf('XBSJ_CAMERA_VIDEO') === -1) {
                        vs.defines.push('XBSJ_CAMERA_VIDEO');
                    }
                }

                this.__sp = sp;
            },
            get: function () {
                return this.__sp;
            }
        },
        cameraInfo: {
            get: function () {
                return this._cameraInfo;
            }
        },
    });

    this._primitive = primitive;

    // helperPrimitive
    var helperAppearance = new Cesium.PerInstanceColorAppearance({
        closed: false,
        // faceForward: true,
        flat: true,
        translucent: false,
        vertexShaderSource: cameraVideoHelperVS,
    });

    helperAppearance.uniforms = {
        u_boxMV: this._boxMV,
    };

    var helperPrimitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: createBoxGeoemtry(true),
            // modelMatrix : modelMatrix,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 0.0, 0.0, 1.0)),
                show: new Cesium.ShowGeometryInstanceAttribute(true),
            },
            id: 'cameraVideoHelper'
        }),
        appearance: helperAppearance,
        asynchronous: false,
        compressVertices: false,
        cull: false,
        show: showHelperPrimitive,
        // modelMatrix : cameraVideo._modelMatrix,
    });

    this._helperPrimitive = helperPrimitive;

    this._projectionMatrix = new Cesium.Matrix4();
    this._inverseViewProjectionMatrix = new Cesium.Matrix4();
    this._viewProjectionMatrix = new Cesium.Matrix4();

    /**
     * 是否显示视频融合
     * @member {boolean}
     */
    this.show = true;
}

/**
 * 渲染流程中的更新操作
 * @private
 * @param {Cesium.FrameState} frameState Cesium的FrameState类，存放本帧的各种信息
 */
XbsjCameraVideo.prototype.update = function (frameState) {
    if (!this.show) {
        return;
    }

    // 包围盒判定，Cesium自身会先进性material更新，然后才判定包围盒，会导致无论是否可见，都会拷贝视频纹理，影响性能
    // 这里提前进行包围盒判断，避免拷贝纹理
    {
        this._scratchCartesian = this._scratchCartesian || new Cesium.Cartesian3();
        this._scratchBS = this._scratchBS || new Cesium.BoundingSphere();
        const center = Cesium.Matrix4.getTranslation(this.inverseViewMatrix, this._scratchCartesian);
        const radius = this.frustum.far;
        const bs = this._scratchBS;
        Cesium.Cartesian3.clone(center, bs.center);
        bs.radius = radius;
        if (frameState.cullingVolume.computeVisibility(bs) === Cesium.Intersect.OUTSIDE) {
            return;
        }

        const camera = frameState.camera;
        if (camera && camera.getPixelSize) {
            const virtualRaidus = getSceneScaleForScreenPixelSize(camera._scene, bs.center, 20);
            if (virtualRaidus > bs.radius) {
                return;
            }
            // const realPixelSize = camera.getPixelSize(bs, camera._scene.drawingBufferWidth, camera._scene.drawingBufferHeight);
            // if (realPixelSize < 10) {
            //     return;
            // }
        }
    }

    var bf = Cesium.Matrix4.equals(this.frustum.projectionMatrix, this._projectionMatrix);
    var bv = Cesium.Matrix4.equals(this.inverseViewMatrix, this._inverseViewMatrix);

    if (!bf) {
        Cesium.Matrix4.clone(this.frustum.projectionMatrix, this._projectionMatrix);
    }

    if (!bv) {
        Cesium.Matrix4.clone(this.inverseViewMatrix, this._inverseViewMatrix);
    }

    if (!bf || !bv) {
        var ivpm = this._inverseViewProjectionMatrix;
        Cesium.Matrix4.inverse(this._projectionMatrix, ivpm);
        Cesium.Matrix4.multiply(this._inverseViewMatrix, ivpm, ivpm);

        var vpm = this._viewProjectionMatrix;
        // Cesium.Matrix4.inverse(this._inverseViewMatrix, vpm);
        // Cesium.Matrix4.multiply(this._projectionMatrix, vpm, vpm);
        Cesium.Matrix4.inverse(ivpm, vpm);
        // Cesium.Matrix4.multiply(scaleBiasMatrix, vpm, vpm);

        var pmMatrix = this._primitiveModelMatrix;
        Cesium.Matrix4.fromUniformScale(this.frustum.far, pmMatrix);
        Cesium.Matrix4.multiply(this._inverseViewMatrix, pmMatrix, pmMatrix);

        this._helperPrimitive.modelMatrix = this._primitiveModelMatrix;
    }

    if (this._primitive._primitive) {
        this._primitive._primitive.modelMatrix = this._primitiveModelMatrix;
    }

    Cesium.Matrix4.multiply(frameState.camera.viewMatrix, this._inverseViewProjectionMatrix, this._boxMV);
    Cesium.Matrix4.multiply(this._viewProjectionMatrix, frameState.camera.inverseViewMatrix, this._inverseBoxMV);

    this._primitive.update(frameState);
    this._helperPrimitive.update(frameState);
}

//TODO
// Cesium.defineProperties(XbsjCameraVideo.prototype, {
Object.defineProperties(XbsjCameraVideo.prototype, {
    /**
     * 是否显示视频融合的辅助线框
     * @type {boolean}
     * @instance
     * @memberof XbsjCameraVideo
     */
    showHelperPrimitive: {
        set: function (show) {
            this._helperPrimitive.show = show;
        },
        get: function () {
            return this._helperPrimitive.show;
        }
    },
    // /**
    //  * 视频融合需要渲染的源视频
    //  * @type {Dom.VideoElement}
    //  * @instance
    //  * @memberof XbsjCameraVideo
    //  */
    // videoElement: {
    //     set: function (value) {
    //         // Cesium的Material有bug，如果两次视频宽度不同，会报错！因为Cesium内部不会清理上一次留下的texture
    //         {
    //             var t = this._primitive.appearance.material._textures.image
    //             if (t) {
    //                 this._primitive.appearance.material._textures.image = undefined
    //                 if (t !== t._context.defaultTexture) { // 如果是defaultTexture，不能删除，否则报错！
    //                     t.destroy();
    //                 }
    //             }
    //         }

    //         this._primitive.appearance.material.uniforms.image = value;
    //     },
    //     get: function () {
    //         return this._primitive.appearance.material.uniforms.image;
    //     }
    // },
    // /**
    //  * 掩码图像，用来对图像进行遮挡，目前使用的是r通道
    //  * @type {string}
    //  * @instance
    //  * @memberof XbsjCameraVideo
    //  */
    // alphaImage: {
    //     set: function (value) {
    //         var uniforms = this._primitive.appearance.material.uniforms;

    //         if (value === '' && uniforms.alphaImage !== Cesium.Material.DefaultImageId) {
    //             { // 避免纹理删不掉！
    //                 var t = this._primitive.appearance.material._textures.alphaImage
    //                 if (t) {
    //                     this._primitive.appearance.material._textures.alphaImage = undefined
    //                     if (t !== t._context.defaultTexture) { // 如果是defaultTexture，不能删除，否则报错！
    //                         t.destroy();
    //                     }
    //                 }
    //             }

    //             uniforms.alphaImage = Cesium.Material.DefaultImageId;
    //         } else if (uniforms.alphaImage !== value) {
    //             { // 避免纹理删不掉！
    //                 var t = this._primitive.appearance.material._textures.alphaImage
    //                 if (t) {
    //                     this._primitive.appearance.material._textures.alphaImage = undefined
    //                     if (t !== t._context.defaultTexture) { // 如果是defaultTexture，不能删除，否则报错！
    //                         t.destroy();
    //                     }
    //                 }
    //             }

    //             uniforms.alphaImage = value;
    //         }
    //     },
    //     get: function () {
    //         if (Cesium.Material.DefaultImageId === this._primitive.appearance.material.uniforms.alphaImage) {
    //             return ''
    //         } else {
    //             return this._primitive.appearance.material.uniforms.alphaImage;
    //         }
    //     }
    // }
});

/**
 * 视频融合类是否被销毁
 * @returns {boolean} true表示已经销毁
 */
XbsjCameraVideo.prototype.isDestroyed = function () {
    return false;
};

/**
 * 销毁视频融合类
 * @returns {*} 销毁成功会返回undefined 
 */
XbsjCameraVideo.prototype.destroy = function () {
    this._primitive = this._primitive && this._primitive.destroy();
    this._helperPrimitive = this._helperPrimitive && this._helperPrimitive.destroy();
    return Cesium.destroyObject(this);
};

// export default XbsjCameraVideo;
