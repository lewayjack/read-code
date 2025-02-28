import { bind, createNextAnimateFrameEvent, createTimeoutWithStartValues, Destroyable, Event, extendClassProps, Listener, reactArrayWithUndefined, reactDeepArrayWithUndefined, ReactivePropsToNativePropsAndChanged, track, Transition } from "xbsj-base";
import { GeoCanvasImagePoi } from "../GeoCanvasImagePoi";
import { ESCesiumViewer } from "../../../../../ESCesiumViewer";

export class GeoCanvasMenuPoi extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _commandEvent = this.disposeVar(new Event<[commandName: string, pointerEvent: PointerEvent]>());
    get commandEvent() { return this._commandEvent; }

    private _dbclickEvent = this.disposeVar(new Event<[pointerEvent: PointerEvent]>());
    get dbclickEvent() { return this._dbclickEvent; }

    constructor(czmViewer: ESCesiumViewer) {
        super();

        const sceneObject = this;

        let enabledTimeStamp = Number.POSITIVE_INFINITY;
        this.dispose(this.enabledChanged.disposableOn(enabled => {
            enabledTimeStamp = !(enabled ?? false) ? Number.POSITIVE_INFINITY : Date.now();
        }));

        const expanding = this.disposeVar(new Transition(100));
        expanding.reset(0);
        const autoClose = this.disposeVar(createTimeoutWithStartValues(() => expanding.target = 0, 1000));
        const autoOpen = this.disposeVar(createTimeoutWithStartValues(() => expanding.target = 1, 1000));

        const mainPoi = this.disposeVar(new GeoCanvasImagePoi(czmViewer));
        // this.dispose(this.components.disposableAdd(mainPoi));
        // mainPoi.bgColor = [0, 0, 0, .6];
        // mainPoi.fgColor = [1, 1, 1, 1];
        // mainPoi.size = [12, 12];
        mainPoi.originRatioAndOffset = [.5, .5, 0, 0];
        this.dispose(track([mainPoi, 'tooltip'], [sceneObject, 'title']));
        {
            const update = () => { mainPoi.size = this.mainPoiSize ?? [12, 12]; }
            update();
            this.dispose(this.mainPoiSizeChanged.disposableOn(update));
        }
        {
            const update = () => { mainPoi.fgColor = this.mainPoiFgColor ?? [1, 1, 1, 1]; }
            update();
            this.dispose(this.mainPoiFgColorChanged.disposableOn(update));
        }
        {
            const update = () => { mainPoi.bgColor = this.mainPoiBgColor ?? [0, 0, 0, .6]; }
            update();
            this.dispose(this.mainPoiBgColorChanged.disposableOn(update));
        }

        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            sceneObject.showChanged,
            sceneObject.positionChanged,
            // sceneObject.nameChanged,
            // geoCanvasMenuPoi.commandsChanged,
            sceneObject.descriptionChanged,
            sceneObject.titleChanged,
            sceneObject.imageUriChanged,
        ));
        const updatePrimitive = () => {
            mainPoi.show = sceneObject.show ?? true;
            mainPoi.imageUri = sceneObject.imageUri ?? '${earthsdk3-assets-script-dir}/assets/img/point-yellow.png';
            mainPoi.position = sceneObject.position;
        };
        updatePrimitive();
        this.dispose(updateEvent.disposableOn(updatePrimitive));

        this.dispose(bind([mainPoi, 'position'], [this, 'position']));
        this.dispose(bind([mainPoi, 'positionEditing'], [this, 'positionEditing']));
        this.dispose(this._flyToEvent.disposableOn(duration => mainPoi.flyTo(duration)));

        const subPois: GeoCanvasImagePoi[] = [];
        const resetSubCommands = () => {
            subPois.forEach(e => {
                // czmViewer.delete(e);
            });
            subPois.length = 0;
        };
        this.dispose(resetSubCommands);
        const updateMenu = () => {
            resetSubCommands();

            const { commands } = sceneObject;
            if (!commands) {
                return;
            }
            const l = commands.length;
            const intervalAngle = 50;
            const radius = 0;
            const startAngle = - (l * intervalAngle * Math.PI / 180) * 0.5;
            for (let i = 0; i < l; ++i) {
                const [name, title, description, imageUri] = commands[i];
                const angle = startAngle + (intervalAngle * (i + .5)) * Math.PI / 180
                const x = Math.sin(angle) * radius;
                const y = Math.cos(angle) * radius;

                const subPoi = new GeoCanvasImagePoi(czmViewer);
                subPoi.imageUri = imageUri;
                subPoi.tooltip = title;
                subPoi.bgColor = [0, 0, 0, .6];
                subPoi.fgColor = [1, 1, 1, 1];
                subPoi.size = [24, 24];
                subPoi.dispose(track([subPoi, 'position'], [sceneObject, 'position']));
                subPoi.originRatioAndOffset = [.5, .5, -x, y];
                subPoi.show = false;
                subPoi.opacity = 0;
                subPoi.dispose(subPoi.opacityChanged.disposableOn(opacity => subPoi.show = (opacity ?? 1) > 0));
                subPoi.dispose(subPoi.clickEvent.disposableOn(pointerEvent => sceneObject.commandEvent.emit(name, pointerEvent)));
                // subPoi.dispose(subPoi.dbclickEvent.disposableOn(pointerEvent => geoCanvasMenuPoi.dbclickEvent.emit(name, pointerEvent)));
                subPoi.dispose(subPoi.hoveredChanged.disposableOn(hovered => hovered ? autoClose.cancel() : autoClose.restart()));
                // 展开以后点击才起作用！
                subPoi.dispose(expanding.currentChanged.disposableOn(current => subPoi.enabled = (current === 1)));
                // subPoi.dispose(this.components.disposableAdd(subPoi));

                subPois.push(subPoi);
            }
        };
        updateMenu();
        this.dispose(sceneObject.commandsChanged.disposableOn(updateMenu));

        this.dispose(mainPoi.hoveredChanged.disposableOn(hovered => hovered ? autoClose.cancel() : autoClose.restart()));
        this.dispose(mainPoi.hoveredChanged.disposableOn(hovered => hovered ? sceneObject.enabled && autoOpen.restart() : autoOpen.cancel()));

        this.dispose(expanding.currentChanged.disposableOn(current => {
            const l = subPois.length;
            const intervalAngle = 50;
            const radius = current * 35;
            const startAngle = - (l * intervalAngle * Math.PI / 180) * 0.5;
            for (let i = 0; i < l; ++i) {
                const angle = startAngle + (intervalAngle * (i + .5)) * Math.PI / 180
                const x = Math.sin(angle) * radius;
                const y = Math.cos(angle) * radius;

                subPois[i].originRatioAndOffset = [.5, .5, -x, y];
                subPois[i].opacity = current;
            }
        }));

        this.dispose(mainPoi.clickEvent.disposableOn(pointerEvent => {
            if (!sceneObject.enabled) {
                return;
            }
            // 监测enabled设置为true之前的click消息不要去响应！ vtxf 20230812
            // @ts-ignore
            const lt = pointerEvent.__xbsj_listenerTime__ as number | undefined;
            if (lt !== undefined && enabledTimeStamp > lt) {
                return;
            }

            // 如果是左键单击
            if (pointerEvent.button === 0) {
                // clickCommandName为undefined时，展开子菜单
                if (!sceneObject.clickCommandName) {
                    // click在过程中不起作用
                    if (expanding.current > 0 && expanding.current < 1) return;
                    expanding.target = expanding.target === 1 ? 0 : 1;
                } else {
                    // 否则直接执行命令
                    sceneObject.commandEvent.emit(sceneObject.clickCommandName, pointerEvent);
                }
            } else if (pointerEvent.button === 2) {
                if (sceneObject.rightClickCommandName) {
                    // 否则直接执行命令
                    sceneObject.commandEvent.emit(sceneObject.rightClickCommandName, pointerEvent);
                }
            }
        }));
        this.dispose(mainPoi.clickOutEvent.disposableOn(() => {
            if (!sceneObject.enabled) {
                return;
            }

            expanding.target = 0;
        }));
        this.dispose(sceneObject.commandEvent.disposableOn(() => expanding.target = 0));

        this.dispose(mainPoi.dbclickEvent.disposableOn(pointerEvent => {
            if (!sceneObject.enabled) {
                return;
            }
            // 监测enabled设置为true之前的click消息不要去响应！ vtxf 20230812
            // @ts-ignore
            const lt = pointerEvent.__xbsj_listenerTime__ as number | undefined;
            if (lt !== undefined && enabledTimeStamp > lt) {
                return;
            }

            sceneObject.dbclickEvent.emit(pointerEvent);
            autoOpen.isRunning && autoClose.cancel();
            expanding.target = 0;
        }));

        this.dispose(expanding.targetChanged.disposableOn(target => target === 1 ? autoClose.restart() : autoClose.cancel()));
        this.dispose(expanding.targetChanged.disposableOn(target => target === 1 && autoOpen.cancel()));

        this.dispose(expanding.targetChanged.disposableOn(target => mainPoi.tooltipShow = target === 0));
    }
}

export namespace GeoCanvasMenuPoi {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        enabled: true, // 是否可以点击起作用！
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 必须是3的倍数！A Property specifying the array of Cartesian3 positions that define the line strip.
        positionEditing: false,
        title: "",
        description: "",
        imageUri: '${earthsdk3-assets-script-dir}/assets/img/point-yellow.png',
        commands: reactDeepArrayWithUndefined<[name: string, title: string, description: string, imageUrl: string]>(undefined, (a, b) => a.every((e, i) => e === b[i]), s => [...s]),
        clickCommandName: "", // 设置成string时，单击时就会触发，不会展开下一级菜单
        rightClickCommandName: "", // 设置成string时，单击时就会触发，不会展开下一级菜单
        mainPoiSize: reactArrayWithUndefined<[number, number]>(undefined),
        mainPoiBgColor: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        mainPoiFgColor: reactArrayWithUndefined<[number, number, number, number]>(undefined),
    });
}
extendClassProps(GeoCanvasMenuPoi.prototype, GeoCanvasMenuPoi.createDefaultProps);
export interface GeoCanvasMenuPoi extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoCanvasMenuPoi.createDefaultProps>> { }
