import { ESCameraView } from "earthsdk3";
import { CzmESObjectWithLocation, CzmView } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind } from "xbsj-base";

export class CzmESCameraView extends CzmESObjectWithLocation<ESCameraView> {
    static readonly type = this.register("ESCesiumViewer", ESCameraView.type, this);
    private _view;
    get view() { return this._view; }

    constructor(sceneObject: ESCameraView, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._view = this.disposeVar(new CzmView(czmViewer, sceneObject.id));
        // ESCameraView旋转编辑时，需要设置初始heading角度朝北
        if (this.sPrsEditing.prsEditing) {
            this.sPrsEditing.prsEditing.sRotationEditing.geoRotator.rotation = [0, 0, 0];
        }

        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const { view } = this;
        this.dispose(bind([view, 'position'], [sceneObject, 'position']));
        // CzmESCameraView不能用bindNorthRotation，因为，它就是需要0为正北朝向
        // this.dispose(bindNorthRotation([view, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(bind([view, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(bind([view, 'thumbnail'], [sceneObject, 'thumbnail']));
        this.dispose(bind([view, 'duration'], [sceneObject, 'duration']));
        view.show = false

        this.dispose(sceneObject.flyInEvent.disposableOn(duration => {
            view.flyTo((sceneObject.duration ?? (duration ?? 1)))
        }));


        if (!view.position && !view.rotation) {
            view.resetWithCurrentCamera(CzmView.ResetFlag.Position | CzmView.ResetFlag.Rotation | CzmView.ResetFlag.ViewDistance);
        }

        //view.resetWithCurrentCamera(CzmView.ResetFlag.Position | CzmView.ResetFlag.Rotation | CzmView.ResetFlag.ViewDistance);
        this.dispose(sceneObject.resetWithCurrentCameraEvent.disposableOn(() => {
            view.resetWithCurrentCamera(CzmView.ResetFlag.Position | CzmView.ResetFlag.Rotation | CzmView.ResetFlag.ViewDistance);
        }));

        this.dispose(sceneObject.captureEvent.disposableOn((x, y) => {
            const { thumbnailWidth, thumbnailHeight } = ESCameraView.defaults;
            view.capture(x ?? thumbnailWidth, y ?? thumbnailHeight);
        }));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, view } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            view.flyTo(duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
