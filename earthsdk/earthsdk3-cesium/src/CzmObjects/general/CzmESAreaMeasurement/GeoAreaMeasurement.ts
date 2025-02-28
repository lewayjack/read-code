import { PickedInfo } from "earthsdk3";
import { CzmESGeoPolygonImpl, CzmPolyline, GeoCustomDivPoi } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, Listener, Event, react, reactArrayWithUndefined, reactArray, reactPositions, extendClassProps, ReactivePropsToNativePropsAndChanged, bind, track, createNextAnimateFrameEvent, SceneObjectKey, createGuid } from "xbsj-base";
import { areaToHumanStr, distanceToHumanStr, updateArea, updateCenterOfMass, updateDistances } from "./utils";
import { createInnerHtmlWithWhiteTextBlackBackground, getPointerEventButton } from "../../../utils";

export class GeoAreaMeasurement extends Destroyable {
    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _area = this.disposeVar(react<number>(0));
    get area() { return this._area.value; }
    get areaChanged() { return this._area.changed; }

    private _centerOfMass = this.disposeVar(reactArrayWithUndefined<[number, number, number] | undefined>(undefined));
    get centerOfMass() { return this._centerOfMass.value; }
    get centerOfMassChanged() { return this._centerOfMass.changed; }

    private _distances = this.disposeVar(reactArray<number[]>([]));
    get distances() { return this._distances.value; }
    get distancesChanged() { return this._distances.changed; }

    private _geoPolyline;
    get geoPolyline() { return this._geoPolyline; }

    get sPositionsEditing() { return this.geoPolyline.sPositionsEditing; }

    static defaults = {
        // show: true,
        // allowPicking: false,
        // width: 2,
        positions: [],
        // color: [1, 1, 1, .5] as [number, number, number, number],
        // hasDash: true,
        // gapColor: [1, 1, 1, .5] as [number, number, number, number],
        // dashLength: 16,
        // dashPattern: 255,
        // editing: false,
    }

    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }
    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        {
            const update = () => {
                this._distances.value = updateDistances(this.positions);
                this._area.value = updateArea(this.positions);
                this._centerOfMass.value = updateCenterOfMass(this.positions)
            }
            update();
            const updateDistancesEvent = this.disposeVar(createNextAnimateFrameEvent(this.positionsChanged));
            this.dispose(updateDistancesEvent.disposableOn(update));
        }

        // geoPolyline
        {
            const geoPolyline = this._geoPolyline = this.disposeVar(new CzmPolyline(czmViewer, id));
            geoPolyline.loop = true;
            geoPolyline.arcType = 'GEODESIC';
            this.dispose(bind([geoPolyline, 'color'], [this, 'color']));
            this.dispose(bind([geoPolyline, 'dashLength'], [this, 'dashLength']));
            this.dispose(bind([geoPolyline, 'dashPattern'], [this, 'dashPattern']));
            this.dispose(bind([geoPolyline, 'editing'], [this, 'editing']));
            this.dispose(bind([geoPolyline, 'gapColor'], [this, 'gapColor']));
            this.dispose(bind([geoPolyline, 'hasArrow'], [this, 'hasArrow']));
            this.dispose(bind([geoPolyline, 'hasDash'], [this, 'hasDash']));
            this.dispose(bind([geoPolyline, 'positions'], [this, 'positions']));
            this.dispose(bind([geoPolyline, 'show'], [this, 'show']));
            this.dispose(bind([geoPolyline, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(bind([geoPolyline, 'width'], [this, 'width']));
            this.dispose(bind([geoPolyline, 'depthTest'], [this, 'depthTest']));
            this.dispose(bind([geoPolyline, 'ground'], [this, 'strokeGround']));
        }

        //GeoPolygon
        {
            const geoPolygon = this.disposeVar(new CzmESGeoPolygonImpl(czmViewer, id));
            geoPolygon.outline = false;
            const updatePositions = () => {
                geoPolygon.positions = this.positions;
            };
            updatePositions();
            this.dispose(this.positionsChanged.disposableOn(updatePositions));
            const updateMaterial = () => {
                const c = this.fillColor
                geoPolygon.color = [c[0], c[1], c[2], c[3] * 0.5];
            }
            updateMaterial();
            this.dispose(this.fillColorChanged.disposableOn(updateMaterial));
            this.dispose(track([geoPolygon, 'show'], [this, 'show']));
            this.dispose(track([geoPolygon, 'ground'], [this, 'ground']));
            this.dispose(track([geoPolygon, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(bind([geoPolygon, 'depthTest'], [this, 'depthTest']));
            this.d(this.flyToEvent.don((duration) => {
                geoPolygon.flyTo(duration);
            }))
        }

        // poi
        {
            const poi = this.disposeVar(new GeoCustomDivPoi(czmViewer, id));
            const divPoiChanged = this.disposeVar(createNextAnimateFrameEvent(this.areaChanged, this.centerOfMassChanged, this.distancesChanged));
            const updateDivPoi = () => {
                if (this.distances.length === 0) {
                    poi.innerHTML = '';
                    return;
                }
                const areaStr = `面积: ${areaToHumanStr(this.area)}`;
                const distanceStr = `周长: ${distanceToHumanStr(this.distances[this.distances.length - 1])}`;
                poi.innerHTML = createInnerHtmlWithWhiteTextBlackBackground([areaStr, distanceStr].join('\n'));
            }
            updateDivPoi();
            this.dispose(divPoiChanged.disposableOn(updateDivPoi));

            this.dispose(track([poi, 'show'], [this, 'show']));
            this.dispose(track([poi, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(bind([poi, 'shadowDom'], [this, 'shadowDom']));
            this.dispose(bind([poi, 'cssAllInitial'], [this, 'cssAllInitial']));
            this.dispose(track([poi, 'position'], [this, 'centerOfMass']));
            this.ad(poi.pickedEvent.don((pickedInfo) => {
                if (getPointerEventButton(pickedInfo) === 0)
                    this.pickedEvent.emit(pickedInfo);
            }))

        }
    }
}

export namespace GeoAreaMeasurement {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        positions: reactPositions(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        width: 2, // undfined时为1.0，A numeric Property specifying the width in pixels.
        color: reactArray<[number, number, number, number]>([1, 1, 1, .5]), // default [1, 1, 1, 1]
        fillColor: reactArray<[number, number, number, number]>([1, 1, 1, .5]), // default [1, 1, 1, 1]
        hasDash: false,
        gapColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]), // default [0, 0, 0, 0]
        dashLength: 16, // default 16
        dashPattern: 255, // default 255
        hasArrow: undefined as boolean | undefined,
        editing: false,
        depthTest: false, //深度检测
        shadowDom: false,
        cssAllInitial: false,
        strokeGround: true,
        ground: true,
    });
}
extendClassProps(GeoAreaMeasurement.prototype, GeoAreaMeasurement.createDefaultProps);
export interface GeoAreaMeasurement extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoAreaMeasurement.createDefaultProps>> { }
