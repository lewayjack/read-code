import { ESSceneObject, PickedInfo } from "earthsdk3";
import { Destroyable, Listener, Event, reactArrayWithUndefined, reactArray, extendClassProps, ReactivePropsToNativePropsAndChanged, track, bind, ObjResettingWithEvent, SceneObjectKey } from "xbsj-base";
import { CzmCustomPrimitive } from "../CzmCustomPrimitive";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";

export type CzmImageModelRotationMode = 'WithCameraOnlyZ' | 'WithCamera' | 'WithProp';

export class CzmImageModel extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _customPrimitive;
    get customPrimitive() { return this._customPrimitive; }

    static defaults = {
        position: [0, 0, 0] as [number, number, number],
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
        useAxis: "XY",
    }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const customPrimitive = this._customPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, id));
        customPrimitive.indexTypedArray = new Uint16Array([
            0, 1, 2, 0, 2, 3,
            6, 5, 4, 7, 6, 4,
        ]);
        customPrimitive.pass = 'TRANSLUCENT';

        const vtxfVertexShader = `
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
        `;

        const vtxfFragmentShader = `
        in vec3 v_positionEC;
        in vec3 v_normalEC;
        in vec2 v_st;
        uniform sampler2D myImage;
        uniform vec4 myColor;
        uniform float u_xe2VisibleAlpha;
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
            material.alpha = imageColor.a * u_xe2VisibleAlpha;
        // #ifdef FLAT
            out_FragColor = vec4(material.diffuse + material.emission, material.alpha) * myColor;
        // #else
            // out_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
        // #endif
        }
        `;

        customPrimitive.vertexShaderSource = vtxfVertexShader;
        customPrimitive.fragmentShaderSource = vtxfFragmentShader;

        const defaultRenderState = {
            depthTest: {
                enabled: true,
            },
            cull: {
                enabled: true,
                face: 1029, // FRONT: 1028; BACK: 1029; FRONT_AND_BACK: 1032
            },
            // depthMask: false,
            blending: {
                enabled: true,
                equationRgb: 0x8006, // ADD: 0x8006; 
                equationAlpha: 0x8006, // ADD: 0x8006; 
                functionSourceRgb: 0x0302, // SRC_ALPHA: 0x0302
                functionSourceAlpha: 1, // ONE: 1
                functionDestinationRgb: 0x0303, // ONE_MINUS_SRC_ALPHA
                functionDestinationAlpha: 0x0303, // ONE_MINUS_SRC_ALPHA
            }
        };
        customPrimitive.renderState = defaultRenderState;

        const updateUniformMap = () => {

            if (this.czmTextureId) {
                customPrimitive.uniformMap = {
                    myImage: { type: 'texture', id: this.czmTextureId },
                    myColor: this.color ?? [1, 1, 1, 1],
                };
            } else {
                customPrimitive.uniformMap = {
                    myImage: { type: 'image', uri: ESSceneObject.context.getStrFromEnv(this.uri ?? '${earthsdk3-assets-script-dir}/assets/img/location.png') },
                    myColor: this.color ?? [1, 1, 1, 1],
                };
            }
        };
        updateUniformMap();
        this.dispose(this.uriChanged.disposableOn(updateUniformMap));
        this.dispose(this.czmTextureIdChanged.disposableOn(updateUniformMap));
        this.dispose(this.colorChanged.disposableOn(updateUniformMap));

        this.dispose(bind([customPrimitive, 'show'], [this, 'show']));
        this.dispose(bind([customPrimitive, 'allowPicking'], [this, 'allowPicking']));
        this.dispose(bind([customPrimitive, 'position'], [this, 'position']));
        {
            const update = () => {
                customPrimitive.pixelSize = this.pixelSize;
            };
            update();
            this.dispose(this.pixelSizeChanged.disposableOn(update));
        }

        this.dispose(track([customPrimitive, 'maximumScale'], [this, 'maximumScale']));
        this.dispose(track([customPrimitive, 'viewDistanceRange'], [this, 'viewDistanceRange']));
        this.dispose(track([customPrimitive, 'viewDistanceDebug'], [this, 'viewDistanceDebug']));
        const updateScale = () => {
            const { scale = [1, 1] } = this;
            customPrimitive.scale = [
                this.useAxis.includes("X") ? scale[0] : 1,
                this.useAxis.includes("Y") ? this.useAxis.includes("X") ? this.size[1] : this.size[0] : 1,
                this.useAxis.includes("Z") ? scale[1] : 1,
            ];
        };
        updateScale();
        this.dispose(this.scaleChanged.disposableOn(updateScale));

        const updateOriginRatioAndOffset = () => {
            // const localModelMatrix = getOriginMatrix(sceneObject.originRatioAndOffset ?? [0.5, 1.0, 0, 0], sceneObject.size ?? [1, 1]);
            // customPrimitive.localModelMatrix = localModelMatrix;
            const offsetWidth = -(this.originRatioAndOffset[0] * this.size[0] + this.originRatioAndOffset[2]);
            const offsetHeight = (this.originRatioAndOffset[1] * this.size[1] + this.originRatioAndOffset[3]);
            customPrimitive.localPosition = [
                this.useAxis.includes("X") ? offsetWidth : 0,
                this.useAxis.includes("Y") ? this.useAxis.includes("X") ? offsetHeight : offsetWidth : 0,
                this.useAxis.includes("Z") ? offsetHeight : 0,
            ];
            customPrimitive.localScale = [
                this.useAxis.includes("X") ? this.size[0] : 1,
                this.useAxis.includes("Y") ? this.useAxis.includes("X") ? this.size[1] : this.size[0] : 1,
                this.useAxis.includes("Z") ? this.size[1] : 1,
            ]
        };
        {
            const update = () => {
                const positionTypedArray = {
                    "XY": [
                        0, 0, 0, 0, -1, 0, 1, -1, 0, 1, 0, 0, // 正面
                        0, 0, 0, 0, -1, 0, 1, -1, 0, 1, 0, 0, // 背面
                    ],
                    "YZ": [
                        0, 0, 0, 0, 0, -1, 0, 1, -1, 0, 1, 0, // 正面
                        0, 0, 0, 0, 0, -1, 0, 1, -1, 0, 1, 0, // 背面
                    ],
                    "XZ": [
                        0, 0, 0, 0, 0, -1, 1, 0, -1, 1, 0, 0, // 正面
                        0, 0, 0, 0, 0, -1, 1, 0, -1, 1, 0, 0, // 背面
                    ]
                } as { [xx: string]: any }
                const boundingVolumeData = {
                    "XY": {
                        min: [0, -1, 0],
                        max: [1, 0, 0],
                    },
                    "YZ": {
                        min: [0, 0, -1],
                        max: [0, 1, 0],
                    },
                    "XZ": {
                        min: [0, 0, -1],
                        max: [1, 0, 0],
                    }
                } as { [xx: string]: any }
                customPrimitive.attributes = {
                    position: {
                        typedArray: new Float32Array(positionTypedArray[this.useAxis ?? CzmImageModel.defaults.useAxis]),
                        componentsPerAttribute: 3,
                    },
                    normal: {
                        typedArray: new Float32Array([
                            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
                            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
                        ]),
                        componentsPerAttribute: 3,
                    },
                    textureCoordinates: {
                        typedArray: new Float32Array([
                            0, 1, 0, 0, 1, 0, 1, 1,
                            1, 1, 1, 0, 0, 0, 0, 1,
                        ]),
                        componentsPerAttribute: 2,
                    }
                };

                customPrimitive.boundingVolume = {
                    type: 'LocalAxisedBoundingBox',
                    data: boundingVolumeData[this.useAxis ?? CzmImageModel.defaults.useAxis]
                };
                updateOriginRatioAndOffset();
            }
            update();
            this.d(this.useAxisChanged.don(update));
        }
        this.dispose(this.originRatioAndOffsetChanged.disposableOn(updateOriginRatioAndOffset));
        this.dispose(this.sizeChanged.disposableOn(updateOriginRatioAndOffset));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            customPrimitive.flyTo(duration);
        }));

        this.disposeVar(new ObjResettingWithEvent(this.rotationModeChanged, () => {
            return new RotationModeResetting(czmViewer, this);
        }));
    }
}

