import { extendClassProps, react, UniteChanged } from "xbsj-base";
import { BooleanProperty, ESJFillStyle, GroupProperty, Number2Property, Number3Property, NumberProperty } from "../../ESJTypes";
import { geoPolygonFromCircle } from "../../utils";
import { ESLocalVector2D } from "../base";

export class ESLocalCircle extends ESLocalVector2D {
    static readonly type = this.register('ESLocalCircle', this, { chsName: '局部坐标圆形', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESLocalCircle" });
    get typeName() { return 'ESLocalCircle'; }
    override get defaultProps() { return { ...ESLocalCircle.createDefaultProps() }; }

    private _area = this.dv(react(0));
    get area() { return this._area.value; }
    get areaChanged() { return this._area.changed; }

    private _perimeter = this.dv(react(0));
    get perimeter() { return this._perimeter.value; }
    get perimeterChanged() { return this._perimeter.changed; }

    toPolygon(steps: number = 10, units?: string) {
        const polygon = geoPolygonFromCircle([...this.position], this.radius, steps, units)
        return polygon[0].map(e => { return [...e, this.position ? this.position[2] : 0] as [number, number, number] });
    }

    static override defaults = {
        ...ESLocalVector2D.defaults,
        fillStyle: {
            color: [1, 1, 1, 0.5],
            material: '',
            materialParams: {}
        } as ESJFillStyle,
    }

    constructor(id?: string) {
        super(id);
        this.radius = 1;
        this.filled = true;
        this.stroked = false;
        this.collision = false;
        this.strokeColor = [1, 1, 1, 1];
        this.fillColor = [1, 1, 1, 0.5];

        const update = () => {
            this._area.value = Math.PI * this.radius * this.radius;
            this._perimeter.value = 2 * Math.PI * this.radius;
        }
        update();
        this.d(this.radiusChanged.don(update));
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'style',
            basic: [
                ...properties.basic,
                new NumberProperty('圆半径', '圆半径', true, false, [this, 'radius'], 1),
            ],
            general: [
                ...properties.general,
            ],
            dataSource: [
                ...properties.dataSource,
            ],
            location: [
                // ...properties.location,
            ],
            coordinate: [
                // ...properties.coordinate,
                new BooleanProperty('是否编辑', '是否编辑', false, false, [this, 'editing']),
                new NumberProperty('面积', '面积', false, true, [this, 'area']),
                new NumberProperty('周长', '周长', false, true, [this, 'perimeter']),
                new Number3Property('三维坐标', '三维坐标', true, false, [this, 'position'], [0, 0, 0]),
            ],
            style: [
                ...properties.style,
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESLocalCircle', 'ESLocalCircle', [
                new NumberProperty('圆半径', '圆半径', false, false, [this, 'radius']),
                new NumberProperty('面积', '面积', false, true, [this, 'area']),
                new NumberProperty('周长', '周长', false, true, [this, 'perimeter'])
            ]),
        ];
    }
}

export namespace ESLocalCircle {
    export const createDefaultProps = () => ({
        ...ESLocalVector2D.createDefaultProps(),
        radius: 1,
    });
}
extendClassProps(ESLocalCircle.prototype, ESLocalCircle.createDefaultProps);
export interface ESLocalCircle extends UniteChanged<ReturnType<typeof ESLocalCircle.createDefaultProps>> { }
