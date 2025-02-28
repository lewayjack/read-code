import { ESCameraVisibleRange, ESSceneObject } from "earthsdk3";
import { CzmCustomPrimitive, CzmESObjectWithLocation, CzmTexture, RayEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, flyWithPosition } from "../../../utils";
import { createNextAnimateFrameEvent, reactArray, reactArrayWithUndefined, track, Vector } from "xbsj-base";

export class CzmESCameraVisibleRange extends CzmESObjectWithLocation<ESCameraVisibleRange> {
    static readonly type = this.register("ESCesiumViewer", ESCameraVisibleRange.type, this);

    private _czmESCustomPrimitive;
    get czmESCustomPrimitive() { return this._czmESCustomPrimitive; }

    // 自定义纹理
    private _czmTexture;
    get czmTexture() { return this._czmTexture; }

    // 中间变量
    private _innerPositionReact = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    private _innerRotationReact = this.disposeVar(reactArray<[number, number, number]>([0, 0, 0]));

    // 监听editing变化，开启双点编辑
    private _rayEditing = this.disposeVar(new RayEditing(this._innerPositionReact, this._innerRotationReact, [this.sceneObject, 'far'], [this.sceneObject, 'editing'], this.czmViewer));
    get rayEditing() { return this._rayEditing; }

    constructor(sceneObject: ESCameraVisibleRange, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this.sPrsEditing && (this.sPrsEditing.enabled = false); // 禁用基类中的编辑操作
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this._czmESCustomPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, sceneObject.id));
        this._czmTexture = this.dv(new CzmTexture(czmViewer, sceneObject.id));
        const czmESCustomPrimitive = this._czmESCustomPrimitive;
        // 纹理
        const czmTexture = this._czmTexture;
        this.dispose(track([czmESCustomPrimitive, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmESCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(track([czmESCustomPrimitive, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(track([czmESCustomPrimitive, 'position'], [sceneObject, 'position']));
        this.dispose(track([czmESCustomPrimitive, 'scale'], [sceneObject, 'scale']));
        // 互相监听，RayEditing输入的位置是undefinded就会开启双点
        {
            const updated = () => {
                if (Vector.equals(sceneObject.position, [0, 0, 0])) {
                    this._innerPositionReact.value = undefined;
                } else {
                    this._innerPositionReact.value = sceneObject.position;
                }
            }
            updated();
            this.dispose(this.sceneObject.positionChanged.disposableOn(updated));
        }
        {
            const updated = () => {
                if (this._innerPositionReact.value == undefined) {
                    sceneObject.position = [0, 0, 0];
                }
                else {
                    sceneObject.position = this._innerPositionReact.value;
                }
            }
            this.dispose(this._innerPositionReact.changed.disposableOn(updated));
        }
        {
            // @ts-ignore
            this.dispose(bindNorthRotation(this._innerRotationReact, [sceneObject, 'rotation']));
        }
        {
            const update = () => {
                // 远端
                const width = sceneObject.far * Math.tan(Math.PI * (sceneObject.fov / 360)) * 2;
                const height = width / sceneObject.aspectRatio;
                const distance = sceneObject.far;
                // 近端
                const nearWidth = sceneObject.near * Math.tan(Math.PI * (sceneObject.fov / 360)) * 2;
                const nearHeight = nearWidth / sceneObject.aspectRatio;
                const nearDistance = sceneObject.near;
                // 坐标点
                const nearP1 = [nearDistance, -nearWidth / 2, -nearHeight / 2]
                const nearP2 = [nearDistance, -nearWidth / 2, nearHeight / 2]
                const nearP3 = [nearDistance, nearWidth / 2, nearHeight / 2]
                const nearP4 = [nearDistance, nearWidth / 2, -nearHeight / 2]
                const p1 = [distance, -width / 2, -height / 2]
                const p2 = [distance, -width / 2, height / 2]
                const p3 = [distance, width / 2, height / 2]
                const p4 = [distance, width / 2, -height / 2]

                //1.不设索引，按顺序绘制  [012,023,034,041]
                // czmESCustomPrimitive.indexTypedArray = undefined
                // const position = [...p0, ...p1, ...p2, ...p0, ...p2, ...p3, ...p0, ...p3, ...p4, ...p0, ...p4, ...p1]

                //2.设置索引,position为各个索引点坐标值
                // const position = [...p0, ...p1, ...p2, ...p3, ...p4]
                // 坐标点
                const position = [...nearP1, ...nearP2, ...nearP3, ...nearP4, ...p1, ...p2, ...p3, ...p4]
                // 索引
                const index1 = [
                    0, 4, 5,
                    0, 5, 1,
                    1, 5, 6,
                    1, 6, 2,
                    2, 6, 7,
                    2, 7, 3,
                    3, 7, 4,
                    3, 4, 0,
                ]
                const indexs = [...index1, ...index1.reverse()]//反转绘制反面

                const nearUv1 = [1, 0]
                const nearUv2 = [1, 1]
                const nearUv3 = [1, 0]
                const nearUv4 = [1, 1]
                const uv1 = [0, 0]
                const uv2 = [0, 1]
                const uv3 = [0, 0]
                const uv4 = [0, 1]
                const uv = [...nearUv1, ...nearUv2, ...nearUv3, ...nearUv4, ...uv1, ...uv2, ...uv3, ...uv4]

                czmESCustomPrimitive.indexTypedArray = new Uint16Array(indexs);
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
                czmTexture.uri = ESSceneObject.context.getStrFromEnv("${earthsdk3-assets-script-dir}/assets/img/visible_img.png");
                czmESCustomPrimitive.uniformMap = {
                    "u_image": {
                        "type": "texture",
                        "id": czmTexture.id
                    },
                    "u_color": [
                        1,
                        1,
                        1,
                        1
                    ]
                }
                // 自动计算包围盒
                const minMax = czmESCustomPrimitive.computeLocalAxisedBoundingBoxFromAttribute("position");
                if (!minMax) return;
                const { min, max } = minMax;
                czmESCustomPrimitive.setLocalAxisedBoundingBox(min, max);
            }
            update()
            const event = this.disposeVar(createNextAnimateFrameEvent(sceneObject.fovChanged, sceneObject.aspectRatioChanged, sceneObject.farChanged, sceneObject.nearChanged));
            this.dispose(event.disposableOn(() => update()));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            super.flyTo(duration, id);
            return true;
        } else {
            const viewDistance = (Math.max(sceneObject.far, sceneObject.near) ?? ESCameraVisibleRange.defaults.far);
            if (sceneObject.position) {
                flyWithPosition(czmViewer, sceneObject, id, sceneObject.position, viewDistance, duration);
                return true;
            }
            return false;
        }
    }
}