export namespace CzmImageModel {
    export const createDefaultProps = () => ({
        show: true,
        allowPicking: false,
        uri: '${earthsdk3-assets-script-dir}/assets/img/location.png',
        czmTextureId: '',
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单位
        rotation: reactArray<[number, number, number]>([0, 0, 0]), // 偏航俯仰翻转，度为单位
        positionEditing: false,
        rotationEditing: false,
        editing: false,
        /**
         * @deprecated rotationWithCamera属性已废弃，请使用rotationMode！
         */
        rotationWithCamera: false,
        rotationMode: 'WithProp' as CzmImageModelRotationMode,
        useAxis: 'XY',
        size: reactArray<[number, number]>([1, 1]),
        scale: [1, 1] as [number, number],
        maximumScale: Number.MAX_VALUE,
        minimumScale: Number.MIN_VALUE,
        pixelSize: 50 as number | undefined,
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        originRatioAndOffset: reactArray<[leftRatio: number, topRatio: number, leftOffset: number, topOffset: number]>([0.5, 1.0, 0, 0]), // 为undefined时设置为[0.5, 1.0, 0, 0]
        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,
    });
}
extendClassProps(CzmImageModel.prototype, CzmImageModel.createDefaultProps);
export interface CzmImageModel extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmImageModel.createDefaultProps>> { }

class RotationModeResetting extends Destroyable {
    constructor(private _czmViewer: ESCesiumViewer, private _czmImageModel: CzmImageModel) {
        super();

        const { customPrimitive, rotationMode } = this._czmImageModel;
        if (rotationMode === 'WithProp') {
            this.dispose(track([customPrimitive, 'rotation'], [this._czmImageModel, 'rotation']));
        } else if (rotationMode === 'WithCameraOnlyZ') {
            const update = () => {
                const { rotation: r } = this._czmImageModel;
                const ci = this._czmViewer.getCameraInfo();
                if (!ci) return;
                customPrimitive.rotation = [
                    ci.rotation[0] + (this._czmImageModel.useAxis.includes("YZ") ? 90 : 0),
                    r[1],
                    r[2]
                ];
            };
            update();
            this.dispose(this._czmViewer.cameraChanged.disposableOn(update));
            this.dispose(this._czmImageModel.rotationChanged.disposableOn(update));
        } else if (rotationMode === 'WithCamera') {
            const update = () => {
                const ci = this._czmViewer.getCameraInfo();
                if (!ci) return;
                const r = ci.rotation;
                customPrimitive.rotation = [
                    r[0] + (this._czmImageModel.useAxis.includes("YZ") ? 90 : 0),
                    r[1] + (this._czmImageModel.useAxis.includes("Z") ? 0 : 90),
                    r[2]
                ];
            };
            update();
            this.dispose(this._czmViewer.cameraChanged.disposableOn(update));
            this.dispose(this._czmImageModel.rotationChanged.disposableOn(update));
        }
    }
}
