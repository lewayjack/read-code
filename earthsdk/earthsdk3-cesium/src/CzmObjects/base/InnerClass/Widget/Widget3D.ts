import { ESJWidgetEventInfo, ESPoi2D, ESWidget } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, react } from "xbsj-base";
import { getPoi2DDefaultAnchor } from "./getPoi2DDefaultAnchor";
import html2canvas from "html2canvas";
import { bindNorthRotation, flyWithPrimitive } from "../../../../utils";
import { CzmCustomPrimitive, CzmESLabel, CzmTexture } from "../../../../CzmObjects";

export class Widget3D extends Destroyable {
    // 自定义div内容
    public widgetInfo: HTMLElement;
    //鼠标模式
    private _eventInfo: ESJWidgetEventInfo = { type: "leftClick", add: { mousePos: [0, 0] } };
    private _isPointEvent: boolean = false;
    // 创建3D面板
    private _czmCustomPrimitive;
    get czmCustomPrimitive() { return this._czmCustomPrimitive; }
    // 创建纹理
    //SceneObject.createFromClass 创建的对象才能根据id来找到对象！
    private _czmTexture;
    get czmTexture() { return this._czmTexture; }

    public sceneObject;
    public domSize: { [xx: string]: any } | undefined = undefined;

    private _defaultAnchor = this.disposeVar(react<[number, number]>([0, 0]));
    get defaultAnchor() { return this._defaultAnchor.value; }
    set defaultAnchor(value: [number, number]) { this._defaultAnchor.value = value; }
    get defaultAnchorChanged() { return this._defaultAnchor.changed; }
    public czmViewer: ESCesiumViewer;
    constructor(private _sceneObject: ESWidget | ESPoi2D, private _czmViewer: ESCesiumViewer, private _widgetInfo: HTMLElement, private _drawWidget: boolean, listenAnchor: boolean = true) {
        super();
        this._czmCustomPrimitive = this.disposeVar(new CzmCustomPrimitive(_czmViewer, _sceneObject.id));
        this._czmTexture = this.ad(new CzmTexture(_czmViewer));
        let sceneObject = this.sceneObject = this._sceneObject;
        let czmViewer = this.czmViewer = this._czmViewer;
        this.widgetInfo = this._widgetInfo;
        {
            if (sceneObject instanceof ESPoi2D) {
                this.defaultAnchor = getPoi2DDefaultAnchor(this.widgetInfo, sceneObject.mode);
            }
        }

        const { czmTexture } = this;

        const { czmCustomPrimitive } = this;
        // 矫正本地姿态
        czmCustomPrimitive.localRotation = [-90, 0, 0];

        this.dispose(bind([czmCustomPrimitive, 'position'], [sceneObject, 'position']));
        this.dispose(bind([czmCustomPrimitive, 'positionEditing'], [sceneObject, 'editing']));
        {
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.allowPickingChanged, sceneObject.editingChanged))
            const update = () => {
                if (sceneObject.allowPicking && !sceneObject.editing) {
                    czmCustomPrimitive.allowPicking = true;
                } else {
                    czmCustomPrimitive.allowPicking = false;
                }
            }
            update();
            this.d(event.don(update));
        }
        {
            this.ad(_czmViewer.clickEvent.don(pickedInfo => {
                const pointerEvent = pickedInfo?.pointerEvent;
                if (!pointerEvent) return;
                this._isPointEvent = true;
                this._eventInfo = {
                    type: pointerEvent.button == 0 ? "leftClick" : pointerEvent.button == 2 ? "rightClick" : "leftClick",
                    add: { mousePos: [pointerEvent.offsetX, pointerEvent.offsetY] as [number, number] }
                }
            }))
            this.d(sceneObject.pickedEvent.don(pickedInfo => {
                // 响应widgetEvent事件
                // 鼠标点击事件
                if (this._isPointEvent && pickedInfo.attachedInfo != "innerHoverEvent" && this._eventInfo.add?.mousePos &&
                    Math.abs(pickedInfo.pickedInfo.screenPosition[0] - this._eventInfo.add?.mousePos[0]) < 1 &&
                    Math.abs(pickedInfo.pickedInfo.screenPosition[1] - this._eventInfo.add?.mousePos[1]) < 1) {
                    sceneObject.widgetEvent.emit(this._eventInfo as ESJWidgetEventInfo)
                    this._isPointEvent = false;
                }
            }))
            const czmSceneObject = czmViewer.getCzmObject(sceneObject) as CzmESLabel;
            this.ad(czmSceneObject.lastHoverResultChanged.don((newVal, oldVal) => {
                if (newVal?.sceneObject == oldVal?.sceneObject || (newVal?.sceneObject != sceneObject && oldVal?.sceneObject != sceneObject)) return;
                do {
                    if (newVal?.sceneObject == undefined) {
                        this._eventInfo = {
                            type: "mouseLeave",
                            add: { mousePos: newVal?.screenPosition as [number, number] }
                        }
                    }
                    if (oldVal?.sceneObject == undefined) {
                        this._eventInfo = {
                            type: "mouseEnter",
                            add: { mousePos: newVal?.screenPosition as [number, number] }
                        }
                    }
                } while (false);
                sceneObject.widgetEvent.emit(this._eventInfo as ESJWidgetEventInfo)
            }))
        }
        this.d(sceneObject.scaleChanged.don(() => {
            czmCustomPrimitive.scale = [
                sceneObject.scale[1],
                sceneObject.scale[0],
                sceneObject.scale[2]
            ]
        }))
        czmCustomPrimitive.indexTypedArray = new Uint16Array([
            0, 1, 2, 0, 2, 3,
            6, 5, 4, 7, 6, 4,
        ]);
        {
            const update = () => {
                if (this._drawWidget) czmCustomPrimitive.show = sceneObject.show;
            }
            update()
            this.d(sceneObject.showChanged.don(update))
        }
        // rotationType,漫游旋转类型
        {
            this.disposeVar(new ObjResettingWithEvent(sceneObject.rotationTypeChanged, () => {
                if (sceneObject.rotationType == 0) {
                    return new OriginRotationResetting(this);
                } else if (sceneObject.rotationType == 1) {
                    return new RotationWithCameraResetting(this);
                } else if (sceneObject.rotationType == 2) {
                    return new RotationWithCameraZResetting(this);
                }
            }))
        }
        // info信息变更
        {
            const update = () => {
                try {
                    if (this._drawWidget) {
                        const div = this.widgetInfo;
                        div.style.position = 'fixed';
                        div.style.zIndex = '-1';
                        div.style.top = '0px';
                        if (!document.body.contains(div)) {
                            document.body.appendChild(div);
                            this.domSize = this.widgetInfo.getBoundingClientRect();
                        }
                        html2canvas(div, {
                            backgroundColor: null,
                            allowTaint: true,
                            useCORS: true,
                        }).then((canvas) => {
                            if (document.body.contains(div))
                                document.body.removeChild(div);
                            this.czmTexture.copyFromCanvas(canvas);
                            this.czmCustomPrimitive.uniformMap = {
                                "u_image": {
                                    "type": "texture",
                                    "id": `${this.czmTexture.id}`,
                                },
                                "u_color": [
                                    1,
                                    1,
                                    1,
                                    1
                                ]
                            };
                        }).catch(() => {
                            if (document.body.contains(div))
                                document.body.removeChild(div);
                        });
                    } else {
                        this.czmCustomPrimitive.uniformMap = undefined;
                        this.czmCustomPrimitive.show = false;
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            update();
            // this.dispose(sceneObject.infoChanged.disposableOn(update));
        }
        // 偏移锚点更改
        {
            if (listenAnchor) {
                const update = () => {
                    const anchor = sceneObject.anchor;
                    const offset = sceneObject.offset;
                    let width = 100, height = 100;
                    if (sceneObject.sizeByContent && this.domSize) {
                        width = this.domSize.width / 100;
                        height = this.domSize.height / 100;
                    } else {
                        width = sceneObject.size[0] / 100;
                        height = sceneObject.size[1] / 100;
                    }
                    if (anchor) {
                        // 锚点需要通过缩放比进行计算
                        this.czmCustomPrimitive.localPosition = [anchor[0] * width - offset[0] / 100, 0, anchor[1] * height - offset[1] / 100];
                    } else {
                        this.czmCustomPrimitive.localPosition = [0, 0, 0];
                    }
                }
                update();
                const event = this.ad(createNextAnimateFrameEvent(sceneObject.anchorChanged, sceneObject.offsetChanged));
                this.dispose(event.disposableOn(update))
            }
        }
        // 尺寸切换
        {
            const update = () => {
                let width, height;
                if (sceneObject.sizeByContent && this.domSize) {
                    width = this.domSize.width / 100;
                    height = this.domSize.height / 100;
                } else {
                    width = sceneObject.size[0] / 100;
                    height = sceneObject.size[1] / 100;
                }
                // 设置自定义图元尺寸
                this.czmCustomPrimitive.attributes = {
                    position: {
                        typedArray: new Float32Array([
                            0, 0, 0,
                            0, width, 0,
                            0, width, -height,
                            0, 0, -height,// 正面
                            0, 0, 0,
                            0, width, 0,
                            0, width, -height,
                            0, 0, -height,// 背面
                        ]),
                        componentsPerAttribute: 3,
                    },
                    normal: {
                        typedArray: new Float32Array([
                            0, 0, 1,
                            0, 0, 1,
                            0, 0, 1,
                            0, 0, 1,
                            0, 0, -1,
                            0, 0, -1,
                            0, 0, -1,
                            0, 0, -1,
                        ]),
                        componentsPerAttribute: 3,
                    },
                    textureCoordinates: {
                        typedArray: new Float32Array([
                            1, 1,
                            0, 1,
                            0, 0,
                            1, 0,
                            0, 1,
                            1, 1,
                            1, 0,
                            0, 0,
                        ]),
                        componentsPerAttribute: 2,
                    }
                };
                this.czmCustomPrimitive.boundingVolume = {
                    type: 'LocalAxisedBoundingBox',
                    data: {
                        min: [0, 0, -height],
                        max: [0, width, 0],
                    }
                };
                this.czmCustomPrimitive.localPosition = [sceneObject.anchor[0] * width, 0, sceneObject.anchor[1] * height];
            }
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.sizeChanged,
                sceneObject.sizeByContentChanged,
            ))
            this.dispose(updateEvent.disposableOn(update))
        }
    }
    public flyTo = (duration: number | undefined, id: number) => {
        flyWithPrimitive(this.czmViewer, this.sceneObject, id, duration, this.czmCustomPrimitive, true);
    }
}

