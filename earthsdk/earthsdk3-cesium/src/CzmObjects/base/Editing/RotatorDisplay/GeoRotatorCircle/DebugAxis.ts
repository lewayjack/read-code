import * as Cesium from 'cesium';
import { HasOwner, track } from 'xbsj-base';
import { GeoRotatorCircle } from '.';
import { ESJNativeNumber16, ESSceneObject } from "earthsdk3";
import { CzmCustomPrimitive } from '../../../../../CzmObjects';
import { computeCzmModelMatrix, createInnerClassFromJson } from '../../.././../../utils';

const axisJson = {
    "type": "CzmCustomPrimitive",
    "allowPicking": true,
    "positionEditing": false,
    "position": [
        114.86128105686282,
        40.86825802653499,
        0
    ],
    "primitiveType": "LINES",
    "vertexShaderSource": "in vec3 position;\nvoid main()\n{\n    // 如果这一句注释，要相应地注释掉attribute中的normal，也就是说顶点属性要和shader中的一一匹配！\n    gl_Position = czm_modelViewProjection * vec4(position, 1.0);\n}\n",
    "fragmentShaderSource": "uniform vec4 u_color;\nvoid main()\n{\n    out_FragColor = u_color;\n}\n",
    "uniformMap": {
        "u_color": [
            1,
            1,
            0,
            1
        ]
    },
    "name": "CzmCustomPrimitive_47fd",
    "attributes": {
        "position": {
            "typedArray": {
                "type": "Float32Array",
                "array": [
                    0,
                    0,
                    0,
                    0,
                    0,
                    1
                ]
            },
            "componentsPerAttribute": 3
        }
    }
}

export class DebugAxis extends HasOwner<GeoRotatorCircle> {
    private _axis = this.disposeVar(createInnerClassFromJson(axisJson, CzmCustomPrimitive, this.owner.czmViewer));
    get axis() { return this._axis; }
    private _axisInit = (() => {
        this.dispose(track([this._axis, 'pixelSize'], [this.owner, 'pixelSize']));
        this.dispose(track([this._axis, 'position'], [this.owner, 'position']));
        this.dispose(track([this._axis, 'rotation'], [this.owner, 'rotation']));
        this.dispose(track([this._axis, 'show'], [this.owner, 'debug']));

        {
            const update = () => {
                const modelMatrix = computeCzmModelMatrix({
                    rotation: this.owner.selfRotation,
                });
                this._axis.localModelMatrix = modelMatrix && Cesium.Matrix4.toArray(modelMatrix) as ESJNativeNumber16 || undefined;
            };
            update();
            this.dispose(this.owner.selfRotationChanged.disposableOn(update));
        }

        {
            const update = () => {
                this._axis.uniformMap = { u_color: this.owner.color }
            };
            update();
            this.dispose(this.owner.colorChanged.disposableOn(update));
        }
    })();

    constructor(owner: GeoRotatorCircle) {
        super(owner);
    }
}
