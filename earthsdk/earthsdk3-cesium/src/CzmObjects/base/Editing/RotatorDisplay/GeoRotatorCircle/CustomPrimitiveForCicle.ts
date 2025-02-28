import * as Cesium from 'cesium';
import { CzmCustomPrimitive } from '../../.././../../CzmObjects';
import { computeCzmModelMatrix, createInnerClassFromJson } from '../../../../../utils';
import { GeoRotatorCircle } from '.';
import { HasOwner, track } from 'xbsj-base';
import { ESCesiumViewer } from '../../../../../ESCesiumViewer';
import { ESJNativeNumber16 } from "earthsdk3";

export function createCustomPrimitive(czmViewer: ESCesiumViewer) {
    const json = {
        "type": "CzmCustomPrimitive",
        "allowPicking": true,
        "positionEditing": false,
        // "position": [
        //     108.5458998423635,
        //     36.345848363271465,
        //     9.313225746154785e-10
        // ],
        // "rotation": [
        //     0,
        //     0,
        //     0
        // ],
        "pixelSize": 100,
        "boundingVolume": {
            "type": "LocalAxisedBoundingBox",
            "data": {
                "min": [
                    0,
                    -1,
                    0
                ],
                "max": [
                    1,
                    0,
                    0
                ]
            }
        },
        "renderState": {
            "depthTest": {
                "enabled": false
            },
            "cull": {
                "enabled": false,
                "face": 1029
            },
            "depthMask": false,
            "blending": {
                "enabled": true,
                "equationRgb": 32774,
                "equationAlpha": 32774,
                "functionSourceRgb": 770,
                "functionSourceAlpha": 1,
                "functionDestinationRgb": 771,
                "functionDestinationAlpha": 771
            }
        },
        "uniformMap": {
            "u_image": {
                "type": "texture",
                "id": "46d5d1a1-4aeb-4dc3-a0e2-dfbf4b8ee771"
            },
            "u_color": [
                1,
                1,
                0,
                1
            ]
        },
        "localPosition": [
            -0.5,
            -0.5,
            0
        ],
        "localRotation": [
            -90,
            0,
            0
        ],
        "name": "CzmCustomPrimitive_012c"
    };
    return createInnerClassFromJson(json, CzmCustomPrimitive, czmViewer);
}
export class CustomPrimitiveForCircle extends HasOwner<GeoRotatorCircle> {
    get sceneObject() { return this.owner; }
    get czmTexture() { return this.owner.czmTexture; }
    get czmViewer() { return this.owner.czmViewer; }

    private _customPrimitive = this.disposeVar(createCustomPrimitive(this.czmViewer));
    get customPrimitive() { return this._customPrimitive; }


    constructor(owner: GeoRotatorCircle) {
        super(owner);
        this.dispose(track([this.customPrimitive, 'position'], [this.sceneObject, 'position']));
        this.dispose(track([this.customPrimitive, 'rotation'], [this.sceneObject, 'rotation']));

        // rotation 属性用来做第二次旋转，所以只能用localModelMatrix来赋值，好在作用是一样的。
        {
            const update = () => {
                const modelMatrix = computeCzmModelMatrix({
                    rotation: this.sceneObject.selfRotation,
                });
                this.customPrimitive.localModelMatrix = modelMatrix && Cesium.Matrix4.toArray(modelMatrix) as ESJNativeNumber16 || undefined;
            };
            update();
            this.dispose(this.sceneObject.selfRotationChanged.disposableOn(update));
        }

        this.dispose(track([this.customPrimitive, 'pixelSize'], [this.sceneObject, 'pixelSize']));
        {
            const update = () => {
                this._customPrimitive.uniformMap = {
                    "u_image": {
                        "type": "texture",
                        "id": this.czmTexture.id,
                    },
                    "u_color": this.sceneObject.color,
                };
            };
            update();
            this.dispose(this.sceneObject.colorChanged.disposableOn(update));
        }

        this.dispose(() => this.customPrimitive.destroy());
    }
}
