import { MouseMoving } from "./MouseMoving";
import { MouseCameraController } from "./MouseCameraController";
import { Destroyable } from "xbsj-base";

export class MouseCameraControllerRunning extends Destroyable {
    static origin_setPointerCapture = Element.prototype.setPointerCapture;

    get mouseCameraController() { return this._mouseCameraController; }
    get firstPersonController() { return this.mouseCameraController.firstPersonController; }

    private _mouseMoving = this.dv(new MouseMoving(this.firstPersonController, this.mouseCameraController));
    get mouseMoving() { return this._mouseMoving; }

    constructor(private _mouseCameraController: MouseCameraController) {
        super();
        const { viewer } = this.firstPersonController;

        this.mouseCameraController.enableViewerOriginInputs(false);
        this.dispose(() => this.mouseCameraController.enableViewerOriginInputs(true));

        // 为了修正浏览器的报错信息
        Element.prototype.setPointerCapture = () => { };
        this.dispose(() => Element.prototype.setPointerCapture = MouseCameraControllerRunning.origin_setPointerCapture);

        const canvas = viewer.canvas;
        canvas.requestPointerLock();
        this.dispose(() => document.exitPointerLock());

        {
            const pointerlockchangeFunc = () => {
                if (document.pointerLockElement !== canvas) {
                    this.firstPersonController.mouseEnabled = false;
                }
            };
            // pointer lock event listeners  
            // Hook pointer lock state change events for different browsers
            document.addEventListener('pointerlockchange', pointerlockchangeFunc, false);
            this.dispose(() => document.removeEventListener('pointerlockchange', pointerlockchangeFunc, false));
        }

        {
            const pointerlockerrorFunc = () => {
                this.firstPersonController.mouseEnabled = false;
                console.log('Error locking pointer');
            };
            document.addEventListener('pointerlockerror', pointerlockerrorFunc);
        }
    }
}
