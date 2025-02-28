import { PickedInfo } from "earthsdk3";
import { CzmPolylines } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { Destroyable, Event, extendClassProps, Listener, reactArray, ReactivePropsToNativePropsAndChanged, reactPositions, SceneObjectKey, track } from "xbsj-base";
/**
 * 坐标轴
 */
export class GeoAxis extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    get startPosition() { return this.positions && this.positions[0] as [number, number, number]; }
    set startPosition(value: [number, number, number] | undefined) {
        this.positions = [value ?? GeoAxis.defaults.positions[0], this.stopPosition ?? GeoAxis.defaults.positions[1]];
    }
    get startPositionChanged() { return this.positionsChanged; }

    get stopPosition() { return this.positions && this.positions[1] as [number, number, number]; }
    set stopPosition(value: [number, number, number] | undefined) {
        this.positions = [this.startPosition ?? GeoAxis.defaults.positions[0], value ?? GeoAxis.defaults.positions[1]];
    }
    get stopPositionChanged() { return this.positionsChanged; }

    static defaults = {
        positions: [[0, 0, 0], [0, 0, 1000000]] as [number, number, number][],
    };

    // private _sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], false, [this, 'editing'], this.components, 2));
    // get sPositionsEditing() { return this._sPositionsEditing; }

    // private _pointEditor = this.disposeVar(new PointEditing([this, 'positions'], [this, 'pointEditing'], this.components));
    // get pointEditor() { return this._pointEditor; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();

        const axis = this;

        // 坐标轴通过箭头线实现
        const polyline = this.disposeVar(new CzmPolylines(czmViewer, id));
        polyline.hasArrow = true;

        {
            const update = () => {
                polyline.arcType = axis.arcType;
            };
            update();
            this.dispose(axis.arcTypeChanged.disposableOn(update));
        }

        {
            const updateProp = () => {
                polyline.show = axis.show;
            };
            updateProp();
            this.dispose(axis.showChanged.disposableOn(updateProp));
        }

        {
            const updateProp = () => {
                polyline.width = axis.width;
            };
            updateProp();
            this.dispose(axis.widthChanged.disposableOn(updateProp));
        }

        {
            const updateProp = () => {
                polyline.color = axis.color;
            };
            updateProp();
            this.dispose(axis.colorChanged.disposableOn(updateProp));
        }

        {
            const updateProp = () => {
                polyline.positions = axis.positions && [axis.positions.map(e => [...e])];
            };
            updateProp();
            this.dispose(axis.startPositionChanged.disposableOn(updateProp));
            this.dispose(axis.stopPositionChanged.disposableOn(updateProp));
        }

        this.dispose(axis.flyToEvent.disposableOn(duration => polyline.flyTo(duration)));

        {
            this.dispose(track([polyline, 'allowPicking'], [axis, 'allowPicking']));
        }

        // this.dispose(this.components.disposableAdd(polyline));
    }
}

export namespace GeoAxis {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility of the box.
        allowPicking: false,
        editing: false,
        pointEditing: false,
        positions: reactPositions(undefined),
        width: 10, // undfined时为1.0，A numeric Property specifying the width in pixels.
        color: reactArray<[number, number, number, number]>([1, 0, 0, 1]), // default [1, 1, 1, 1]
        arcType: 'RHUMB',
    });
}
extendClassProps(GeoAxis.prototype, GeoAxis.createDefaultProps);
export interface GeoAxis extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoAxis.createDefaultProps>> { }
