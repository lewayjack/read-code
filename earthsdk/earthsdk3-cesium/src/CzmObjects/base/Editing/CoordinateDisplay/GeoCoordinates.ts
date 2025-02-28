import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { GeoAxis } from "./GeoAxis";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged } from "xbsj-base";
import { geoRhumbDestination } from "earthsdk3";

function createAxis(czmViewer: ESCesiumViewer, color: [number, number, number, number]) {
    const axis = new GeoAxis(czmViewer);
    axis.width = 10;
    axis.color = color;
    return axis;
}

/**
 * 坐标架
 */
export class GeoCoordinates extends Destroyable {

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        // show: true as boolean, // boolean} [show=true] A boolean Property specifying the visibility of the box.
        position: [116.39, 39.9, 0] as [number, number, number], // 经度纬度高度，度为单位
        heading: 0 as number, // 偏航角，度为单位
        dimensions: [1000, 1000, 1000] as [number, number, number], // Cartesian3} [dimensions] A {@link Cartesian3} Property specifying the length, width, and height of the box.
        xAxisColor: [1, 0, 0, 1] as [number, number, number, number],
        yAxisColor: [0, 1, 0, 1] as [number, number, number, number],
        zAxisColor: [0, 0, 1, 1] as [number, number, number, number],
    };

    constructor(czmViewer: ESCesiumViewer) {
        super();

        const coordinates = this;

        const xAxis = this.disposeVar(createAxis(czmViewer, GeoCoordinates.defaults.xAxisColor));
        const yAxis = this.disposeVar(createAxis(czmViewer, GeoCoordinates.defaults.yAxisColor));
        const zAxis = this.disposeVar(createAxis(czmViewer, GeoCoordinates.defaults.zAxisColor));

        this.dispose(coordinates.flyToEvent.disposableOn(duration => zAxis.flyTo(duration)));

        {
            const updateProp = () => {
                xAxis.show = coordinates.show as boolean;
                yAxis.show = coordinates.show as boolean;
                zAxis.show = coordinates.show as boolean;
            };
            updateProp();
            this.dispose(coordinates.showChanged.disposableOn(updateProp));
        }

        {
            const updateProp = () => {
                const {
                    position = GeoCoordinates.defaults.position,
                    heading = GeoCoordinates.defaults.heading,
                } = coordinates;

                xAxis.startPosition = position;
                yAxis.startPosition = position;
                zAxis.startPosition = position;

                const [l, b, h] = position;
                const { dimensions = GeoCoordinates.defaults.dimensions } = coordinates;

                zAxis.stopPosition = [l, b, h + dimensions[2]];

                const xd = geoRhumbDestination(position, dimensions[0], 90 + heading);
                xd && (xAxis.stopPosition = xd);

                const yd = geoRhumbDestination(position, dimensions[1], 0 + heading);
                yd && (yAxis.stopPosition = yd);
            };
            updateProp();

            const nfe = this.disposeVar(createNextAnimateFrameEvent(coordinates.positionChanged, coordinates.dimensionsChanged, coordinates.headingChanged));
            this.dispose(nfe.disposableOn(updateProp));
        }

        {
            const updateProp = () => {
                xAxis.color = coordinates.xAxisColor ?? GeoCoordinates.defaults.xAxisColor;
                yAxis.color = coordinates.yAxisColor ?? GeoCoordinates.defaults.yAxisColor;
                zAxis.color = coordinates.zAxisColor ?? GeoCoordinates.defaults.zAxisColor;
            };
            updateProp();
            const nfe = this.disposeVar(createNextAnimateFrameEvent(coordinates.xAxisColorChanged, coordinates.yAxisColorChanged, coordinates.zAxisColorChanged));
            this.dispose(nfe.disposableOn(updateProp));
        }
    }
}

export namespace GeoCoordinates {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility of the box.
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        heading: 0, // 偏航角，度为单位
        dimensions: reactArray<[number, number, number]>([1000, 1000, 1000]), // Cartesian3} [dimensions] A {@link Cartesian3} Property specifying the length, width, and height of the box.
        xAxisColor: reactArray<[number, number, number, number]>([1, 0, 0, 1]),
        yAxisColor: reactArray<[number, number, number, number]>([0, 1, 0, 1]),
        zAxisColor: reactArray<[number, number, number, number]>([0, 0, 1, 1]),
    });
}
extendClassProps(GeoCoordinates.prototype, GeoCoordinates.createDefaultProps);
export interface GeoCoordinates extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoCoordinates.createDefaultProps>> { }
