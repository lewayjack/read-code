import { ESUEWidget } from "earthsdk3";
import { CzmESObjectWithLocation, GeoDivSwitchPoi } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { defaultFlyToRotation, flyTo } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";

export class CzmESUEWidget extends CzmESObjectWithLocation<ESUEWidget> {
    static readonly type = this.register("ESCesiumViewer", ESUEWidget.type, this);
    private _czmGeoDivSwitchPoi;
    get czmGeoDivSwitchPoi() { return this._czmGeoDivSwitchPoi; }

    constructor(sceneObject: ESUEWidget, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmGeoDivSwitchPoi = this.disposeVar(new GeoDivSwitchPoi(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmGeoDivSwitchPoi = this._czmGeoDivSwitchPoi;
        czmGeoDivSwitchPoi.showIcon = false;

        this.d(track([czmGeoDivSwitchPoi, 'zOrder'], [sceneObject, 'zOrder']));
        this.dispose(track([czmGeoDivSwitchPoi, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmGeoDivSwitchPoi, 'text'], [sceneObject, 'info'], (val: Object | undefined) => Object.values(val ?? { title: '请输入内容' }).join()));
        this.dispose(bind([czmGeoDivSwitchPoi, 'position'], [sceneObject, 'position']));
        const updateAnchor = () => {
            const anchor = sceneObject.anchor;
            const offset = sceneObject.offset;
            if (anchor) {
                czmGeoDivSwitchPoi.originRatioAndOffset = [...anchor, -offset[0], -offset[1]];
            } else {
                czmGeoDivSwitchPoi.originRatioAndOffset = [0, 0, 0, 0];
            }
        }
        const event = this.ad(createNextAnimateFrameEvent(sceneObject.anchorChanged, sceneObject.offsetChanged));
        this.dispose(event.disposableOn(() => updateAnchor()));
        updateAnchor();
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmGeoDivSwitchPoi } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmGeoDivSwitchPoi.position) {
                flyTo(this.czmViewer.viewer, czmGeoDivSwitchPoi.position, 1000, defaultFlyToRotation, duration);
                return true;
            }
            czmGeoDivSwitchPoi.flyTo(duration && duration * 1000);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