class RotationWithCameraResetting extends Destroyable {
    constructor(private _widget3D: Widget3D) {
        super();
        const { sceneObject, czmCustomPrimitive, czmViewer } = this._widget3D;

        {
            const update = () => {
                const ci = czmViewer.getCameraInfo();
                if (!ci) return;
                const r = ci.rotation;
                czmCustomPrimitive.rotation = [
                    r[0] + 180,
                    0 - r[1],//取反
                    r[2]
                ];
            };
            update();
            this.dispose(czmViewer.cameraChanged.disposableOn(update));
        }
    }
}
class RotationWithCameraZResetting extends Destroyable {
    constructor(private _widget3D: Widget3D) {
        super();
        const { sceneObject, czmCustomPrimitive, czmViewer } = this._widget3D;

        const { rotation: r } = sceneObject;
        {
            const update = () => {
                const ci = czmViewer.getCameraInfo();
                if (!ci) return;
                czmCustomPrimitive.rotation = [ci.rotation[0] + 180, r[1], r[2]];
            };
            update();
            this.dispose(czmViewer.cameraChanged.disposableOn(update));
        }
    }
}
class OriginRotationResetting extends Destroyable {
    constructor(private _widget3D: Widget3D) {
        super();
        const { sceneObject, czmCustomPrimitive } = this._widget3D;
        this.dispose(bindNorthRotation([czmCustomPrimitive, 'rotation'], [sceneObject, 'rotation']));
    }
}
