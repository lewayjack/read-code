import * as Cesium from 'cesium';
import { ESJNavigationMode, ESJVector3D, ESSceneObject, getDistancesFromPositions } from "earthsdk3";
import { Destroyable } from "xbsj-base";
import { getIncludedAngleFromPositions } from '../../utils';
import { ESCesiumViewer } from "../index";
import { clearHandler, FirstPersonController, KeyboardCameraController, look3D } from "./FirstPersonController";
import { GeoPolylinePathCameraController } from './GeoPolylinePathCameraController';
import { GeoSceneObjectCameraController } from "./GeoSceneObjectCameraController";
import { RotateGlobe } from "./RotateGlobe";
import { RotatePoint } from "./RotatePoint";
export class NavigationManager extends Destroyable {
    private _firstPersonController: FirstPersonController;
    get firstPersonController() { return this._firstPersonController; }

    private _rotateGlobe: RotateGlobe;
    get rotateGlobe() { return this._rotateGlobe; }

    private _rotatePoint: RotatePoint;
    get rotatePoint() { return this._rotatePoint; }

    private _followController: GeoSceneObjectCameraController;
    get followController() { return this._followController; }

    private _pathCameraController: GeoPolylinePathCameraController;
    get pathCameraController() { return this._pathCameraController; }

    private _handler?: Cesium.ScreenSpaceEventHandler;
    resetNavigation() {
        // 第一人称漫游
        this._firstPersonController.keyboardEnabled = false;
        // 旋转地球
        this._rotateGlobe.cancel();
        // 旋转点
        this._rotatePoint.cancel();
        //跟踪模式
        this._followController.enabled = false;
        this._followController.sceneObjectId = undefined;
        this._followController.geoCameraController.offsetRotation = [0, 0, 0];
        this._followController.geoCameraController.viewDistance = 0;
        // 沿线漫游
        this._pathCameraController.enabled = false;
        this._pathCameraController.polylinePath.playing = false;
        this._pathCameraController.polylinePath.currentTime = 0;
        this._pathCameraController.polylinePath.loop = false;
        this._pathCameraController.geoCameraController.offsetHeight = 0;
        this._pathCameraController.polylinePath.positions = undefined;
        this._pathCameraController.lineMode = undefined;
    }
    changeToMap() {
        this.resetNavigation();
        this._changedMouseEvent('Map');
    }

