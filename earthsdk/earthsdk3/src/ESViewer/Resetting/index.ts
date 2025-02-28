import { createAnimateFrame, createNextAnimateFrameEvent, Destroyable, track } from "xbsj-base";
import { ESViewer } from "../index";

function arraysAreEqual(arr1: number[], arr2: number[]) {
    return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}

/**
 * 光照时间与动画模拟时间同步
 */
export class TimeSyncEventResetting extends Destroyable {
    constructor(private _viewer: ESViewer) {
        super();
        this.d(track([this._viewer, 'currentTime'], [this._viewer, 'simulationTime']));
    }
    // constructor(private _viewer: ESViewer) {
    //     super();
    //     const updateEvent = this.dv(createNextAnimateFrameEvent(
    //         this._viewer.simulationTimeChanged,
    //         this._viewer.timeSyncChanged
    //     ));
    //     const update = () => {
    //         if (!this._viewer.timeSync) return;
    //         this._viewer.currentTime = this._viewer.simulationTime;
    //     }
    //     this.d(updateEvent.don(update));
    // }
}


//视口同步
export class SyncEventResetting extends Destroyable {
    constructor(private _viewer: ESViewer, private _activeViewer: ESViewer) {
        super();
        const reactProps = ESViewer.createCommonProps();
        const createNextAnimateFrameList: any[] = []
        Object.keys(reactProps).forEach(item => {
            //@ts-ignore
            const event = this._activeViewer[item + 'Changed']
            createNextAnimateFrameList.push(event)
        })
        //监听activeViewer的属性更改同步其他所有视口
        const updateEvent = this.dv(createNextAnimateFrameEvent(...createNextAnimateFrameList));

        //同步属性
        const updateProp = () => {
            if (this._viewer.status !== 'Created' || this._activeViewer.status !== 'Created') return;
            Object.keys(reactProps).forEach(item => {
                //@ts-ignore
                this._viewer[item] = this._activeViewer[item]
            })
        }
        this.d(updateEvent.don(updateProp));

        //定时器视角同步 50ms同步飞行一次
        // const viewInterval = window.setInterval(() => {
        //     const cameraInfo = this._activeViewer.getCurrentCameraInfo();
        //     const cameraInfo1 = this._viewer.getCurrentCameraInfo();
        //     if (!cameraInfo) return;
        //     const { position, rotation } = cameraInfo;
        //     if (cameraInfo1 && arraysAreEqual(cameraInfo.position, cameraInfo1.position) && arraysAreEqual(cameraInfo.rotation, cameraInfo1.rotation)) return;
        //     this._viewer.flyIn(position, rotation, 0)
        // }, 20)
        // this.d(() => clearInterval(viewInterval))


        //帧同步
        const animate = this.dv(createAnimateFrame());
        animate.restart(undefined, async () => {
            if (this._viewer.status !== 'Created' || this._activeViewer.status !== 'Created') return;
            const cameraInfo = this._activeViewer.getCurrentCameraInfo();
            const cameraInfo1 = this._viewer.getCurrentCameraInfo();
            if (!cameraInfo) return;
            const { position, rotation } = cameraInfo;
            if (cameraInfo1 && arraysAreEqual(position, cameraInfo1.position) && arraysAreEqual(rotation, cameraInfo1.rotation)) return;
            this._viewer.flyIn(position, rotation, 0);
        });
        this.d(() => animate.cancel())
    }
}
