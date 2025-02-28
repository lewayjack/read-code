import { Destroyable, react, ObjResettingWithEvent } from "xbsj-base";
import { FirstPersonController } from "../FirstPersonController";
import { MouseCameraControllerRunning } from "./MouseCameraControllerRunning";

export class MouseCameraController extends Destroyable {
    get firstPersonController() { return this._firstPersonController; }

    private _enabled = this.dv(react<boolean>(false));
    get enabled() { return this._enabled.value; }
    set enabled(value: boolean) { this._enabled.value = value; }
    get enabledChanged() { return this._enabled.changed; }

    enableViewerOriginInputs = (value: boolean) => {
        if (value) {
            this.firstPersonController.czmViewer.incrementDisabledInputStack();
        } else {
            this.firstPersonController.czmViewer.decrementDisabledInputStack();
        }
    };

    private _mouseResetting = this.dv(new ObjResettingWithEvent(this.enabledChanged, () => {
        if (!this.enabled) return undefined;
        return new MouseCameraControllerRunning(this);
    }));
    get mouseResetting() { return this._mouseResetting; }

    constructor(private _firstPersonController: FirstPersonController) {
        super();
    }
}
