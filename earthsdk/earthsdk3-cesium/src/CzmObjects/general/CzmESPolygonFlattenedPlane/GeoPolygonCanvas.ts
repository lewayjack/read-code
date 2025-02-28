import { ESGeoPolygon, ESSceneObjectWithId, getMinMaxCorner, PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, Listener, Event, reactJsonWithUndefined, track, ObjResettingWithEvent, extendClassProps, ReactivePropsToNativePropsAndChanged, nextAnimateFrame, createNextAnimateFrameEvent, react, SceneObjectKey } from "xbsj-base";

function saveCanvasToClipboard(canvas: HTMLCanvasElement) {
    canvas.toBlob(blob => {
        if (!blob) {
            console.warn(`canvas.toBlob error!`);
            return;
        }
        // 创建包含图像数据的ClipboardItem对象
        var item = new ClipboardItem({ 'image/png': blob });

        // 将图像数据存储到剪贴板中
        navigator.clipboard.write([item])
            .then(function () {
                alert('图像已复制到剪切板');
            })
            .catch(function (err) {
                console.error('复制到剪切板失败: ', err);
            });
    });
}

class PolygonCanvasResetting extends Destroyable {
    static toMercatorPos = function (lbh: [number, number, number]) {
        const [l, b, h] = lbh;
        return [l, b / Math.cos(b * Math.PI / 180), h];
    }

    constructor(private _geoPolygonCanvas: GeoPolygonCanvas, private _geoPolygon: ESGeoPolygon) {
        super();

        {
            const drawCanvas = (minPos: [number, number, number], maxPos: [number, number, number]) => {
                const { canvas, canvasCtx, canvasWidth } = this._geoPolygonCanvas;

                const { toMercatorPos } = PolygonCanvasResetting;
                const lb = toMercatorPos(minPos);
                const rt = toMercatorPos(maxPos);

                const w = rt[0] - lb[0];
                const h = rt[1] - lb[1];

                const cw = canvasWidth > 8192 ? 8192 : canvasWidth;
                if (w <= 0) return;
                const ch = (cw * h / w) | 0;
                if (ch <= 0 || ch > 8192) return;

                const { points: positions } = this._geoPolygon;
                if (!positions) throw new Error(`!positions`);
                const cps = positions.map(e => {
                    const me = toMercatorPos(e);
                    return [(me[0] - lb[0]) * cw / w, ch - (me[1] - lb[1]) * ch / h];
                });

                canvas.width = cw;
                canvas.height = ch;
                canvasCtx.clearRect(0, 0, cw, ch);

                canvasCtx.beginPath();
                for (const p of cps) {
                    canvasCtx.lineTo(p[0], p[1]);
                }
                canvasCtx.closePath();
                canvasCtx.fillStyle = '#FFFFFF';
                canvasCtx.fill();
            };

            const update = () => {
                let canvasGeoInfo: CanvasGeoInfoType | undefined = undefined;
                do {
                    const { canvas, canvasCtx, canvasWidth } = this._geoPolygonCanvas;
                    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

                    const { points: positions } = this._geoPolygon;
                    if (!positions) break;
                    if (positions.length < 3) break;
                    const result = getMinMaxCorner(positions);
                    const { minPos, maxPos } = result;

                    drawCanvas(minPos, maxPos);

                    canvasGeoInfo = {
                        rect: [minPos[0], minPos[1], maxPos[0], maxPos[1]],
                        height: positions[0][2],
                    };
                } while (false);
                this._geoPolygonCanvas.canvasGeoInfo = canvasGeoInfo;

                nextAnimateFrame(() => {
                    this._geoPolygonCanvas.canvasChanged.emit();
                });
            }
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this._geoPolygon.pointsChanged,
                this._geoPolygonCanvas.canvasWidthChanged,
            ));
            this.dispose(event.disposableOn(update));
        }
    }
}

export type CanvasGeoInfoType = { rect: [number, number, number, number], height: number };

export class GeoPolygonCanvas extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _geoPolygonWithId;
    get geoPolygonWithId() { return this._geoPolygonWithId; }

    private _canvas = document.createElement('canvas');
    get canvas() { return this._canvas; }
    private _canvasCtx = this._canvas.getContext('2d') as CanvasRenderingContext2D;
    get canvasCtx() { return this._canvasCtx; }
    private _canvasChanged = this.disposeVar(new Event());
    get canvasChanged() { return this._canvasChanged; }

    private _canvasGeoInfo = this.disposeVar(reactJsonWithUndefined<CanvasGeoInfoType>(undefined));
    get canvasGeoInfo() { return this._canvasGeoInfo.value; }
    set canvasGeoInfo(value: CanvasGeoInfoType | undefined) { this._canvasGeoInfo.value = value; }
    get canvasGeoInfoChanged() { return this._canvasGeoInfo.changed; }

    static saveCanvasToClipboard = saveCanvasToClipboard;
    static PolygonCanvasResetting = PolygonCanvasResetting;

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._geoPolygonWithId = this.disposeVar(new ESSceneObjectWithId());
        this.dispose(track([this._geoPolygonWithId, 'id'], [this, 'geoPolygonId']));
        this.disposeVar(new ObjResettingWithEvent(this.geoPolygonWithId.sceneObjectChanged, () => {
            const { sceneObject } = this.geoPolygonWithId;
            if (!sceneObject) return undefined;
            if (!(sceneObject instanceof ESGeoPolygon)) return undefined;
            return new GeoPolygonCanvas.PolygonCanvasResetting(this, sceneObject);
        }));
    }
}

export namespace GeoPolygonCanvas {
    export const createDefaultProps = () => ({
        enabled: true,
        geoPolygonId: '',
        canvasWidth: 512,
    });
}
extendClassProps(GeoPolygonCanvas.prototype, GeoPolygonCanvas.createDefaultProps);
export interface GeoPolygonCanvas extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoPolygonCanvas.createDefaultProps>> { }
