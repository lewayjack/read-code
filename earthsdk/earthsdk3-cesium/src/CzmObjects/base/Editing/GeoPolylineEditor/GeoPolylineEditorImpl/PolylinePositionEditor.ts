import { Destroyable, bind, reactArrayWithUndefined } from "xbsj-base";
import { GeoPolylineEditorImpl } from ".";
import { AddingEditingProcessing } from "./EditingProcessing/AddingEditingProcessing";
import { getEllipsoidGeodesicCenter } from "../../../../../utils";
import { GeoCanvasImagePoi, GeoCanvasMenuPoi } from "../../../../../CzmObjects";

let lastId = 0;
export class PolylinePositionEditor extends Destroyable {
    private _position = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    get position() { return this._position.value; }
    get positionChanged() { return this._position.changed; }
    set position(value: [number, number, number] | undefined) { this._position.value = value; }
    // 用来限制具体的每个坐标点位置
    private _menuPoi;
    get menuPoi() { return this._menuPoi; }

    // 用来显示在两个控制点之间的中间点，点击之后就会自动创建一个新的控制点
    private _middlePoi;
    get middlePoi() { return this._middlePoi; }

    private _id = lastId++;
    get id() { return this._id; }

    get impl() { return this._impl; }

    constructor(private _impl: GeoPolylineEditorImpl, position?: [number, number, number]) {
        super();
        this._menuPoi = this.ad(new GeoCanvasMenuPoi(_impl.sceneObject.czmViewer));
        this._middlePoi = this.ad(new GeoCanvasImagePoi(_impl.sceneObject.czmViewer));
        const { impl } = this;

        //初始化位置赋值
        position && (this._position.value = position);
        this.dispose(this._position.changed.disposableOn(() => impl.positionsChanged.emit()));

        {
            const { menuPoi } = this;
            menuPoi.enabled = false;
            // this.dispose(impl.sceneObject.components.disposableAdd(menuPoi));
            // this.dispose(bind([menuPoi, 'position'], [this, 'position']));
            {
                const update = () => {
                    if (this.position === undefined) {
                        menuPoi.position = undefined;
                        return;
                    }
                    const tempPos = [...this.position] as [number, number, number];
                    tempPos[2] -= impl.sceneObject.czmViewer.editingHeightOffset ?? 0;
                    menuPoi.position = tempPos;
                }
                update()
                this.d(this.positionChanged.don(update));
            }
            const baseImageUri = '${earthsdk3-assets-script-dir}/assets/img/';
            menuPoi.imageUri = baseImageUri + 'point-yellow.png';
            menuPoi.commands = [
                ['add', '增加控制点', '', baseImageUri + 'add.png'],
                ['delete', '删除当前控制点', '', baseImageUri + 'delete.png'],
                ['modify', '修改当前控制点', '', baseImageUri + 'modify.png'],
            ];
            menuPoi.clickCommandName = 'modify';
            menuPoi.rightClickCommandName = 'delete';
            this.dispose(menuPoi.commandEvent.disposableOn((commandName: any) => {
                impl.menuPoisCommand.emit(this, commandName);
            }));
            this.dispose(menuPoi.dbclickEvent.disposableOn(() => {
                impl.menuPoisCommand.emit(this, 'dbclick');
            }));

            {
                const update = () => menuPoi.show = impl.enabled ?? GeoPolylineEditorImpl.defaults.enabled;
                update();
                this.dispose(impl.enabledChanged.disposableOn(update));
            }
        }

        {
            // const baseImageUrl = `\${earthsdk3-assets-script-dir}/assets/img/`;
            const update = () => {
                const index = impl.positionEditors.indexOf(this) + 1;
                if (index === -1) return;
                // hideCursorInfo即使修改了，一开始也不生效，可能是hideCursor是在场景对象加入列表后才设置，但是这里的title是在构造函数中设置而先于列表项增加
                // if (!this._impl.hideCursorInfo) {
                //     this.menuPoi.title = `控制点${index}，左键单击修改，右键单击删除`;
                // } else {
                //     this.menuPoi.title = `控制点${index}`;
                // }
                this.menuPoi.title = `控制点${index}`;

                // this.menuPoi.imageUri = baseImageUrl + `point-${index !== 1 ? 'yellow' : 'green'}.png`;
                if (index === 1) {
                    this.menuPoi.imageUri = impl.firstControlPointImageUrl ?? GeoPolylineEditorImpl.defaults.firstControlPointImageUrl;
                } else {
                    this.menuPoi.imageUri = impl.otherControlPointImageUrl ?? GeoPolylineEditorImpl.defaults.otherControlPointImageUrl;
                }
            }
            update();
            this.dispose(impl.positionEditors.changedEvent.disposableOn(update));
        }

        {
            const { middlePoi: poi } = this;
            // this.dispose(impl.sceneObject.components.disposableAdd(poi));
            // const baseImageUri = '${earthsdk3-assets-script-dir}/assets/img/';
            // poi.imageUri = baseImageUri + 'point-green.png';
            poi.imageUri = impl.middlePointImageUrl ?? GeoPolylineEditorImpl.defaults.middlePointImageUrl;
            poi.tooltip = `点击增加一个控制点`;
            poi.bgColor = [0, 0, 0, .6];
            poi.fgColor = [1, 1, 1, 1];
            poi.size = [8, 8];
            poi.originRatioAndOffset = [.5, .5, 0, 0];
            {
                const update = () => {
                    const implEnabled = impl.enabled ?? GeoPolylineEditorImpl.defaults.enabled;
                    if (!implEnabled) {
                        poi.enabled = false;
                        poi.show = false;
                        return;
                    }

                    do {
                        // 新增节点过程中，不应该开启中间点，否则会导致误点击
                        if (impl.editingProcessing.innerProcessing instanceof AddingEditingProcessing) {
                            break;
                        }

                        const index = impl.positionEditors.indexOf(this);
                        if (index === -1) break;
                        const l = impl.positionEditors.length;
                        if (l === 0) {
                            console.error(`impl.positionEditors.length === 0!`);
                            break;
                        }
                        const loop = impl.loop ?? GeoPolylineEditorImpl.defaults.loop;
                        if (!loop && index + 1 >= l) break;
                        const p0 = this.position;
                        if (!p0) break;
                        let nextIndex = (index + 1) % l;
                        const pn = impl.positionEditors.get(nextIndex);
                        const p1 = pn.position;
                        if (!p1) break;
                        // const m = [(p0[0] + p1[0])*0.5, (p0[1] + p1[1])*0.5, (p0[2] + p1[2])*0.5] as [number, number, number];
                        const m = getEllipsoidGeodesicCenter(p0, p1);
                        if (!m) break;
                        m[2] -= impl.sceneObject.czmViewer.editingHeightOffset ?? 0;
                        poi.position = m;
                        const canAdding = impl.positionEditors.length < (impl.maxPointsNum ?? GeoPolylineEditorImpl.defaults.maxPointsNum);
                        poi.enabled = canAdding;
                        poi.show = canAdding;
                        return;
                    } while (false);
                    poi.enabled = false;
                    poi.show = false;
                }
                update();
                this.dispose(impl.positionsChanged.disposableOn(update));
                this.dispose(impl.loopChanged.disposableOn(update));
                this.dispose(impl.enabledChanged.disposableOn(update));
                this.dispose(impl.editingProcessing.innerProcessingChanged.disposableOn(update));
            }

            this.dispose(poi.clickEvent.disposableOn(e => {
                // console.log(`MiddlePoint ${this.index} clicked`);
                // alert(123);
                if (impl.positionEditors.length >= (impl.maxPointsNum ?? GeoPolylineEditorImpl.defaults.maxPointsNum)) {
                    return;
                }
                const index = impl.positionEditors.indexOf(this);
                if (index === -1) return;
                const tempPos: [number, number, number] | undefined = poi.position ? [...poi.position] : undefined
                if (tempPos) tempPos[2] += impl.sceneObject.czmViewer.editingHeightOffset ?? 0;
                let currentPosEditor = new PolylinePositionEditor(impl, tempPos);
                impl.positionEditors.splice(index + 1, 0, currentPosEditor);
                impl.editingProcessing.modify(currentPosEditor);
            }));
        }

        (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`PolylinePositionEditor creating! ${this.id}`);
        this.dispose(() => {
            (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`PolylinePositionEditor destroying! ${this.id}`);
        });
    }
}
