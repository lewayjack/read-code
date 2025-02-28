import { ESPoi2D } from "earthsdk3";
import { CzmESLabel, Widget2D, Widget3D } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { ImageBaseInfo } from "../../../utils";
import { createNextAnimateFrameEvent, ObjResettingWithEvent, Event } from "xbsj-base";
import { getESPoi2DDiv, getModeImage, replaceStr } from "./fun";

export class CzmESPoi2D extends CzmESLabel<ESPoi2D> {
    static readonly type = this.register("ESCesiumViewer", ESPoi2D.type, this);

    private _widgetComponent: any;
    get widgetComponent() { return this._widgetComponent; }
    set widgetComponent(v: any) { this._widgetComponent = v; }

    // 设置响应式事件，更新类型
    private _updateImageEvent = this.disposeVar(new Event());
    get updateImageEvent() { return this._updateImageEvent; }
    updateImage() { this._updateImageEvent.emit(); }

    private _textBox: ImageBaseInfo[] = [];
    private _iconBox: ImageBaseInfo | undefined = undefined;
    private _icon: ImageBaseInfo | undefined = undefined;
    private _anchor: ImageBaseInfo | undefined = undefined;

    constructor(sceneObject: ESPoi2D, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        {
            // 模式更改需要更新图片
            const update = async (newVal?: string, oldVal?: string) => {
                await getModeImage(sceneObject.mode).then(r => {
                    this._icon = r.icon;
                    this._anchor = r.anchor;
                    this._iconBox = r.iconBox;
                    this._textBox = r.textBox
                });
                this.updateImage()
            }
            update(sceneObject.mode);
            this.d(sceneObject.modeChanged.don((newVal, oldVal) => {
                update(newVal, oldVal);
            }));
        }
        {
            // 名称、屏幕类型、样式、模式都要重新渲染
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.nameChanged,
                sceneObject.screenRenderChanged,
                sceneObject.styleChanged,
                this.updateImageEvent
            ));
            this.widgetComponent = this.disposeVar(new ObjResettingWithEvent(event, () => {
                if (this._textBox.length == 0 && sceneObject.mode != "Linear01") return undefined;
                const contentName = sceneObject.style[Object.keys(sceneObject.style).filter(item => {
                    return item.toUpperCase() == "TEXT";
                })[0]] ?? sceneObject.name;
                const { div: poiDiv, styleObj } = getESPoi2DDiv(sceneObject.mode, contentName, this._textBox, this._iconBox, this._icon, this._anchor);
                poiDiv.innerHTML = replaceStr(poiDiv.innerHTML, styleObj, sceneObject.screenRender);
                if (sceneObject.screenRender) {
                    return new Widget2D(sceneObject, czmViewer, poiDiv, true, false);
                } else {
                    return new Widget3D(sceneObject, czmViewer, poiDiv, true, false);
                }
            }, false));
            this.widgetComponent.objChanged.don(() => {
                //@ts-ignore
                sceneObject.minVisibleDistanceChanged.emit();
            })
        }
        {
            // 自动锚点需要在Widget中通过div进行计算
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.anchorChanged,
                sceneObject.autoAnchorChanged,
                sceneObject.offsetChanged,
            ));
            const update = () => {
                const czmESPoi = this.widgetComponent.obj;
                const anchor: [number, number] = sceneObject.autoAnchor ? czmESPoi.defaultAnchor : sceneObject.anchor;
                const offset = sceneObject.offset;
                if (czmESPoi instanceof Widget2D) {
                    if (anchor) {
                        // 锚点需要通过缩放比进行计算
                        czmESPoi.czmGeoCustomDivPoi.originRatioAndOffset = [...anchor, -offset[0], -offset[1]];
                        // 修改锚点后需要修改div基准点
                        czmESPoi.widgetInfo.style.transformOrigin = `${sceneObject.anchor[0] * 100}% ${sceneObject.anchor[1] * 100}%`
                    } else {
                        czmESPoi.czmGeoCustomDivPoi.originRatioAndOffset = [0, 0, 0, 0];
                    }
                } else {
                    let width = 100, height = 100;
                    if (sceneObject.sizeByContent && czmESPoi.domSize) {
                        width = czmESPoi.domSize.width / 100;
                        height = czmESPoi.domSize.height / 100;
                    } else {
                        width = sceneObject.size[0] / 100;
                        height = sceneObject.size[1] / 100;
                    }
                    if (anchor) {
                        // 锚点需要通过缩放比进行计算
                        czmESPoi.czmCustomPrimitive.localPosition = [anchor[0] * width - offset[0] / 100, 0, anchor[1] * height - offset[1] / 100];
                    } else {
                        czmESPoi.czmCustomPrimitive.localPosition = [0, 0, 0];
                    }
                }
            }
            this.d(event.don(update));
            this.d(this.widgetComponent.objChanged.don(() => {
                if (this.widgetComponent.obj == undefined) return;
                update();
                this.d(this.widgetComponent.obj.defaultAnchorChanged.don(update));
            }))
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, widgetComponent } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (widgetComponent.obj) {
                widgetComponent.obj.flyTo(duration, id);
            } else {
                const time = setTimeout(() => {
                    clearTimeout(time);
                    this.flyTo(duration, id);
                }, 200)
            }
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