    changeToWalk(position: ESJVector3D) {
        this.resetNavigation();
        this._changedMouseEvent('Walk');
        const res = this._viewer.getCameraInfo();
        const ro = [res?.rotation[0] ?? 0, 0, 0] as ESJVector3D;
        this._viewer.flyIn(position, ro);
        // 开启第一人称漫游
        this.firstPersonController.keyboardEnabled = true
        this.firstPersonController.keyboardCameraController.speed = 0.006 //6m/s
        this.firstPersonController.keyboardCameraController.keyStatusMap = {
            "ShiftLeft": "WithCamera",
            "ShiftRight": "WithCamera",
            "KeyW": "MoveForward",
            "KeyS": "MoveBackword",
            "KeyA": "MoveLeft",
            "KeyD": "MoveRight",
            "ArrowUp": "MoveForward",
            "ArrowDown": "MoveBackword",
            "ArrowLeft": "RotateLeft",
            "ArrowRight": "RotateRight",
            "KeyR": "SpeedUp",
            "KeyF": "SpeedDown",
            "KeyQ": "SwitchAlwaysWithCamera"
        }
    }
    changeToRotateGlobe(latitude: number = 38.0, height: number = 10000000, cycleTime: number = 60) {
        this.resetNavigation();
        this._changedMouseEvent('RotateGlobe');
        this._rotateGlobe.latitude = latitude;
        this._rotateGlobe.height = height;
        this._rotateGlobe.cycle = cycleTime;
        this._rotateGlobe.start();
    }
    changeToRotatePoint(position: ESJVector3D, distance: number = 50000, orbitPeriod: number = 60, heading: number = 0, pitch: number = -30) {
        this.resetNavigation();
        this._changedMouseEvent('RotatePoint');
        this._rotatePoint.position = position;
        this._rotatePoint.distance = distance;
        this._rotatePoint.cycle = orbitPeriod;
        this._rotatePoint.heading = heading;
        this._rotatePoint.pitch = pitch;
        this._rotatePoint.start();
    }
    changeToFollow(objectId: string, distance: number = 0, heading: number = 0, pitch: number = -30, relativeRotation: boolean = false) {
        this.resetNavigation();
        this._changedMouseEvent('Follow');
        this._followController.sceneObjectId = objectId;
        this._followController.geoCameraController.offsetRotation = [heading, pitch, 0];
        this._followController.geoCameraController.relativeRotation = relativeRotation;
        if (distance !== 0) {
            this._followController.geoCameraController.viewDistance = distance;
        } else {
            // const esObject = ESSceneObject.getSceneObjById(objectId); // 获取ES对象
            // if (!esObject) {
            //     console.warn("未获取到ES对象,请检查输入的ES对象ID是否正常");
            //     return;
            // }
            // let czmObject = this._viewer.getCzmObject(esObject);

            // if (!czmObject || !(czmObject instanceof CzmESObjectWithLocation) || !(czmObject.czmModelPrimitive || czmObject.czmCustomPrimitive)) {
            //     console.warn("无法获取内部对象包围盒,请检查输入的ES对象ID是否正常");
            //     return;
            // }
            // //@ts-ignore
            // let czmPrimitive = this._viewer.getCzmObject(czmObject.czmModelPrimitive ?? czmObject.czmCustomPrimitive) as CzmCzmCustomPrimitive | CzmCzmModelPrimitive;
            // const cav = getCav(this.innerViewer, czmPrimitive);
            // if (cav == undefined) return;
            //TODO: 获取模型包围盒
            this._followController.geoCameraController.viewDistance = 1000;
        }
        this._followController.enabled = true;
    }
    changeToLine(geoLineStringId: string, speed: number = 10, heightOffset: number = 10, loop: boolean = true, turnRateDPS: number = 10, lineMode: "auto" | "manual" = "auto") {
        this.resetNavigation();
        this._changedMouseEvent('Line');

        const lineModeIsAuto = (lineMode === "auto");
        const sceneObject = ESSceneObject.getSceneObjById(geoLineStringId);
        if (!sceneObject) return;
        // @ts-ignore
        const { points } = sceneObject;
        if (!points) return;
        // 获取线段长度
        const distances = getDistancesFromPositions(points, 'NONE');
        const totalDistance = distances[distances.length - 1];
        // 修改默认视距
        this._pathCameraController.viewDistance = 0;
        this._pathCameraController.polylinePath.positions = [...points]
        this._pathCameraController.polylinePath.duration = totalDistance / speed * 1000;
        this._pathCameraController.polylinePath.loop = loop;
        this._pathCameraController.offsetHeight = heightOffset;
        // 计算每个拐弯角总的拐弯距离
        const includedAngles = getIncludedAngleFromPositions(points);
        this._pathCameraController.polylinePath.rotationRadius = !lineModeIsAuto || includedAngles == false ? [0] : includedAngles.map((item: number) => (item / turnRateDPS) * speed);
        // 鼠标控制
        this._pathCameraController.enabledRotationInput = !lineModeIsAuto;
        this._pathCameraController.enabledScaleInput = false;
        this._pathCameraController.polylinePath.playing = lineModeIsAuto;
        this._pathCameraController.lineMode = lineMode;//控制自动漫游和手动键盘w/s漫游
        this._pathCameraController.enabled = true;
    }

