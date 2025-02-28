import { ESCesiumViewer } from "../../ESCesiumViewer";
import { EngineObject, ESViewer, ESVisualObject } from "earthsdk3";
export class CzmESVisualObject<T extends ESVisualObject = ESVisualObject, V extends ESCesiumViewer = ESCesiumViewer> extends EngineObject<T, V> {
    constructor(sceneObject: T, czmViewer: V) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this.d(sceneObject.flyToEvent.don((duration, id) => this.flyTo(duration, id)))
        this.d(sceneObject.flyInEvent.don((duration, id) => this.flyIn(duration, id)));
        this.dispose(sceneObject.calcFlyInParamEvent.disposableOn(() => {
            if (!czmViewer.actived) return;
            const cameraInfo = czmViewer.getCameraInfo();
            if (!cameraInfo) return;
            const { position, rotation } = cameraInfo;
            sceneObject.flyInParam = { position, rotation, flyDuration: 1 };
        }));
        this.dispose(sceneObject.calcFlyToParamEvent.disposableOn(() => {
            if (!sceneObject.useCalcFlyToParamInESObjectWithLocation) {
                console.warn('calcFlyToParam无法调用,该对象缺少position属性!');
            }
        }));
    }
    /**
     * 
     * @param id 
     * @param position 
     * @param viewDistance 
     * @param rotation 
     * @param duration 注意单位是秒
     * @param hdelta 
     * @param pdelta 
     */
    protected flyToWithPromise(
        id: number,
        position: [number, number, number],
        viewDistance?: number | undefined,
        rotation?: [number, number, number] | undefined,
        duration?: number | undefined,
        hdelta?: number | undefined,
        pdelta?: number | undefined) {

        const { sceneObject, czmViewer } = this;
        const p = czmViewer.flyTo({
            distance: viewDistance ?? 0,
            heading: rotation ? rotation[0] : 0,
            pitch: rotation ? rotation[1] : 0,
            flyDuration: duration ?? 1,
            hDelta: hdelta ?? 0,
            pDelta: pdelta ?? 0
        }, position);
        if (!p) {
            // sceneObject.flyOverEvent.emit(id, 'error', czmViewer);
        } else {
            p.then(r => {
                // sceneObject.flyOverEvent.emit(id, r ? 'over' : 'cancelled', czmViewer);
            });
        }
    }
    /**
     * 
     * @param duration 注意ES对象的时间单位都是秒
     * @param id 
     * @returns 
     */
    flyTo(duration: number | undefined, id: number) {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;

        //没有position属性flyToParam存在报错！！
        if (sceneObject.flyToParam) {
            // if (!(Reflect.has(sceneObject, 'position'))) {
            if (!sceneObject.useCalcFlyToParamInESObjectWithLocation) {
                console.warn('flyToParam无法使用,该对象缺少position属性,若飞行失败,请清空flyToParam后重试!');
            }
        }

        // 再检查flyInParam能否使用
        if (sceneObject.flyInParam) {
            const { position, rotation, flyDuration } = sceneObject.flyInParam;
            const d = duration ?? flyDuration;
            this.flyToWithPromise(id, position, undefined, rotation, d);
            return true;
        }

        return false;
    }
    /**
     * 
     * @param duration 注意ES对象的时间单位都是秒
     * @param id 
     * @returns 
     */
    flyIn(duration: number | undefined, id: number) {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        // 检查flyInParam能否使用
        if (sceneObject.flyInParam) {
            const { position, rotation, flyDuration } = sceneObject.flyInParam;
            const d = duration ?? flyDuration;
            this.flyToWithPromise(id, position, undefined, rotation, d);
            return true;
        }
        return false;
    }
    get czmViewer() {
        return this.viewer as ESCesiumViewer;
    }

}
