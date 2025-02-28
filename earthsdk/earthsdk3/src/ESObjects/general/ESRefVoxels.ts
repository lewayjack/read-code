// import { BooleanProperty, ESJVector3D, ESJVector4D, GroupProperty, JsonProperty, NumberProperty, StringProperty } from "../../ESJTypes";
// import { ESObjectWithLocation } from "../base";
// import { extendClassProps, reactArray, reactJsonWithUndefined, UniteChanged } from "xbsj-base";

// export type ColorConfigType = { v: number; c: ESJVector4D };

// export class ESRefVoxels extends ESObjectWithLocation {
//     static readonly type = this.register('ESRefVoxels', this, { chsName: 'ESRefVoxels', tags: ['ESObjects', '_ES_Impl_Cesium'], description: "ESRefVoxels" });
//     get typeName() { return 'ESRefVoxels'; }
//     override get defaultProps() { return ESRefVoxels.createDefaultProps(); }

//     static override defaults = {
//         ...ESObjectWithLocation.defaults,
//         // url: 'http://localhost:8081/REF2023-09-01_08_08_00.txt',
//         url: '',
//         // postion 在基类中
//         position: [120.22459512, 30.2313458, 15] as ESJVector3D,
//         dimensions: [100, 100, 10] as ESJVector3D,
//         resolution: 250,
//         nearestSample: false,
//         alphaBlend: true,
//         alpha: 1,
//         clipMinX: -1,
//         clipMaxX: 1,
//         clipMinY: -1,
//         clipMaxY: 1,
//         clipMinZ: -1,
//         clipMaxZ: 1,
//         colorLegend: [{
//             v: 35,
//             c: [242, 191, 52, 255]
//         }, {
//             v: 30,
//             c: [251, 252, 72, 255]
//         }, {
//             v: 25,
//             c: [54, 142, 30, 255]
//         }, {
//             v: 20,
//             c: [82, 214, 53, 255]
//         }, {
//             v: 15,
//             c: [133, 249, 86, 255]
//         }, {
//             v: 10,
//             c: [128, 230, 234, 255]
//         }, {
//             v: 5,
//             c: [83, 156, 240, 255]
//         }] as ColorConfigType[],
//     }

//     //TODO: 位置编辑
//     // private _positionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'editing'], this.components));
//     // get positionEditing() { return this._positionEditing; }

//     constructor(id?: string) {
//         super(id);
//     }

//     override getProperties(language?: string) {
//         return [
//             ...super.getProperties(language),
//             new GroupProperty('通用', '通用', [
//                 new StringProperty('url', 'url', false, false, [this, 'url']),
//                 new NumberProperty('resolution', 'resolution', false, false, [this, 'resolution']),
//                 new BooleanProperty('nearestSample', 'nearestSample', false, false, [this, 'nearestSample']),
//                 new BooleanProperty('alphaBlend', 'alphaBlend', false, false, [this, 'alphaBlend']),
//                 new NumberProperty('alpha', 'alpha', false, false, [this, 'alpha']),
//                 new NumberProperty('clipMinX', 'clipMinX', false, false, [this, 'clipMinX']),
//                 new NumberProperty('clipMaxX', 'clipMaxX', false, false, [this, 'clipMaxX']),
//                 new NumberProperty('clipMinY', 'clipMinY', false, false, [this, 'clipMinY']),
//                 new NumberProperty('clipMaxY', 'clipMaxY', false, false, [this, 'clipMaxY']),
//                 new NumberProperty('clipMinZ', 'clipMinZ', false, false, [this, 'clipMinZ']),
//                 new NumberProperty('clipMaxZ', 'clipMaxZ', false, false, [this, 'clipMaxZ']),
//                 new JsonProperty('colorLegend', 'colorLegend', false, false, [this, 'colorLegend'], ESRefVoxels.defaults.colorLegend),
//             ]),
//         ];
//     }
// }

// export namespace ESRefVoxels {
//     export const createDefaultProps = () => ({
//         ...ESObjectWithLocation.createDefaultProps(),
//         url: "",
//         // postion 在基类中
//         dimensions: reactArray<ESJVector3D>([100, 100, 10]),
//         resolution: 250,
//         nearestSample: false,
//         alphaBlend: true,
//         alpha: 1,
//         clipMinX: -1,
//         clipMaxX: 1,
//         clipMinY: -1,
//         clipMaxY: 1,
//         clipMinZ: -1,
//         clipMaxZ: 1,
//         colorLegend: reactJsonWithUndefined<ColorConfigType[]>(undefined),
//     });
// }
// extendClassProps(ESRefVoxels.prototype, ESRefVoxels.createDefaultProps);
// export interface ESRefVoxels extends UniteChanged<ReturnType<typeof ESRefVoxels.createDefaultProps>> { }
