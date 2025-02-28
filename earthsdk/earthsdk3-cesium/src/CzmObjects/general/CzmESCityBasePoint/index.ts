import { ESCityBasePoint } from "earthsdk3";
import { CzmESObjectWithLocation, CzmESPrsEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPrimitive } from "../../../utils";
import { bind, react, track } from "xbsj-base";
import { CzmCityBasePoint } from "./CzmCityBasePoint";

export class CzmESCityBasePoint extends CzmESObjectWithLocation<ESCityBasePoint> {
    static readonly type = this.register("ESCesiumViewer", ESCityBasePoint.type, this);
    private _czmCityBasePoint;
    get czmCityBasePoint() { return this._czmCityBasePoint; }

    private _sCzmESPrsEditing;
    get sCzmESPrsEditing() { return this._sCzmESPrsEditing; }

    constructor(sceneObject: ESCityBasePoint, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmCityBasePoint = this.disposeVar(new CzmCityBasePoint(czmViewer, sceneObject.id));
        // 初始化单点编辑器
        {
            // 禁用基类编辑器
            this.sPrsEditing.enabled = false;
            this._sCzmESPrsEditing = this.dv(new CzmESPrsEditing(this.czmViewer, [this.sceneObject, "editing"], [this.sceneObject, "position"], [this.sceneObject, "rotation"], {
                rotation: { showHelper: false }
            }));
            this._sCzmESPrsEditing.enabled = true;
        }
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmCityBasePoint = this._czmCityBasePoint;

        this.dispose(track([czmCityBasePoint, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmCityBasePoint, 'scale'], [sceneObject, 'scale']));
        this.dispose(track([czmCityBasePoint, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(track([czmCityBasePoint, 'color'], [sceneObject, 'color']));
        this.dispose(track([czmCityBasePoint, 'color'], [sceneObject, 'color']));
        this.dispose(bind([czmCityBasePoint, 'position'], [sceneObject, 'position']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmCityBasePoint } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            flyWithPrimitive(czmViewer, sceneObject, id, duration, czmCityBasePoint.cylinderCustomPrimitive, true);
            return true;
        }
    }
}
