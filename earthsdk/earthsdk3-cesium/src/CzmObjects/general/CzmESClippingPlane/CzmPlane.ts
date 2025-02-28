import * as Cesium from 'cesium';
import { CzmPolylinesPrimitive, GeoAxis, PositionEditing, PrsEditing, RotationEditing } from '../../../CzmObjects';
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { computeCzmModelMatrix, flyTo } from '../../../utils';
import { Event, createNextAnimateFrameEvent, Destroyable, extendClassProps, Listener, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, track, react, createGuid } from 'xbsj-base';
function computeSkeleton(
    minSize: [number, number],
    maxSize: [number, number],
    finalMatrix: Cesium.Matrix4
) {
    const l = minSize;
    const b = maxSize;

    const w = ((b[0] - l[0]) + (b[1] - l[1])) / 4;

    // lineSkeleton;
    const lp: [number, number, number][] = [
        [l[0], 0, l[1]],
        [b[0], 0, l[1]],
        [b[0], 0, b[1]],
        [l[0], 0, b[1]],
        [0, w, 0],
    ];
    const td = Cesium.Math.toDegrees;
    const wp: [number, number, number][] = lp.map(e => {
        const cartesian = Cesium.Matrix4.multiplyByPoint(finalMatrix, Cesium.Cartesian3.fromElements(...e), new Cesium.Cartesian3());
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        return [td(carto.longitude), td(carto.latitude), carto.height];
    });
    const polylinesPositions: [number, number, number][][] = [
        [wp[0], wp[1], wp[2], wp[3], wp[0]],
    ];
    return [polylinesPositions, wp[4]] as [[number, number, number][][], [number, number, number]];
}


export class CzmPlane extends Destroyable {
    private _id = this.disposeVar(react<string>(createGuid()));
    get id() { return this._id.value; }
    set id(value: string) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        position: [116.39, 39.9, 100] as [number, number, number],
    };

    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    private _sRotationEditing;
    get sRotationEditing() { return this._sRotationEditing; }

    private _sPrsEditing;
    get sPrsEditing() { return this._sPrsEditing; }

    private _polylines;
    get polylines() { return this._polylines; }

    private _axis;
    get axis() { return this._axis; }
    constructor(czmViewer: ESCesiumViewer, id?: string) {
        super();
        id && (this.id = id);
        this._sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'positionEditing'], czmViewer));
        this._sRotationEditing = this.disposeVar(new RotationEditing([this, 'position'], [this, 'rotation'], [this, 'rotationEditing'], czmViewer, {
            showHelper: false,
        }));
        this._sPrsEditing = this.disposeVar(new PrsEditing([this, 'position'], [this, 'rotation'], [this, 'editing'], czmViewer, {
            rotation: {
                showHelper: false,
            }
        }));
        this._polylines = this.disposeVar(new CzmPolylinesPrimitive(czmViewer, id));
        this._axis = this.disposeVar(new GeoAxis(czmViewer, id));
        this._polylines.arcType = this._axis.arcType = 'NONE';
        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!(czmViewer instanceof ESCesiumViewer)) return;
            if (!czmViewer.actived) return;
            if (!this.position) {
                console.warn(`CzmPlane warning: 没有位置，无法飞入！`);
                return;
            }
            const l = this.minSize;
            const b = this.maxSize;
            const s = [b[0] - l[0], b[1] - l[1]] as [number, number];
            const d = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
            flyTo(czmViewer.viewer, this.position, d * 2, undefined, duration);
        }));
        // this.registerAttachedObjectForContainer((viewer) => {
        //     const disposer = new Destroyable();
        //     disposer.dispose(this.flyToEvent.disposableOn(duration => {
        //         if (!(viewer instanceof CzmViewer)) return;
        //         if (!viewer.actived) return;
        //         if (!this.position) {
        //             console.warn(`CzmPlane warning: 没有位置，无法飞入！`);
        //             return;
        //         }
        //         const l = this.minSize;
        //         const b = this.maxSize;
        //         const s = [b[0] - l[0], b[1] - l[1]] as [number, number];
        //         const d = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
        //         viewer.flyTo(this.position, d * 2, undefined, duration);
        //     }));
        //     return disposer;
        // });

        {
            const update = () => {
                let polylinesPositions: [number, number, number][][] = [];
                let arrowPosition: [number, number, number] | undefined = undefined;
                do {
                    if (!this.position) break;

                    const posRotMatrix = computeCzmModelMatrix({
                        position: this.position,
                        rotation: this.rotation,
                    });
                    if (!posRotMatrix) break;
                    const result = computeSkeleton(this.minSize, this.maxSize, posRotMatrix);
                    polylinesPositions = result[0];
                    arrowPosition = result[1];
                } while (false);
                this.polylines.positions = polylinesPositions;

                if (!this.position || !arrowPosition) return;
                this.axis.positions = [this.position, arrowPosition];
            }
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this.positionChanged,
                this.rotationChanged,
                this.minSizeChanged,
                this.maxSizeChanged,
            ));
            this.dispose(event.disposableOn(update));
        }

        {
            this.dispose(track([this.polylines, 'color'], [this, 'color']));
            this.dispose(track([this.polylines, 'width'], [this, 'width']));
            this.dispose(track([this.polylines, 'show'], [this, 'show']));
        }

        {
            this.dispose(track([this.axis, 'color'], [this, 'color']));
        }

        {
            const update = () => {
                this.axis.show = this.show && this.showArrow;
            };
            update();
            this.dispose(this.showChanged.disposableOn(update))
            this.dispose(this.showArrowChanged.disposableOn(update))
        }
    }
}

export namespace CzmPlane {
    export const createDefaultProps = () => ({
        show: true,
        showArrow: true,
        editing: false,
        positionEditing: false,
        rotationEditing: false,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单
        rotation: reactArray<[number, number, number]>([0, 0, 0]), // 偏航俯仰翻转，度为单位
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        width: 2,
        minSize: reactArray<[number, number]>([-100, -100]),
        maxSize: reactArray<[number, number]>([100, 100]),
    });
}
extendClassProps(CzmPlane.prototype, CzmPlane.createDefaultProps);
export interface CzmPlane extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPlane.createDefaultProps>> { }