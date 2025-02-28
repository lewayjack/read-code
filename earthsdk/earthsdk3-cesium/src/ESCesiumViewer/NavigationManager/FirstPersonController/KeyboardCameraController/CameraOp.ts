import * as Cesium from 'cesium';
import { Destroyable } from "xbsj-base";
import { moveForward, moveRight } from "../fixes/move";
import { KeyboardCameraControllerRunning } from "./KeyboardCameraControllerRunning";

export class CameraOp extends Destroyable {
    get running() { return this._running; }
    get controller() { return this.running.keyboardCameraController; }

    // static keyStatusMap: { [k: string]: CameraActionType; } = {
    //     ShiftLeft: 'WithCamera',
    //     ShiftRight: 'WithCamera',
    //     KeyW: 'MoveForward',
    //     KeyS: 'MoveBackword',
    //     KeyA: 'MoveLeft',
    //     KeyD: 'MoveRight',
    //     ArrowUp: 'MoveForward',
    //     ArrowDown: 'MoveBackword',
    //     ArrowLeft: 'MoveLeft',
    //     ArrowRight: 'MoveRight',
    // };

    private _actions: { [k: string]: boolean; } = {
        MoveForward: false,
        MoveBackword: false,
        MoveLeft: false,
        MoveRight: false,
    };
    get actions() { return this._actions; }
    private _resetActions() {
        const ks = Object.keys(this._actions);
        for (let k of ks) {
            this._actions[k] = false;
        }
    }

    private _updateActions() {
        const { running } = this;
        const { keyStatus } = running;
        const { actions } = this;
        this._resetActions();
        const { keyStatusMap } = this.running.keyboardCameraController;
        for (let keyId of keyStatus.currentKeyIds) {
            actions[keyStatusMap[keyId]] = true;
        }
    }

    constructor(private _running: KeyboardCameraControllerRunning) {
        super();

        const { controller } = this;
        const { viewer } = controller.firstPersonController;
        const { camera } = viewer;

        {
            this.dispose(this.running.keyStatus.currentKeyIdsChanged.disposableOn(() => {
                this._updateActions();
            }));
        }

        {
            this.dispose(this.controller.keyDownEvent.disposableOn((e) => {
                const { keyStatusMap } = this.running.keyboardCameraController;
                if (keyStatusMap[e.code] === 'SpeedUp') {
                    this.controller.speed = this.controller.speed * 2;
                } else if (keyStatusMap[e.code] === 'SpeedDown') {
                    this.controller.speed = this.controller.speed * 0.5;
                }
            }));
        }

        {
            this.dispose(this.controller.keyDownEvent.disposableOn((e) => {
                const { keyStatusMap } = this.running.keyboardCameraController;
                if (keyStatusMap[e.code] === 'SwitchAlwaysWithCamera') {
                    this.controller.alwaysWithCamera = !this.controller.alwaysWithCamera;
                }
            }));
        }

        {
            const { actions } = this;
            let lastTimeStamp = Date.now();
            const update = () => {
                const currentTimeStamp = Date.now();
                const d = currentTimeStamp - lastTimeStamp;
                lastTimeStamp = currentTimeStamp;

                const speed = this.controller.speed;

                if (actions.WithCamera || this.controller.alwaysWithCamera) {
                    if (actions.MoveForward) {
                        camera.moveForward(d * speed);
                    }
                    if (actions.MoveBackword) {
                        camera.moveBackward(d * speed);
                    }
                    if (actions.MoveLeft) {
                        camera.moveLeft(d * speed);
                    }
                    if (actions.MoveRight) {
                        camera.moveRight(d * speed);
                    }
                } else {
                    if (actions.MoveForward) {
                        moveForward(camera, d * speed);
                    }
                    if (actions.MoveBackword) {
                        moveForward(camera, -d * speed);
                    }
                    if (actions.MoveLeft) {
                        moveRight(camera, -d * speed);
                    }
                    if (actions.MoveRight) {
                        moveRight(camera, d * speed);
                    }
                }

                {
                    const { rotateSpeed } = this.controller;

                    const r = Cesium.Math.toRadians(rotateSpeed * d);
                    if (actions.RotateRight) {
                        camera.lookRight(r);
                    } else if (actions.RotateLeft) {
                        camera.lookRight(-r);
                    } else if (actions.RotateUp) {
                        camera.lookDown(-r);
                    } else if (actions.RotateDown) {
                        camera.lookDown(r);
                    }
                }
            };
            viewer.scene.preUpdate.addEventListener(update);
            this.dispose(() => viewer.scene.preUpdate.removeEventListener(update));
        }
    }
}
