// import { GroupProperty, NumberProperty } from ".././../ESJTypes";
// import { ESLocalVector2D } from "../base";
// import { extendClassProps, UniteChanged } from "xbsj-base";

// export class ESLocalRegularPolygon extends ESLocalVector2D {
//     static readonly type = this.register('ESLocalRegularPolygon', this, { chsName: '局部坐标多边形', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESLocalRegularPolygon" });
//     get typeName() { return 'ESLocalRegularPolygon'; }
//     override get defaultProps() { return { ...ESLocalRegularPolygon.createDefaultProps() }; }

//     constructor(id?: string) {
//         super(id);
//     }

//     override getProperties(language?: string) {
//         return [
//             ...super.getProperties(language),
//             new GroupProperty('ESLocalRegularPolygon', 'ESLocalRegularPolygon', [
//                 new NumberProperty('半径', '半径', true, false, [this, 'radius'], 1000000),
//                 new NumberProperty('part', 'part', true, false, [this, 'part']),
//             ]),
//         ];
//     }
// }

// export namespace ESLocalRegularPolygon {
//     export const createDefaultProps = () => ({
//         ...ESLocalVector2D.createDefaultProps(),
//         radius: undefined as number | undefined,
//         part: undefined as number | undefined,
//     });
// }
// extendClassProps(ESLocalRegularPolygon.prototype, ESLocalRegularPolygon.createDefaultProps);
// export interface ESLocalRegularPolygon extends UniteChanged<ReturnType<typeof ESLocalRegularPolygon.createDefaultProps>> { }
