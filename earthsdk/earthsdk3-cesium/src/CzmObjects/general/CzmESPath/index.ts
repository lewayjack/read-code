import { ESJVector3D, ESPath } from "earthsdk3";
import { CzmESGeoLineString } from "../CzmESGeoLineString";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { CzmSignalTransmission } from "../../../CzmObjects";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import { multipleArrows, singleArrow } from "./data";
import { flyWithPositions } from "../../../utils";

export class CzmESPath<T extends ESPath = ESPath> extends CzmESGeoLineString<T> {
    static override readonly type = this.register<ESPath, ESCesiumViewer>("ESCesiumViewer", ESPath.type, this);
    private _signal;
    get signal() { return this._signal; }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._signal = this.disposeVar(new CzmSignalTransmission(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const signal = this._signal;

        // this.dispose(track([signal, 'show'], [sceneObject, 'show']));
        // this.dispose(bind([signal, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([signal, 'positions'], [sceneObject, 'points']));
        this.dispose(track([signal, 'allowPicking'], [sceneObject, 'allowPicking']));
        // this.dispose(track([signal, 'color'], [sceneObject, 'strokeColor']));
        signal.color = [1, 1, 1, 1]
        // 尽量不要在实现类设置场景对象的属性！ vtxf 20231026
        // sceneObject.strokeColor = [0, 0, 0, 0];
        // sceneObject.strokeWidth = ESPath.defaults.strokedWidth;
        // sceneObject.strokeWidthType = ESPath.defaults.strokedWidthType

        {
            const update = () => {
                signal.show = sceneObject.show && sceneObject.materialMode !== "pureColor" && sceneObject.stroked;
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.strokedChanged,
                sceneObject.materialModeChanged,

            ))
            this.d(event.don(update));
        }
        {
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.pointsChanged,
                sceneObject.speedChanged,
                sceneObject.materialModeChanged,
                sceneObject.strokeWidthChanged,
                sceneObject.strokeMaterialParamsChanged
            ));
            this.dispose(updateEvent.disposableOn(() => update()));
            const multipleArrowsUrl = multipleArrows;
            const singleArrowUrl = singleArrow;

            const update = () => {
                if (!(sceneObject.points && sceneObject.points.length >= 2)) return;
                // const distance = getDistancesFromPositions(sceneObject.points ?? [], 'NONE').reduce((a, b) => a + b, 0);
                signal.width = sceneObject.strokeWidth * 2;

                //单个箭头延伸率
                //@ts-ignore
                const elongation = (sceneObject.strokeMaterialParams?.Elongation) ?? 5;
                const distance = this.sceneObject.getDistance() ?? 0;
                const repeat = Math.ceil(distance / (10 * elongation));
                // const dis = repeat * 30;
                const dis = repeat;
                signal.repeat = repeat;
                const speed = sceneObject.speed;
                signal.duration = ((distance / dis) / speed) * 1000;//箭头长度化点；m/s转毫秒
                // signal.duration = (distance / speed) * 1000;//箭头长度化点；m/s转毫秒

                const mode = sceneObject.materialMode;
                // 兼容旧的属性，后期不支持设置purple和blue
                if (mode === 'singleArrow' || mode === "purple") {
                    signal.imageUrl = singleArrowUrl;
                } else if (mode === 'multipleArrows' || mode === "blue") {
                    signal.imageUrl = multipleArrowsUrl;
                }
            }

            update()
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, signal } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (signal.positions) {
                flyWithPositions(czmViewer, sceneObject, id, signal.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, signal } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (signal.positions) {
                flyWithPositions(czmViewer, sceneObject, id, signal.positions, duration);
                return true;
            }
            return false;
        }
    }
}