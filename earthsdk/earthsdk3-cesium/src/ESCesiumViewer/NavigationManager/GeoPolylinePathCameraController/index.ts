// PolylinePath
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, ObjResettingWithEvent, UniteChanged, bind, extendClassProps, reactArray, track } from "xbsj-base";
import { PolylinePath } from "../../../CzmObjects";
import { GeoCameraController } from "../GeoSceneObjectCameraController/GeoCameraController";

export class GeoPolylinePathCameraController extends Destroyable {
    private _geoCameraController: GeoCameraController;
    get geoCameraController() { return this._geoCameraController; }

    private _geoPolylinePath: PolylinePath;
    get polylinePath() { return this._geoPolylinePath; }

    constructor(czmViewer: ESCesiumViewer) {
        super();

        this._geoCameraController = this.dv(new GeoCameraController(czmViewer));
        this._geoPolylinePath = this.dv(new PolylinePath(czmViewer));

        this._geoPolylinePath.show = false;
        this._geoPolylinePath.currentTime = 0;

        const update = () => {
            if (this.usePathPosition ?? true) {
                this._geoCameraController.position = this._geoPolylinePath.currentPosition;
            }
            if (this.usePathRotation ?? true) {
                this._geoCameraController.rotation = this._geoPolylinePath.currentRotation;
            }
        };
        update();
        this.d(this._geoPolylinePath.currentPositionChanged.don(update));
        this.d(this._geoPolylinePath.currentRotationChanged.don(update));

        this.dispose(bind([this._geoCameraController, 'enabled'], [this, 'enabled']));
        this.dispose(bind([this._geoCameraController, 'viewDistance'], [this, 'viewDistance']));
        this.dispose(bind([this._geoCameraController, 'offsetHeight'], [this, 'offsetHeight']));
        this.dispose(bind([this._geoCameraController, 'offsetRotation'], [this, 'offsetRotation']));
        this.dispose(track([this._geoCameraController, 'enabledRotationInput'], [this, 'enabledRotationInput']));
        this.dispose(track([this._geoCameraController, 'enabledScaleInput'], [this, 'enabledScaleInput']));

        this.dv(new ObjResettingWithEvent(this.lineModeChanged, () => {
            if (this.lineMode === undefined) return undefined;
            if (this.lineMode === 'auto') {
                return new AutoResetting(this, czmViewer);
            } else if (this.lineMode === 'manual') {
                return new ManualResetting(this, czmViewer);
            }
        }));
    }
    get position() { return this._geoCameraController.position; }
    get positionChanged() { return this._geoCameraController.positionChanged; }
    get rotation() { return this._geoCameraController.rotation; }
    get roataionChanged() { return this._geoCameraController.rotationChanged; }
}

export namespace GeoPolylinePathCameraController {
    export const createDefaultProps = () => ({
        enabled: false,
        usePathPosition: true,
        usePathRotation: true,

        viewDistance: 1000,
        offsetHeight: 0,
        offsetRotation: reactArray<[number, number, number]>([0, -60, 0]),
        enabledRotationInput: true,
        enabledScaleInput: true,
        lineMode: undefined as "auto" | "manual" | undefined,
    });
}
extendClassProps(GeoPolylinePathCameraController.prototype, GeoPolylinePathCameraController.createDefaultProps);
export interface GeoPolylinePathCameraController extends UniteChanged<ReturnType<typeof GeoPolylinePathCameraController.createDefaultProps>> { }



class AutoResetting extends Destroyable {
    constructor(pathCameraController: GeoPolylinePathCameraController, czmViewer: ESCesiumViewer) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) throw new Error('viewer is undefined');
        pathCameraController.offsetRotation = [0, 0, 0];
    }
}
class ManualResetting extends Destroyable {
    constructor(pathCameraController: GeoPolylinePathCameraController, czmViewer: ESCesiumViewer) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) throw new Error('viewer is undefined');
        // 鼠标事件
        const lineKeyEvent = (e: KeyboardEvent) => {
            if (e.key === 'w' || e.key === 's') {
                pathCameraController.polylinePath.playing = e.type === 'keydown';
                pathCameraController.polylinePath.speed = e.key === 'w' || e.type === "keyup" ? 1 : -1;
            }
        }

        this.dispose(czmViewer.keyDownEvent.don(lineKeyEvent));
        this.dispose(czmViewer.keyUpEvent.don(lineKeyEvent));
    }
}
