import { ESCesiumViewer } from "../../ESCesiumViewer";
import { ESObjectWithLocation, getDistancesFromPositions } from "earthsdk3";
import { CzmESVisualObject } from "./CzmESVisualObject";
import { CzmESPrsEditing } from "./Editing";
import { SmoothMoveController } from "./SmoothMoveController";
import { getCameraPosition } from "../../utils";
import { createNextAnimateFrameEvent } from "xbsj-base";
import { CzmTexture } from "./InnerClass";
export class CzmESObjectWithLocation<T extends ESObjectWithLocation = ESObjectWithLocation> extends CzmESVisualObject<T> {
    // 单点编辑,子类可以使用自己的编辑器，只需要设置this.sPrsEditing.enabled = false即可。
    private _sPrsEditing;
    get sPrsEditing() { return this._sPrsEditing; }

    private _smoothMoving;
    smoothMove(P: [number, number, number], T: number) {
        this._smoothMoving.isGround = false;
        this._smoothMoving.isRotating = false;
        this._smoothMoving.restart(this.sceneObject.position, this.sceneObject.rotation, 0);
        this._smoothMoving.restart(P, this.sceneObject.rotation, T);
    }
    smoothMoveWithRotation(P: [number, number, number], R: [number, number, number], T: number) {
        this._smoothMoving.isGround = false;
        this._smoothMoving.isRotating = true;
        this._smoothMoving.restart(this.sceneObject.position, this.sceneObject.rotation, 0);
        this._smoothMoving.restart(P, R, T);
    }
    smoothMoveOnGround(Lon: number, Lat: number, T: number) {
        const height = this.czmViewer.getTerrainHeight([Lon, Lat]) ?? 0
        this._smoothMoving.isGround = true;
        this._smoothMoving.isRotating = false;
        this._smoothMoving.restart(this.sceneObject.position, this.sceneObject.rotation, 0);
        this._smoothMoving.restart([Lon, Lat, height], this.sceneObject.rotation, T);
    }
    smoothMoveWithRotationOnGround(R: [number, number, number], Lon: number, Lat: number, T: number) {
        const height = this.czmViewer.getTerrainHeight([Lon, Lat]) ?? 0
        this._smoothMoving.isGround = true;
        this._smoothMoving.isRotating = true;
        this._smoothMoving.restart(this.sceneObject.position, this.sceneObject.rotation, 0);
        this._smoothMoving.restart([Lon, Lat, height], R, T);
    }
    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        // 初始化单点编辑器
        {
            this._sPrsEditing = this.dv(new CzmESPrsEditing(this.czmViewer, [this.sceneObject, "editing"], [this.sceneObject, "position"], [this.sceneObject, "rotation"], {
                rotation: { showHelper: false }
            }));
            this._sPrsEditing.enabled = true;
        }
        {
            this._smoothMoving = this.disposeVar(new SmoothMoveController(this.czmViewer));
            this.d(this._smoothMoving.currentPositionChanged.don((p) => {
                p && (this.sceneObject.position = p);
            }));
            /**
              * 平滑移动+姿态，姿态插值转向
              */
            this.d(this._smoothMoving.currentRotationChanged.don((r) => {
                r && this._smoothMoving.isRotating && (this.sceneObject.rotation = r);
            }));

            /**
             * 平滑移动时，姿态朝向终点
             */
            this.d(this._smoothMoving.currentHeadingChanged.don((h) => {
                if ((h !== undefined) && (!this._smoothMoving.isRotating)) {
                    const r = this.sceneObject.rotation;
                    this.sceneObject.rotation = [h - 90, r[1], r[2]];
                }
            }));
        }
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this.d(sceneObject.smoothMoveEvent.don((Destination, Time) => {
            this.smoothMove(Destination, Time * 1000);
        }));

        this.d(sceneObject.smoothMoveWithRotationEvent.don((Destination, Rotation, Time) => {
            this.smoothMoveWithRotation(Destination, Rotation, Time * 1000);
        }));

        this.d(sceneObject.smoothMoveOnGroundEvent.don((Lon, Lat, Time) => {
            this.smoothMoveOnGround(Lon, Lat, Time * 1000);
        }));

