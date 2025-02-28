import { ESLocalSkyBox, ESSceneObject, getDistancesFromPositions } from "earthsdk3";
import { CzmCustomPrimitive, CzmTexture } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, react, track } from "xbsj-base";

export class SkyBoxComponent extends Destroyable {
    //用于距离可视控制显隐
    private _show;
    get show() { return this._show.value; }
    set show(value: boolean) { this._show.value = value; }
    get showChanged() { return this._show.changed; }
    // 自定义图元
    private _czmESCustomPrimitive;
    get czmESCustomPrimitive() { return this._czmESCustomPrimitive; }
    // 自定义纹理
    private _czmTexture;
    get czmTexture() { return this._czmTexture; }

    constructor(private _sceneObject: ESLocalSkyBox, czmViewer: ESCesiumViewer, imagePosition: string, positionMatrix: number[][]) {
        super();
        this._show = this.disposeVar(react<boolean>(this._sceneObject.show));
        this._czmESCustomPrimitive = this.dv(new CzmCustomPrimitive(czmViewer, this._sceneObject.id));
        this._czmTexture = this.dv(new CzmTexture(czmViewer));
        const sceneObject = _sceneObject;
        // 自定义图元
        const czmESCustomPrimitive = this._czmESCustomPrimitive;
        // 纹理
        const czmTexture = this._czmTexture;
        // 绑定监听
        this.dispose(track([czmESCustomPrimitive, 'show'], [this, 'show']));
        this.dispose(track([czmESCustomPrimitive, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmESCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(track([czmESCustomPrimitive, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(track([czmESCustomPrimitive, 'position'], [sceneObject, 'position']));
        this.dispose(track([czmESCustomPrimitive, 'scale'], [sceneObject, 'scale']));
        this.ad(sceneObject.allowPickingChanged.don(() => {
            czmESCustomPrimitive.allowPicking = sceneObject.allowPicking;
            czmESCustomPrimitive.pass = sceneObject.allowPicking ? "TRANSLUCENT" : 'OVERLAY';
        }))
        // 尺寸、内置模式变更
        {
            const update = () => {
                const size = sceneObject.size / 2;
                const LeftBottom = positionMatrix[0].map(item => item * size);
                const RightBottom = positionMatrix[1].map(item => item * size);
                const RightTop = positionMatrix[2].map(item => item * size);
                const LeftTop = positionMatrix[3].map(item => item * size);
                const position = [
                    ...LeftBottom,
                    ...RightBottom,
                    ...RightTop,
                    ...LeftTop,
                ];
                let indexes = [
                    0, 3, 2,
                    0, 2, 1,
                ];
                // 部分索引需要反转
                if (imagePosition == "north" || imagePosition == "west" || imagePosition == "bottom") {
                    indexes = indexes.reverse();
                }
                // uv对应图片
                const uv1 = [0, 0]
                const uv2 = [1, 0]
                const uv3 = [1, 1]
                const uv4 = [0, 1]
                let uv = <number[]>[];
                if (imagePosition == "east" || imagePosition == "south") {
                    uv = [...uv2, ...uv1, ...uv4, ...uv3]
                } else if (imagePosition == "west") {
                    uv = [...uv2, ...uv3, ...uv4, ...uv1]
                }
                else if (imagePosition == "top") {
                    uv = [...uv4, ...uv3, ...uv2, ...uv1]
                }
                else {
                    uv = [...uv1, ...uv2, ...uv3, ...uv4]
                }
                czmESCustomPrimitive.indexTypedArray = new Uint16Array(indexes);
                czmESCustomPrimitive.attributes = {
                    position: {
                        typedArray: new Float32Array(position),
                        componentsPerAttribute: 3,
                    },
                    st: {
                        typedArray: new Float32Array(uv),
                        componentsPerAttribute: 2
                    }
                };
                czmTexture.uri = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets' + `/img/skybox/${sceneObject.mode}/${imagePosition}.jpg`);;
                const cameraParam = czmViewer.getCameraInfo();
                if (cameraParam != undefined) {
                    let distance = getDistancesFromPositions(
                        [sceneObject.position, cameraParam.position],
                        'NONE'
                    )[0];
                    const OpacityFactor = distance / (sceneObject.size / 2 * sceneObject.autoOpacityFactor);
                    this.changeOpacity(sceneObject.autoFollow ? 1 : OpacityFactor)
                }
                // 自动计算包围盒
                const minMax = czmESCustomPrimitive.computeLocalAxisedBoundingBoxFromAttribute("position");
                if (!minMax) return;
                const { min, max } = minMax;
                czmESCustomPrimitive.setLocalAxisedBoundingBox(min, max);
            }
            update();
            const event = this.disposeVar(
                createNextAnimateFrameEvent(
                    sceneObject.sizeChanged,
                    sceneObject.modeChanged
                )
            )
            this.dispose(event.disposableOn(update));
        }
    }
    // 更改透明度
    changeOpacity(OpacityFactor: number) {
        this._czmESCustomPrimitive.uniformMap = {
            "u_image": {
                "type": "texture",
                "id": this._czmTexture.id
            },
            "u_color": [
                1,
                1,
                1,
                1.0 - OpacityFactor >= 0.0 ? 1.0 - OpacityFactor : 0.0
            ]
        }
        // this._czmESCustomPrimitive.renderState = {
        //     "depthTest": {
        //         "enabled": true
        //     },
        //     "cull": {
        //         "enabled": true,
        //         "face": 1029
        //     },
        //     "depthMask": true,
        //     "blending": {
        //         "enabled": this._sceneObject.autoFollow,
        //         "equationRgb": 32774,
        //         "equationAlpha": 32774,
        //         "functionSourceRgb": 770,
        //         "functionSourceAlpha": 1,
        //         "functionDestinationRgb": 771,
        //         "functionDestinationAlpha": 771
        //     }
        // }
    }
}
