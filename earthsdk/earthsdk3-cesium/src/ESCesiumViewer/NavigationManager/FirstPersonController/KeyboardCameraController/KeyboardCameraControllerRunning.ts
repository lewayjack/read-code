import { Destroyable } from "xbsj-base";
import { KeyStatus } from "./KeyStatus";
import { CameraOp } from "./CameraOp";
import { KeyboardCameraController } from "./KeyboardCameraController";


export class KeyboardCameraControllerRunning extends Destroyable {
    get keyboardCameraController() { return this._keyboardCameraController; }
    private _keyStatus: KeyStatus;
    get keyStatus() { return this._keyStatus; }

    private _cameraOp: CameraOp;
    get cameraOp() { return this._cameraOp; }

    constructor(private _keyboardCameraController: KeyboardCameraController) {
        super();

        this._keyStatus = this.dv(new KeyStatus(this));
        this._cameraOp = this.dv(new CameraOp(this));
    }
}