        this.d(sceneObject.smoothMoveWithRotationOnGroundEvent.don((Rotation, Lon, Lat, Time) => {
            this.smoothMoveWithRotationOnGround(Rotation, Lon, Lat, Time * 1000);
        }));
        {
            this.d(sceneObject.calcFlyToParamEvent.don(() => {
                if (!sceneObject.useCalcFlyToParamInESObjectWithLocation) {
                    return;
                }
                if (!sceneObject.position) {
                    console.warn(`!sceneObject(${sceneObject.name}-${sceneObject.id}).position`);
                    return;
                }
                const flyToParam = czmViewer.calcFlyToParam(sceneObject.position);
                if (!flyToParam) {
                    console.warn(`czmViewer.calcFlyToParam error.`);
                    return;
                }
                sceneObject.flyToParam = flyToParam;
            }));
        }
        {
            //自动落地
            this.d(sceneObject.automaticLandingEvent.don((flag) => {
                const posi = [sceneObject.position[0], sceneObject.position[1]] as [number, number]
                const pos = czmViewer.getTerrainHeight(posi)
                if (pos) {
                    sceneObject.position = [...posi, pos]
                } else {
                    console.warn('不存在相交')
                }
                sceneObject.collision = flag
            }));
        }
        {
            //可视距离
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.minVisibleDistanceChanged,
                sceneObject.maxVisibleDistanceChanged,
            ))
            this.d(event.don(() => this.visibleDistance(sceneObject, czmViewer)));
            this.d(czmViewer.viewer.camera.changed.addEventListener(() => this.visibleDistance(sceneObject, czmViewer)))
        }
    }
    visibleDistance(sceneObject: T, czmViewer: ESCesiumViewer) {
        const czmSceneObjects = CzmESObjectWithLocation.getInnerCzmObjects(this);
        if (czmViewer.viewer?.camera && sceneObject.show && czmSceneObjects.length != 0) {
            const dis = getDistancesFromPositions([sceneObject.position, getCameraPosition(czmViewer.viewer.camera)], 'NONE')[0];
            let show = false;
            if (sceneObject.minVisibleDistance < sceneObject.maxVisibleDistance) {
                show = sceneObject.minVisibleDistance < dis && dis < sceneObject.maxVisibleDistance;
            } else if (sceneObject.maxVisibleDistance == 0) {
                show = dis > sceneObject.minVisibleDistance;
            }
            //@ts-ignore
            czmSceneObjects.forEach(item => {
                const tempShow = sceneObject.show && show;
                if (Reflect.has(item, 'showHelper')) {
                    item.showHelper = tempShow;
                }
                if (Reflect.has(item, 'enabled')) {
                    item.enabled = tempShow;
                }
                if (Reflect.has(item, 'show')) {
                    item.show = tempShow;
                }
            })
        }
    }
    static getInnerCzmObjects(czmObject: any): any[] {
        const czmSceneObject = [];
        for (const key in czmObject) {
            if (Object.prototype.hasOwnProperty.call(czmObject, key)) {
                if (!key.includes("czmViewer") && key.includes("czm") || !Number.isNaN(+key)) {
                    if (Array.isArray(czmObject[key])) {
                        czmSceneObject.push(...CzmESObjectWithLocation.getInnerCzmObjects(czmObject[key]))
                    } else {
                        czmSceneObject.push(czmObject[key]);
                    }
                } else if (czmObject[key] && czmObject[key].obj) {
                    czmSceneObject.push(...CzmESObjectWithLocation.getInnerCzmObjects(czmObject[key].obj))
                }
            }
        }
        return czmSceneObject;
    }
    override flyTo(duration: number | undefined, id: number) {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        // 先检查flyToParam能否使用
        if (sceneObject.flyToParam && sceneObject.position) {
            const { position, flyToParam } = sceneObject;
            const { distance, heading, pitch, flyDuration, hDelta, pDelta } = flyToParam;
            this.flyToWithPromise(id, position, distance, [heading, pitch, 0], duration ?? flyDuration, hDelta, pDelta);
            return true;
        }
        return super.flyTo(duration, id);
    }
    // flyIn飞行只有两种情况，一种有flyInParam,一种没有，CzmESObjectWithLocation派生出的类较简单，
    // 无flyInParam直接通过position和rotation即可飞行，无需在派生类重写flyIn
    override flyIn(duration: number | undefined, id: number) {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (!sceneObject.flyInParam && sceneObject.position && sceneObject.rotation) {
            const d = duration ?? 1
            const newRotation: [number, number, number] = [...sceneObject.rotation];
            newRotation[0] += 90;
            this.flyToWithPromise(id, sceneObject.position, undefined, newRotation, d)
            return true;
        }
        return super.flyIn(duration, id);
    }
}