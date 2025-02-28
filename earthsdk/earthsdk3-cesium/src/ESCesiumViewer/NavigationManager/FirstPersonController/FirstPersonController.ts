import { Destroyable } from 'xbsj-base';
import { KeyboardCameraController } from './KeyboardCameraController';
import { MouseCameraController } from './MouseCameraController';
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import * as Cesium from 'cesium';

export class FirstPersonController extends Destroyable {
    viewer: Cesium.Viewer;
    get czmViewer() { return this._viewer; }

    private _mouseCameraController = this.dv(new MouseCameraController(this));
    get mouseCameraController() { return this._mouseCameraController; }

    get mouseEnabled() { return this.mouseCameraController.enabled; }
    set mouseEnabled(value: boolean) { this.mouseCameraController.enabled = value; }
    get mouseEnabledChanged() { return this.mouseCameraController.enabledChanged; }

    private _keyboardCameraController = this.dv(new KeyboardCameraController(this));
    get keyboardCameraController() { return this._keyboardCameraController; }

    get keyboardEnabled() { return this.keyboardCameraController.enabled; }
    set keyboardEnabled(value: boolean) { this.keyboardCameraController.enabled = value; }
    get keyboardEnabledChanged() { return this.keyboardCameraController.enabledChanged; }

    constructor(private _viewer: ESCesiumViewer) {
        super();
        if (!this._viewer.viewer) throw new Error('Cesium.Viewer不存在!');
        this.viewer = this._viewer.viewer;
    }
}
