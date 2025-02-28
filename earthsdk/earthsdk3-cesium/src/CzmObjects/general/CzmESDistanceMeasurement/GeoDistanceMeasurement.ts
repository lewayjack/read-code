import { getDistancesFromPositions, inOrderRunning, PickedInfo } from "earthsdk3";
import { CzmPolyline, GeoCustomDivPoi } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createInfoPoi, getPointerEventButton } from "../../../utils";
import { Destroyable, Listener, Event, reactArray, createNextAnimateFrameEvent, reactPositions, extendClassProps, ReactivePropsToNativePropsAndChanged, track, bind, SceneObjectKey } from "xbsj-base";
import { distanceToHumanStr } from "../CzmESAreaMeasurement/utils";

export class GeoDistanceMeasurement extends Destroyable {
    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _distances = this.disposeVar(reactArray<number[]>([]));
    get distances() { return this._distances.value; }
    get distancesChanged() { return this._distances.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();

        const updateDistances = () => { this._distances.value = getDistancesFromPositions(this.positions ?? [], this.arcType as 'NONE' | 'GEODESIC' | 'RHUMB'); }

        updateDistances();
        const updateDistancesEvent = this.disposeVar(createNextAnimateFrameEvent(this.positionsChanged, this.arcTypeChanged));
        this.dispose(updateDistancesEvent.disposableOn(updateDistances));

        const geoPolyline = this.disposeVar(new CzmPolyline(czmViewer, id));

        geoPolyline.loop = false;

        this.dispose(track([geoPolyline, 'allowPicking'], [this, 'allowPicking']));
        this.dispose(bind([geoPolyline, 'arcType'], [this, 'arcType']));
        this.dispose(bind([geoPolyline, 'color'], [this, 'color']));
        this.dispose(bind([geoPolyline, 'dashLength'], [this, 'dashLength']));
        this.dispose(bind([geoPolyline, 'dashPattern'], [this, 'dashPattern']));
        this.dispose(bind([geoPolyline, 'editing'], [this, 'editing']));
        this.dispose(bind([geoPolyline, 'gapColor'], [this, 'gapColor']));
        this.dispose(bind([geoPolyline, 'hasArrow'], [this, 'hasArrow']));
        this.dispose(bind([geoPolyline, 'hasDash'], [this, 'hasDash']));
        this.dispose(bind([geoPolyline, 'positions'], [this, 'positions']));
        this.dispose(bind([geoPolyline, 'show'], [this, 'show']));
        this.dispose(bind([geoPolyline, 'width'], [this, 'width']));
        this.dispose(bind([geoPolyline, 'depthTest'], [this, 'depthTest']));
        this.dispose(bind([geoPolyline, 'ground'], [this, 'strokeGround']));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }
            geoPolyline.flyTo(duration);
        }));

        {
            // 距离标识牌！
            const pois: GeoCustomDivPoi[] = [];
            const resetDistancePois = () => {
                for (let poi of pois) {
                    poi.destroy();
                }
                pois.length = 0;
            }
            this.dispose(resetDistancePois);
            const updateDistancePois = () => {
                resetDistancePois();
                if (!this.positions) return;

                if (this.positions.length > 0) {
                    const poi = createInfoPoi('起点', this.positions[0], czmViewer, id);
                    poi.dispose(track([poi, 'show'], [this, 'show']));
                    poi.dispose(track([poi, 'shadowDom'], [this, 'shadowDom']));
                    poi.dispose(track([poi, 'cssAllInitial'], [this, 'cssAllInitial']));
                    pois.push(poi);
                }

                const dl = this.distances.length;
                for (let i = 0; i < dl; ++i) {
                    const d = this.distances[i];
                    const p = this.positions[i + 1];
                    const poi = createInfoPoi(`长度: ${distanceToHumanStr(d)}`, p, czmViewer, id)
                    poi.dispose(track([poi, 'show'], [this, 'show']));
                    poi.dispose(track([poi, 'shadowDom'], [this, 'shadowDom']));
                    poi.dispose(track([poi, 'cssAllInitial'], [this, 'cssAllInitial']));
                    this.ad(poi.pickedEvent.don((pickedInfo) => {
                        if (getPointerEventButton(pickedInfo) === 0)
                            this.pickedEvent.emit(pickedInfo);
                    }))
                    pois.push(poi);
                }
            };
            updateDistancePois();
            this.dispose(this.distancesChanged.disposableOn(() => inOrderRunning(updateDistancePois)));
        }
    }
    static defaults = {
        // show: true,
        // allowPicking: false,
        // width:2,
        // hasDach:true,
        // gapColor:[1, 1, 1, 1] as [number, number, number, number],
        // dashLength:16,
        // dashPattern:255,
        // hasArrow:true,
        // color: [1, 1, 1, .5] as [number, number, number, number],
        // editing: false,
        // arcType:'GEODESIC',
        positions: [],
    };
}

export namespace GeoDistanceMeasurement {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        positions: reactPositions(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        width: 1, // undfined时为1.0，A numeric Property specifying the width in pixels.
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        hasDash: false,
        gapColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]), // default [0, 0, 0, 0]
        dashLength: 16, // default 16
        dashPattern: 255, // default 255
        hasArrow: false,
        arcType: 'GEODESIC',
        editing: false,
        depthTest: false, //深度检测
        shadowDom: false,
        cssAllInitial: false,
        strokeGround: false,
    });
}
extendClassProps(GeoDistanceMeasurement.prototype, GeoDistanceMeasurement.createDefaultProps);
export interface GeoDistanceMeasurement extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoDistanceMeasurement.createDefaultProps>> { }