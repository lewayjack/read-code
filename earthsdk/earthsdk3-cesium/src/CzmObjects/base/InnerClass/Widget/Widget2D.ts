import { ESJPickedInfo, ESJWidgetEventInfo, ESPoi2D, ESWidget } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, Destroyable, react, track } from "xbsj-base";
import { getPoi2DDefaultAnchor } from "./getPoi2DDefaultAnchor";
import { defaultFlyToRotation, flyTo, getObjectProperties } from "../../../../utils";
import { GeoCustomDivPoi } from "../../../../CzmObjects";

export class Widget2D extends Destroyable {
    // 自定义div内容
    public widgetInfo: HTMLElement;
    // 创建2D面板
    private _czmGeoCustomDivPoi;
    get czmGeoCustomDivPoi() { return this._czmGeoCustomDivPoi; }
    public sceneObject;
    public domSize: { [xx: string]: any } | undefined = undefined;

    private _defaultAnchor = this.disposeVar(react<[number, number]>([0, 0]));
    get defaultAnchor() { return this._defaultAnchor.value; }
    set defaultAnchor(value: [number, number]) { this._defaultAnchor.value = value; }
    get defaultAnchorChanged() { return this._defaultAnchor.changed; }
    constructor(private _sceneObject: ESWidget | ESPoi2D, private _czmViewer: ESCesiumViewer, private _widgetInfo: HTMLElement, private _drawWidget: boolean, listenAnchor: boolean = true) {
        super();
        this._czmGeoCustomDivPoi = this.disposeVar(new GeoCustomDivPoi(_czmViewer, _sceneObject.id));
        let sceneObject = this.sceneObject = this._sceneObject;
        let czmViewer = this._czmViewer;
        this.widgetInfo = this._widgetInfo;
        {
            if (sceneObject instanceof ESPoi2D) {
                this.defaultAnchor = getPoi2DDefaultAnchor(this.widgetInfo, sceneObject.mode);
            }
        }

        const { czmGeoCustomDivPoi } = this;

        this.d(track([czmGeoCustomDivPoi, 'zOrder'], [sceneObject, 'zOrder']));
        this.dispose(track([czmGeoCustomDivPoi, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmGeoCustomDivPoi, 'position'], [sceneObject, 'position']));
        this.dispose(bind([czmGeoCustomDivPoi, 'editing'], [sceneObject, 'editing']));
        if (sceneObject instanceof ESWidget)
            this.dispose(track([czmGeoCustomDivPoi, 'opacity'], [sceneObject, 'opacity']));
        {
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.allowPickingChanged, sceneObject.editingChanged))
            const update = () => {
                if (sceneObject.allowPicking && !sceneObject.editing) {
                    czmGeoCustomDivPoi.allowPicking = true;
                } else {
                    czmGeoCustomDivPoi.allowPicking = false;
                }
            }
            update();
            this.d(event.don(update));
        }
        {
            this.d(czmGeoCustomDivPoi.pickedEvent.don(pickedInfo => {
                const pointerEvent = getObjectProperties(pickedInfo, "attachedInfo")?.pointerEvent;
                if (!pointerEvent) return;
                // 响应widgetEvent事件
                // 鼠标点击事件
                const eventInfo = {
                    type: pointerEvent.buttons != 0 && pointerEvent.button == 0 ? "leftClick" : pointerEvent.button == 2 ? "rightClick" : undefined,
                    add: { mousePos: [pointerEvent.offsetX, pointerEvent.offsetY] as [number, number] }
                }
                if (eventInfo.type == undefined) {
                    eventInfo.type = pointerEvent.type;
                }
                sceneObject.widgetEvent.emit(eventInfo as ESJWidgetEventInfo)
                // 左键事件，额外进行响应pickedEvent事件
                if (pointerEvent.buttons != 0 && pointerEvent.button == 0 && (sceneObject.allowPicking ?? false)) {
                    sceneObject.pickedEvent.emit(new ESJPickedInfo({ pickedInfo }));
                }
            }))
        }
        // info信息变更
        {
            const update = () => {
                try {
                    if (_drawWidget) {
                        czmGeoCustomDivPoi.instanceClass = this.createInstanceClass();
                    } else {
                        czmGeoCustomDivPoi.instanceClass = undefined;
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            update();
        }
        // 偏移锚点更改
        {
            if (listenAnchor) {
                const update = () => {
                    const anchor = sceneObject.anchor;
                    const offset = sceneObject.offset;
                    if (anchor) {
                        // 锚点需要通过缩放比进行计算
                        czmGeoCustomDivPoi.originRatioAndOffset = [...anchor, -offset[0], -offset[1]];
                        // 修改锚点后需要修改div基准点
                        // this.widgetInfo.style.transformOrigin = `${sceneObject.anchor[0] * 100}% ${sceneObject.anchor[1] * 100}%`
                    } else {
                        czmGeoCustomDivPoi.originRatioAndOffset = [0, 0, 0, 0];
                    }
                }
                update();
                const event = this.ad(createNextAnimateFrameEvent(sceneObject.anchorChanged, sceneObject.offsetChanged));
                this.dispose(event.disposableOn(update))
            }
        }
        // 尺寸切换
        {
            const update = async () => {
                let width, height;
                if (!this.domSize || this.domSize.width == 0 || this.domSize.height == 0) {
                    this.domSize = this.widgetInfo.getBoundingClientRect();
                    if (this.domSize.width == 0 || this.domSize.height == 0) {
                        const time = setTimeout(() => {
                            update();
                            clearTimeout(time);
                        }, 200);
                        return;
                    }
                }
                if (sceneObject.sizeByContent) {
                    width = this.domSize.width;
                    height = this.domSize.height;
                } else {
                    width = sceneObject.size[0];
                    height = sceneObject.size[1];
                }
                // 设置屏幕div尺寸
                this.widgetInfo.style.transform = `scale(${width / this.domSize.width * sceneObject.scale[1]},${height / this.domSize.height * sceneObject.scale[2]})`;
                this.widgetInfo.style.transformOrigin = `${sceneObject.anchor[0] * 100}% ${sceneObject.anchor[1] * 100}%`
            }
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.sizeChanged,
                sceneObject.sizeByContentChanged,
                sceneObject.scaleChanged
            ))
            this.dispose(updateEvent.disposableOn(update))
        }
    }
    public flyTo = (duration: number | undefined, id: number) => {
        if (this.czmGeoCustomDivPoi.position) {
            flyTo(this._czmViewer.viewer, this.czmGeoCustomDivPoi.position, 1000, defaultFlyToRotation, duration);
            return;
        }
        this.czmGeoCustomDivPoi.flyTo(duration && duration * 1000);
    }
    private createInstanceClass = () => {
        let _this = this;
        return class MyDiv extends Destroyable {
            constructor(private _subContainer: HTMLDivElement, czmGeoCustomDivPoi: GeoCustomDivPoi<{ destroy(): undefined }>, viewer?: ESCesiumViewer | undefined) {
                super();
                if (!viewer) return;
                if (!(viewer instanceof ESCesiumViewer)) return;
                const div = _this.widgetInfo;
                this._subContainer.appendChild(div);
                this.dispose(() => {
                    this._subContainer.removeChild(div);
                });
                {
                    const update = () => {
                        div.style.pointerEvents = _this.sceneObject.editing ? "none" : "all";
                    }
                    update();
                    this.d(_this.sceneObject.editingChanged.don(update));
                }

            }
        }
    }
}