    constructor(private _viewer: ESCesiumViewer) {
        super();
        //第一人称漫游
        {
            this._firstPersonController = this.dv(new FirstPersonController(_viewer));
            this.d(this._viewer.keyDownEvent.don(e => this._firstPersonController.keyboardCameraController.keyDown(e)));
            this.d(this._viewer.keyUpEvent.don(e => this._firstPersonController.keyboardCameraController.keyUp(e)));
            {
                const { subContainer } = this._viewer;
                if (!subContainer) throw new Error(`_firstPersonControllerInit error!`);
                const blurFunc = () => this._firstPersonController.keyboardCameraController.abort();
                subContainer.addEventListener('blur', blurFunc, false);
                this.d(() => subContainer.removeEventListener('blur', blurFunc, false));
            }

            {//init
                this._firstPersonController.keyboardEnabled = false;
                this._firstPersonController.mouseEnabled = false;
                this._firstPersonController.keyboardCameraController.speed = 1;
                this._firstPersonController.keyboardCameraController.rotateSpeed = 0.01;
                this._firstPersonController.keyboardCameraController.alwaysWithCamera = false;
                this._firstPersonController.keyboardCameraController.keyStatusMap = KeyboardCameraController.defaultKeyStatusMap;
            }
            {
                // 避免mouseEnabled按键以后，主窗口就失去焦点。。
                this.d(this._firstPersonController.keyboardEnabledChanged.don(() => { this._viewer.subContainer?.focus(); }));
            }
        }
        //全球旋转
        {
            this._rotateGlobe = this.dv(new RotateGlobe(_viewer));
        }
        //绕点旋转
        {
            this._rotatePoint = this.dv(new RotatePoint(_viewer));
        }
        //跟随对象
        {
            this._followController = this.dv(new GeoSceneObjectCameraController(_viewer));
        }
        //沿线漫游
        {
            this._pathCameraController = this.dv(new GeoPolylinePathCameraController(_viewer));
        }

    }

    // 更改鼠标事件
    private _changedMouseEvent(currentMode?: ESJNavigationMode) {
        const viewer = this._viewer.viewer;
        if (!viewer) return;
        if (!this._handler) {
            this._handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        }
        const handler = this._handler;
        const screenSpaceCameraController = viewer.scene.screenSpaceCameraController;
        this.d(() => { handler && clearHandler(handler) });
        if (currentMode == 'Walk' || currentMode == 'RotateGlobe') {
            screenSpaceCameraController.lookEventTypes = undefined;
            screenSpaceCameraController.rotateEventTypes = undefined;
            screenSpaceCameraController.tiltEventTypes = undefined;
            screenSpaceCameraController.zoomEventTypes = undefined;
            screenSpaceCameraController.translateEventTypes = undefined;
            if (handler && currentMode == 'Walk') {
                handler.setInputAction((event: any) => {
                    handler.setInputAction((eventMove: any) => {
                        look3D(viewer.scene, eventMove, screenSpaceCameraController);
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                    // 清除事件
                    handler.setInputAction((event: any) => {
                        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
                    }, Cesium.ScreenSpaceEventType.LEFT_UP);
                }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

                handler.setInputAction((event: any) => {
                    handler.setInputAction((eventMove: any) => {
                        look3D(viewer.scene, eventMove, screenSpaceCameraController);
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                    // 清除事件
                    handler.setInputAction((event: any) => {
                        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                        handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_UP);
                    }, Cesium.ScreenSpaceEventType.RIGHT_UP);
                }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

                handler.setInputAction((event: any) => {
                    handler.setInputAction((eventMove: any) => {
                        look3D(viewer.scene, eventMove, screenSpaceCameraController);
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                    // 清除事件
                    handler.setInputAction((event: any) => {
                        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                        handler.removeInputAction(Cesium.ScreenSpaceEventType.MIDDLE_UP);
                    }, Cesium.ScreenSpaceEventType.MIDDLE_UP);
                }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
            }
        } else {
            handler && clearHandler(handler);
            screenSpaceCameraController.lookEventTypes = Cesium.CameraEventType.RIGHT_DRAG;
            screenSpaceCameraController.rotateEventTypes = Cesium.CameraEventType.LEFT_DRAG;
            screenSpaceCameraController.tiltEventTypes = [
                Cesium.CameraEventType.MIDDLE_DRAG, Cesium.CameraEventType.PINCH,
                { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL },
                { eventType: Cesium.CameraEventType.RIGHT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL }
            ]
            screenSpaceCameraController.translateEventTypes = Cesium.CameraEventType.LEFT_DRAG;
            screenSpaceCameraController.zoomEventTypes = [
                Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH,
                { eventType: Cesium.CameraEventType.RIGHT_DRAG, modifier: Cesium.KeyboardEventModifier.SHIFT }
            ]
        }

    }
}
