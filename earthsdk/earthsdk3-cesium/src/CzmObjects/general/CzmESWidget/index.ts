import { ESSceneObject, ESWidget } from "earthsdk3";
import { CzmESLabel, Widget2D, Widget3D } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, ObjResettingWithEvent } from "xbsj-base";
import { getWidgetDiv } from "./getWidgetDiv";
import { imgUrlToBase64 } from "../../../utils";

export class CzmESWidget extends CzmESLabel<ESWidget> {
    static readonly type = this.register("ESCesiumViewer", ESWidget.type, this);

    // 存储widget组件
    private _widgetTemp: any;
    get widgetTemp() { return this._widgetTemp; }
    set widgetTemp(val) { this._widgetTemp = val }

    constructor(sceneObject: ESWidget, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        (async () => {
            const basePath = "${earthsdk3-assets-script-dir}/assets/img/Info/";
            const InfoBackGround = await imgUrlToBase64(ESSceneObject.context.getStrFromEnv(basePath + '/InfoBackGround.png'));
            const InfoItemRowBackGround = await imgUrlToBase64(ESSceneObject.context.getStrFromEnv(basePath + '/InfoItemRowBackGround.png'))
            // 屏幕世界模式切换
            {
                const event = this.dv(createNextAnimateFrameEvent(sceneObject.screenRenderChanged, sceneObject.infoChanged));
                this.widgetTemp = this.disposeVar(new ObjResettingWithEvent(event, () => {
                    const div = getWidgetDiv(sceneObject, InfoItemRowBackGround, InfoBackGround);
                    if (sceneObject.screenRender) {
                        return new Widget2D(sceneObject, czmViewer, div, Object.keys(sceneObject.info).length != 0);
                    } else {
                        return new Widget3D(sceneObject, czmViewer, div, Object.keys(sceneObject.info).length != 0);
                    }
                }))
            }
        })()
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, widgetTemp } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (widgetTemp) {
                widgetTemp.obj.flyTo(duration, id);
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
