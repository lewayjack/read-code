
import { CanvasPoi, Transition, Event, CanvasPrimitivesContext } from "xbsj-base";
import { drawBubble, drawText } from "./drawUtils";

// export function drawPoint(ctx: CanvasRenderingContext2D, mbx: number, mby: number, w: number, fillStyle: string) {
//     ctx.beginPath();
//     ctx.moveTo(mbx, mby);
//     ctx.lineTo(mbx - w * .5, mby - w * .5);
//     ctx.arc(mbx, mby - w, w * .7071067811865475, Math.PI * .75, Math.PI * .25);
//     ctx.lineTo(mbx, mby);

//     // 这种方法对性能消耗太大！
//     // ctx.lineCap = 'square';
//     // ctx.lineWidth = 2;
//     // ctx.strokeStyle = '#000A';
//     // ctx.stroke();
//     // ctx.shadowColor = "rgba(255, 255, 255, 1)";
//     ctx.fillStyle = fillStyle;
//     ctx.fill();
// }

// export function drawText(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, font: string, fillStyle: string) {
//     ctx.font = font;

//     const textMetrics = ctx.measureText(text); // TextMetrics object
//     const tw = textMetrics.actualBoundingBoxLeft + textMetrics.actualBoundingBoxRight;
//     const th = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent; // 注意actualXXX并不能反映真实高度！

//     // 这个对性能消耗太大
//     // ctx.strokeStyle = '#FFFA';
//     // ctx.lineWidth = 1;
//     // ctx.strokeText(text, mbx - tw*.5, mby - w*.5 + th*.5 - textMetrics.fontBoundingBoxDescent);

//     ctx.fillStyle = fillStyle;
//     ctx.fillText(text, cx - tw * .5, cy + th * .5 - textMetrics.fontBoundingBoxDescent);
// }

// TODO(vtxf): 以后再基于此创建一个场景对象出来！

export class CanvasBubblePoi extends CanvasPoi {
    private _width: number = 16;
    private _text: string = '';
    private _fillStyle: string = '#0F0';
    private _scale: number = 1;
    protected _scaleChanged?: Event<[number, CanvasBubblePoi]>; // scale: number, self: CanvasBubblePoi
    constructor(canvasPrimitivesContext: CanvasPrimitivesContext) {
        super(canvasPrimitivesContext);

        // scale发生变化时，需要重绘
        this.dispose(this.scaleChanged.disposableOn((scale) => {
            this.needRedraw();
            this.needPickRedraw();
        }));

        // 两个事件需要的渐变效果
        const hoverScaleTransition = this.disposeVar(new Transition(100));
        const activeScaleTransition = this.disposeVar(new Transition(100));
        const updateScale = () => {
            if (this._clickEvent && !this._clickEvent.empty) {
                this.scale = (1.0 + .1 * activeScaleTransition.current) * (1.0 + .2 * hoverScaleTransition.current);
            }
        }
        // 激活时(点击时)
        this.dispose(activeScaleTransition.currentChanged.disposableOn(updateScale));
        // 光标划过时
        this.dispose(hoverScaleTransition.currentChanged.disposableOn(updateScale));

        this.dispose(this.activedChanged.disposableOn(actived => {
            activeScaleTransition.target = actived ? 1 : 0;
            this.needRedraw();
        }));
        this.dispose(this.hoveredChanged.disposableOn(hovered => {
            hoverScaleTransition.target = hovered ? 1 : 0;
            this.needRedraw();
        }));

        this.dispose(this.selectedChanged.disposableOn(selected => {
            this.needRedraw();
        }));
    }

    /**
     * poi的缩放属性，可读写，默认1.0
     */
    set scale(value: number) {
        if (this._scale !== value) {
            this._scale = value;
            this._scaleChanged && this._scaleChanged.emit(value, this);
        }
    }

    get scale() {
        return this._scale;
    }

    /**
     * poi的缩放属性发生变化时触发此事件！
     * @example
     * // 监听scale变化
     * var d = xxx.scaleChanged.disposableOn(scale => console.log(`scale: ${scale}`));
     * // 取消监听
     * d();
     */
    get scaleChanged() {
        if (!this._scaleChanged) {
            this._scaleChanged = new Event();
        }

        return this._scaleChanged;
    }

    set width(value: number) {
        if (this._width !== value) {
            this._width = value;
            this.needRedraw();
            this.needPickRedraw();
        }
    }

    get width() {
        return this._width;
    }

    /**
     * poi中显示的文字，可以读写
     * @example
     * poi.text = '123';
     */
    set text(value: string) {
        if (this._text !== value) {
            this._text = value;
            this.needRedraw();
        }
    }

    /**
     * poi中显示的文字，可以读写
     */
    get text() {
        return this._text;
    }

    /**
     * poi的样式(颜色)，可以读写，和Canvas中的设置保持一致
     * @link https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
     * @example
     * poi.fillStyle = "orange";
     * poi.fillStyle = "#FFA500";
     * poi.fillStyle = "rgb(255,165,0)";
     * poi.fillStyle = "rgba(255,165,0,1)";
     */
    set fillStyle(value: string) {
        if (this._fillStyle !== value) {
            this._fillStyle = value;
            this.needRedraw();
        }
    }

    /**
     * poi的样式(颜色)，可以读写，和Canvas中的设置保持一致
     * @link https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
     */
    get fillStyle() {
        return this._fillStyle;
    }

    /**
     * 绘制poi
     * @param ctx Canvas的Context，用来绘制
     * @returns 
     */
    draw(ctx: CanvasRenderingContext2D) {
        if (!this._show) {
            return;
        }

        const [left, top] = this._winPos;

        const originGlobalAlpha = ctx.globalAlpha;
        ctx.globalAlpha = this.opacity;

        const width = this._width * this._scale;

        if (this.selected) {
            drawBubble(ctx, left, top + 3, width + 3, '#F00');
        }

        // 先画大一圈的，这样作为轮廓来使用
        // drawPoint(ctx, mbx, mby+2, w+4, '#FFFA');
        if (this.actived && this._clickEvent && !this._clickEvent.empty) {
            drawBubble(ctx, left, top + 5, width + 5, '#FFF');
        }

        if (this.hovered) {
            drawBubble(ctx, left, top + 3, width + 3, '#000A');
        } else {
            drawBubble(ctx, left, top + 1, width + 1, '#000A');
        }
        drawBubble(ctx, left, top, width, this._fillStyle);

        const font = this._scale > 1.2 ? 'bold 14px Arial' : 'bold 10px Arial';
        drawText(ctx, left, top - width, this._text, font, '#000');

        ctx.globalAlpha = originGlobalAlpha;
    }

    /**
     * 该操作主要用于拾取，需要在绘制区域返回createPickColor中指定的颜色，借此来拾取相应的对象
     * @param ctx 
     * @param createPickColor 
     * @returns 
     */
    drawForPick(ctx: CanvasRenderingContext2D, createPickColor: (tag: string) => string) {
        if (!this._show) {
            return;
        }

        const [left, top] = this._winPos;

        const width = this._width * this._scale;
        const pickColor = createPickColor('default');
        drawBubble(ctx, left, top, width, pickColor);
    }
}
