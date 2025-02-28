import { AttachedPickedInfo, ESLocationMeasurement } from "earthsdk3";
import { CzmESEditing, CzmESObjectWithLocation, GeoCustomDivPoi } from "../../base";
import { ESCesiumViewer } from "./../../../ESCesiumViewer";
import { createInnerHtmlWithWhiteTextBlackBackground, positionToHumanStr } from "../../../utils";
import { bind, createNextAnimateFrameEvent, react, track } from "xbsj-base";

export type GeoLocationMeasurementTextFuncType = (position: [number, number, number]) => string;

export class CzmESLocationMeasurement extends CzmESObjectWithLocation<ESLocationMeasurement> {
    static readonly type = this.register("ESCesiumViewer", ESLocationMeasurement.type, this);
    private _geoCustomDivPoi;
    get geoCustomDivPoi() { return this._geoCustomDivPoi; }

    private _sEditing;
    get sEditing() { return this._sEditing; }

    static defaultTextFunc_度格式 = (position: [number, number, number]) => {
        if (!position) return '';
        const [l = 0, b = 0, h = 0] = position;
        return `经度: ${l.toFixed(5)}°\n纬度: ${b.toFixed(5)}°\n高度: ${h.toFixed(2)}m`;
    };

    static defaultTextFunc_度分格式 = (position: [number, number, number]) => {
        if (!position) return '';
        const [l, b, h] = positionToHumanStr(position, true);
        return `经度: ${l}\n纬度: ${b}\n高度: ${h}`;
    };

    static defaultTextFunc_度分秒格式 = (position: [number, number, number]) => {
        if (!position) return '';
        const [l, b, h] = positionToHumanStr(position);
        return `经度: ${l}\n纬度: ${b}\n高度: ${h}`;
    };

    private _textFunc = this.disposeVar(react<GeoLocationMeasurementTextFuncType | undefined>(undefined));
    get textFunc() { return this._textFunc.value; }
    set textFunc(value: GeoLocationMeasurementTextFuncType | undefined) { this._textFunc.value = value; }
    get textFuncChanged() { return this._textFunc.changed; }

    constructor(sceneObject: ESLocationMeasurement, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        {
            // 禁用基类编辑
            this.sPrsEditing.enabled = false;
        }
        this._geoCustomDivPoi = this.disposeVar(new GeoCustomDivPoi(czmViewer, sceneObject.id));
        this._sEditing = this.disposeVar(new CzmESEditing(this.czmViewer, [this.sceneObject, 'editing'], [this.sceneObject, 'position']));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const geoCustomDivPoi = this.geoCustomDivPoi;
        this.dispose(track([geoCustomDivPoi, 'show'], [sceneObject, 'show']));
        this.dispose(bind([geoCustomDivPoi, 'position'], [sceneObject, 'position']));
        this.dispose(bind([geoCustomDivPoi, 'editing'], [sceneObject, 'editing']));
        this.dispose(track([geoCustomDivPoi, 'allowPicking'], [sceneObject, 'allowPicking']));
        {
            this.dispose(geoCustomDivPoi.pickedEvent.disposableOn(pickedInfo => {
                if (!(sceneObject.allowPicking ?? ESLocationMeasurement.defaults.allowPicking)) return;
                sceneObject.pickedEvent.emit({ attachedInfo: pickedInfo });
            }));

            this.dispose(geoCustomDivPoi.innerHtmlMounted.disposableOn(contentDiv => {
                const div = contentDiv.firstElementChild as HTMLDivElement | undefined;
                if (!div) {
                    return;
                }
                div.style.pointerEvents = 'auto';
                div.style.cursor = 'default';
                // div.onclick = () => geoLocationMeasurement.pickedEvent.emit(new SceneObjectPickedInfo(geoLocationMeasurement, new DivPickedInfo(div)));
                div.onclick = e => geoCustomDivPoi.pickFromDiv(div, new AttachedPickedInfo({ type: "viewerPicking", e }));;
            }));

            {
                const update = () => {
                    if (!sceneObject.position) return;
                    const text = (this.textFunc ?? CzmESLocationMeasurement.defaultTextFunc_度格式)(sceneObject.position);
                    geoCustomDivPoi.innerHTML = createInnerHtmlWithWhiteTextBlackBackground(text);
                };
                update();
                const event = this.disposeVar(createNextAnimateFrameEvent(sceneObject.positionChanged, this.textFuncChanged));
                this.dispose(event.disposableOn(update));
            }

            {
                const update = () => {
                    // [["度", "DECIMAL_DEGREE"], ["度分", "DEGREES_DECIMAL_MINUTES"], ["度分秒", "SEXAGESIMAL_DEGREE"]]
                    czmViewer.lonLatFormat ?? (czmViewer.lonLatFormat = "DECIMAL_DEGREE")
                    this.textFunc = czmViewer.lonLatFormat == "DECIMAL_DEGREE"
                        ? CzmESLocationMeasurement.defaultTextFunc_度格式
                        : czmViewer.lonLatFormat == "DEGREES_DECIMAL_MINUTES"
                            ? CzmESLocationMeasurement.defaultTextFunc_度分格式
                            : CzmESLocationMeasurement.defaultTextFunc_度分秒格式;
                }
                update();
                this.d(czmViewer.lonLatFormatChanged.don(() => {
                    update();
                }))
            }
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoCustomDivPoi } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            geoCustomDivPoi.flyTo(duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoCustomDivPoi } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            geoCustomDivPoi.flyTo(duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
