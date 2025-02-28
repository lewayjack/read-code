import { Event, extendClassProps, reactJsonWithUndefined, UniteChanged } from "xbsj-base";
import { ESJVector3D, GroupProperty, JsonProperty, NumberProperty } from "../../../ESJTypes";
import { ESVisualObject } from "../../base";
import { addTreesCallFunc, cutDownTreesCallFunc, growthSimulationCallFunc, removeAllTreesCallFunc, updateTreeParamsCallFunc } from "./CallFunc";
export type ESTreeTypeSep = { name: string, meshPath: string }
export type ESTreeParam = { id: string, treeTypeId: number, location: ESJVector3D, scale: ESJVector3D }
export type ToScaleType = { [key: string]: [ESJVector3D, ESJVector3D, ESJVector3D, number] }
export type ToCutDownScaleType = { [key: string]: [ESJVector3D, number] }
export { addTreesCallFunc, removeAllTreesCallFunc, updateTreeParamsCallFunc, cutDownTreesCallFunc, growthSimulationCallFunc }

export class ESSeparateFoliage extends ESVisualObject {
    static readonly type = this.register('ESSeparateFoliage', this, { chsName: '单体控制森林', tags: ['ESObjects', '_ES_Impl_UE'], description: "ESSeparateFoliage" });
    get typeName() { return 'ESSeparateFoliage'; }
    override get defaultProps() { return ESSeparateFoliage.createDefaultProps(); }

    async addTreesCallFunc(ueViewer: any, trees: ESTreeParam[]) {
        return await addTreesCallFunc(ueViewer, this.id, trees)
    }
    async updateTreeParamsCallFunc(ueViewer: any, trees: ESTreeParam[]) {
        return await updateTreeParamsCallFunc(ueViewer, this.id, trees)
    }
    async cutDownTreesCallFunc(ueViewer: any, TreeIds: ToCutDownScaleType[], TimeLength: number) {
        return await cutDownTreesCallFunc(ueViewer, this.id, TreeIds, TimeLength)
    }
    async removeAllTreesCallFunc(ueViewer: any) {
        return await removeAllTreesCallFunc(ueViewer, this.id)
    }
    async growthSimulationCallFunc(ueViewer: any, ToParams: ToScaleType[], TimeLength: number, SwitchTime: number) {
        return await growthSimulationCallFunc(ueViewer, this.id, ToParams, TimeLength, SwitchTime)
    }
    async getIdByComponentNameAndHitItem(viewer: any, ComponentName: string, HitItem: number) {
        return await viewer.getIdByComponentNameAndHitItem(this.id, ComponentName, HitItem);
    }

    private _addTreesEvent = this.dv(new Event<[TreeParams: ESTreeParam[]]>());
    get addTreesEvent() { return this._addTreesEvent; }
    addTrees(TreeParams: ESTreeParam[]) { this._addTreesEvent.emit(TreeParams); }

    private _removeAllTreesEvent = this.dv(new Event());
    get removeAllTreesEvent() { return this._removeAllTreesEvent; }
    removeAllTrees() { this._removeAllTreesEvent.emit(); }

    private _updateTreeParamsEvent = this.dv(new Event<[TreeParams: ESTreeParam[]]>());
    get updateTreeParamsEvent() { return this._updateTreeParamsEvent; }
    updateTreeParams(TreeParams: ESTreeParam[]) { this._updateTreeParamsEvent.emit(TreeParams); }

    private _cutDownTreesEvent = this.dv(new Event<[TreeId: ToCutDownScaleType[], TimeLength: number]>());
    get cutDownTreesEvent() { return this._cutDownTreesEvent; }
    cutDownTrees(TreeId: ToCutDownScaleType[], TimeLength: number) { this._cutDownTreesEvent.emit(TreeId, TimeLength); }

    private _growthSimulationEvent = this.dv(new Event<[ToParams: ToScaleType[], TimeLength: number, SwitchTime: number]>());
    get growthSimulationEvent() { return this._growthSimulationEvent; }
    growthSimulation(ToParams: ToScaleType[], TimeLength: number, SwitchTime: number) { this._growthSimulationEvent.emit(ToParams, TimeLength, SwitchTime); }

    static override defaults = {
        ...ESVisualObject.defaults,
        treeTypes: [] as ESTreeTypeSep[],
        stumpId: -1,//树桩id
        intervalTime: 0.1,//动画间隔时间
        switchIntervalTime: 0.5,//切换间隔时间
    }
    constructor(id?: string) {
        super(id);
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty('treeTypes', '类型为 { name: string, meshPath: string }[]', true, false, [this, 'treeTypes'], [], '{ name: string, meshPath: string }[]'),
                new NumberProperty('树桩id', '树桩id', false, false, [this, 'stumpId']),
                new NumberProperty('动画间隔时间', '动画间隔时间', false, false, [this, 'intervalTime']),
                new NumberProperty('切换间隔时间', '切换间隔时间', false, false, [this, 'switchIntervalTime']),
            ]),
        ];
    }
}

export namespace ESSeparateFoliage {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        treeTypes: reactJsonWithUndefined<ESTreeTypeSep[]>(undefined),
        stumpId: -1,
        intervalTime: 0.1,
        switchIntervalTime: 0.5,
    });
}
extendClassProps(ESSeparateFoliage.prototype, ESSeparateFoliage.createDefaultProps);
export interface ESSeparateFoliage extends UniteChanged<ReturnType<typeof ESSeparateFoliage.createDefaultProps>> { }
