import { ESCesiumViewer } from "../../../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, SceneObjectKey, track } from "xbsj-base";
import { GeoCustomDivPoi } from "../GeoCustomDivPoi";
import { ESSceneObject } from "earthsdk3";

export class GeoDivSwitchPoi extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const geoDivPoi = this.disposeVar(new GeoCustomDivPoi(czmViewer));
        this.dispose(this.flyToEvent.disposableOn(duration => {
            geoDivPoi.flyTo(duration)
        }));
        this.d(track([geoDivPoi, 'zOrder'], [this, 'zOrder']));
        this.dispose(bind([geoDivPoi, 'position'], [this, 'position']));
        this.dispose(bind([geoDivPoi, 'editing'], [this, 'editing']));
        this.dispose(bind([geoDivPoi, 'originRatioAndOffset'], [this, 'originRatioAndOffset']));

        const uriReact = this.disposeVar(ESSceneObject.context.createEvnStrReact([this, 'uri'], '${earthsdk3-assets-script-dir}/assets/img/location.png'));

        const updatePolygon = () => {
            geoDivPoi.show = this.show ?? true;
            const size = this.size ?? [50, 50]
            const showIcon = this.showIcon ?? true
            //图标
            const iconHtml = `<img id="xbsj-geoDivSwitchPoi-defaultpoi-icon" src="${uriReact.value}" style="width:${size[0]}px;height:${size[1]}px;position:relative;pointer-events:all;cursor: pointer;">`

            // const iconHtml = `<span class="defaultpoi_icon" style="width:26px;cursor: pointer;height:40px;display:block; position:relative;pointer-events:all;">
            //                      <span style="background: #fff;height:16px; width:16px; border:5px solid #0279a1;position:absolute; top:2px; left:0px; z-index:1; border-radius:40px;-webkit-border-radius:40px;-moz-border-radius:40px;"></span>
            //                      <span  style="position:absolute; bottom:2px; left:3px; border:10px transparent solid; border-top-color:#0279a1; border-width:15px 10px 0px 10px;"></span>
            //                  </span>`
            // 弹窗
            const infosHtml = `<div style="width: 200px;height: 120px;position:relative;pointer-events:all;"> 
                                    <span id="xbsj-geoDivSwitchPoi-defaultpoi-infos" style="display:block;position:absolute;top:0px;right:0px;width:20px;color:#000;height:25px;line-height:25px;cursor: pointer;  z-index: 2;user-select:none;"> ╳ </span>
                                    <span style="position:absolute; bottom:0px;left:80px;border:10px transparent solid; border-top-color:#fff; border-width:20px 20px 0 20px; z-index: 2;"></span>
                                    <div style="width:100%;height:100px;border-radius: 10px; background: #fff;position:absolute;left:0px;top:0px;overflow: auto;text-align:center;box-shadow:0px 0px 20px 2px rgb(0 0 0 / 20%);">                                  
                                    <div style="width:180px;height:70px;margin:20px 10px 10px 10px;word-wrap:break-word;overflow: auto;color:rgb(44,62,80);">
                                    ${this.text ?? '请输入内容'}             
                                    </div>                            
                                    </div>
                                </div>`

            if (showIcon) {
                geoDivPoi.innerHTML = iconHtml
            } else {
                geoDivPoi.innerHTML = infosHtml
            }
        };

        const updateShowIcon = (doms: HTMLDivElement) => {
            const showIcon = this.showIcon ?? true

            if (showIcon) {
                const dom = doms.querySelectorAll('#xbsj-geoDivSwitchPoi-defaultpoi-icon')[0] as HTMLElement
                if (dom) {
                    dom.onclick = () => {
                        const editing = this.editing ?? false
                        if (editing) return
                        this.showIcon = !showIcon
                    }
                }
            } else {
                const dom = doms.querySelectorAll('#xbsj-geoDivSwitchPoi-defaultpoi-infos')[0] as HTMLElement
                if (dom) {
                    dom.onclick = () => {
                        const editing = this.editing ?? false
                        if (editing) return
                        this.showIcon = !showIcon
                    }
                }
            }
        }

        this.dispose(geoDivPoi.innerHtmlMounted.disposableOn(doms => {
            if (!doms) return
            updateShowIcon(doms)
        }))
        updatePolygon();
        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.showChanged,
            this.textChanged,
            this.showIconChanged,
            this.sizeChanged
        ));
        this.dispose(updateEvent.disposableOn(updatePolygon));
        this.dispose(uriReact.changed.disposableOn(updatePolygon));
    }
    static defaults = {
        text: '请输入内容',
    };
}

export namespace GeoDivSwitchPoi {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        show: true,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        text: undefined as string | undefined,
        editing: false,
        showIcon: true,
        size: [50, 50],
        originRatioAndOffset: reactArray<[leftRatio: number, topRatio: number, leftOffset: number, topOffset: number]>([0.5, 1, 0, 0]), // 为undefined时设置为[0.5, 1.0, 0, 0]
        uri: '${earthsdk3-assets-script-dir}/assets/img/location.png',
        zOrder: 0,
    });
}
extendClassProps(GeoDivSwitchPoi.prototype, GeoDivSwitchPoi.createDefaultProps);
export interface GeoDivSwitchPoi extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoDivSwitchPoi.createDefaultProps>> { }
