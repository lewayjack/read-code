import { ESGeoDivTextPoi } from "earthsdk3";
import { CzmESEditing, CzmESObjectWithLocation, GeoDivTextPoi } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, track } from "xbsj-base";

export class CzmESGeoDivTextPoi<T extends ESGeoDivTextPoi = ESGeoDivTextPoi> extends CzmESObjectWithLocation<T> {
    static readonly type = this.register<ESGeoDivTextPoi, ESCesiumViewer>('ESCesiumViewer', ESGeoDivTextPoi.type, this);
    private _czmDivTextPoi;
    get czmDivTextPoi() { return this._czmDivTextPoi; }

    private _sEditing;
    get sEditing() { return this._sEditing; }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmDivTextPoi = this.disposeVar(new GeoDivTextPoi(czmViewer, sceneObject.id));
        this._sEditing = this.disposeVar(new CzmESEditing(this.czmViewer, [this.sceneObject, 'editing'], [this.sceneObject, 'position']));
        this.sPrsEditing.enabled = false;

        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmDivTextPoi = this._czmDivTextPoi;
        this.dispose(track([czmDivTextPoi, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmDivTextPoi, 'position'], [sceneObject, 'position']));
        this.dispose(bind([czmDivTextPoi, 'textEditingInteraction'], [sceneObject, 'textEditingInteraction']));
        this.dispose(bind([czmDivTextPoi, 'textEditing'], [sceneObject, 'textEditing']));
        this.dispose(bind([czmDivTextPoi, 'width'], [sceneObject, 'width']));
        this.dispose(bind([czmDivTextPoi, 'text'], [sceneObject, 'text']));
        this.dispose(track([czmDivTextPoi, 'originRatioAndOffset'], [sceneObject, 'originRatioAndOffset']));
        this.dispose(track([czmDivTextPoi, 'opacity'], [sceneObject, 'opacity']));
        this.dispose(bind([czmDivTextPoi, 'fontSize'], [sceneObject, 'fontSize']));
        this.dispose(track([czmDivTextPoi, 'color'], [sceneObject, 'color']));
        this.dispose(track([czmDivTextPoi, 'backgroundColor'], [sceneObject, 'backgroundColor']));
        this.dispose(track([czmDivTextPoi, 'borderRadius'], [sceneObject, 'borderRadius']));
        this.dispose(track([czmDivTextPoi, 'borderColor'], [sceneObject, 'borderColor']));
        this.dispose(track([czmDivTextPoi, 'borderWidth'], [sceneObject, 'borderWidth']));
        this.dispose(track([czmDivTextPoi, 'textAlign'], [sceneObject, 'textAlign']));
        this.dispose(track([czmDivTextPoi, 'borderStyle'], [sceneObject, 'borderStyle']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmDivTextPoi } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            czmDivTextPoi.flyTo(duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
