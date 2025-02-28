import { CanvasPoi, CanvasPrimitivesContext, react, Transition } from "xbsj-base";
import { drawPoint, drawText } from "./drawUtils";

const defaultRadius = 6;

export class CanvasPointPoi extends CanvasPoi {
    private _scale = react(1);
    get scale() { return this._scale.value; }
    protected set scale(value: number) { this._scale.value = value; }
    protected get scaleChanged() { return this._scale.changed; }

    private _text = react<string | undefined>(undefined);
    get text() { return this._text.value; }
    set text(value: string | undefined) { this._text.value = value; }
    get textChanged() { return this._text.changed; }

    private _font = react<string | undefined>(undefined);
    get font() { return this._font.value; }
    /**
     * @example
     * 'bold 10px Arial'
     */
    set font(value: string | undefined) { this._font.value = value; }
    get fontChanged() { return this._font.changed; }

    private _fontStyle = react<string | undefined>(undefined);
    get fontStyle() { return this._fontStyle.value; }
    set fontStyle(value: string | undefined) { this._fontStyle.value = value; }
    get fontStyleChanged() { return this._fontStyle.changed; }

    private _radius = react<number | undefined>(undefined);
    get radius() { return this._radius.value; }
    set radius(value: number | undefined) { this._radius.value = value; }
    get radiusChanged() { return this._radius.changed; }

    private _outlineStyle = react<string | undefined>(undefined);
    get outlineStyle() { return this._outlineStyle.value; }
    set outlineStyle(value: string | undefined) { this._outlineStyle.value = value; }
    get outlineStyleChanged() { return this._outlineStyle.changed; }

    private _selectedStyle = react<string | undefined>(undefined);
    get selectedStyle() { return this._selectedStyle.value; }
    set selectedStyle(value: string | undefined) { this._selectedStyle.value = value; }
    get selectedStyleChanged() { return this._selectedStyle.changed; }

    private _fillStyle = react<string | undefined>(undefined);
    get fillStyle() { return this._fillStyle.value; }
    set fillStyle(value: string | undefined) { this._fillStyle.value = value; }
    get fillStyleChanged() { return this._fillStyle.changed; }

    constructor(canvasPrimitivesContext: CanvasPrimitivesContext) {
        super(canvasPrimitivesContext);

        // 两个事件需要的渐变效果
        const hoverScaleTransition = this.disposeVar(new Transition(100));
        const activeScaleTransition = this.disposeVar(new Transition(100));
        const updateScale = () => {
            if (this._clickEvent && !this._clickEvent.empty) {
                this._scale.value = (1.0 + .1 * activeScaleTransition.current) * (1.0 + .2 * hoverScaleTransition.current);
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

        this.dispose(this._scale.changed.disposableOn(() => (this.needRedraw(), this.needPickRedraw())));
        this.dispose(this._text.changed.disposableOn(() => (this.needRedraw(), this.needPickRedraw())));
        this.dispose(this._font.changed.disposableOn(() => this.needRedraw()));
        this.dispose(this._fontStyle.changed.disposableOn(() => this.needRedraw()));
        this.dispose(this._radius.changed.disposableOn(() => (this.needRedraw(), this.needPickRedraw())));
        this.dispose(this._fillStyle.changed.disposableOn(() => this.needRedraw()));
        this.dispose(this._outlineStyle.changed.disposableOn(() => this.needRedraw()));
        this.dispose(this._selectedStyle.changed.disposableOn(() => this.needRedraw()));
    }

    // /**
    //  * poi的缩放属性，可读写，默认1.0
    //  */
    // set scale(value: number) {
    //     if (this._scale !== value) {
    //         this._scale = value;
    //         this._scaleChanged && this._scaleChanged.emit(value, this);
    //     }
    // }

    // get scale() {
    //     return this._scale;
    // }

    // /**
    //  * poi的缩放属性发生变化时触发此事件！
    //  * @example
    //  * // 监听scale变化
    //  * var d = xxx.scaleChanged.disposableOn(scale => console.log(`scale: ${scale}`));
    //  * // 取消监听
    //  * d();
    //  */
    // get scaleChanged() {
    //     if (!this._scaleChanged) {
    //         this._scaleChanged = new Event();
    //     }

    //     return this._scaleChanged;
    // }

    // set radius(value: number) {
    //     if (this._radius !== value) {
    //         this._radius = value;
    //         this.needRedraw();
    //         this.needPickRedraw();
    //     }
    // }

    // get radius() {
    //     return this._radius;
    // }

    // /**
    //  * poi中显示的文字，可以读写
    //  * @example
    //  * poi.text = '123';
    //  */
    // set text(value: string) {
    //     if (this._text !== value) {
    //         this._text = value;
    //         this.needRedraw();
    //     }
    // }

    // /**
    //  * poi中显示的文字，可以读写
    //  */
    // get text() {
    //     return this._text;
    // }


    // /**
    //  * poi的样式(颜色)，可以读写，和Canvas中的设置保持一致
    //  * @link https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
    //  * @example
    //  * poi.fillStyle = "orange";
    //  * poi.fillStyle = "#FFA500";
    //  * poi.fillStyle = "rgb(255,165,0)";
    //  * poi.fillStyle = "rgba(255,165,0,1)";
    //  */
    // set fillStyle(value: string) {
    //     if (this._fillStyle !== value) {
    //         this._fillStyle = value;
    //         this.needRedraw();
    //     }
    // }

    // /**
    //  * poi的样式(颜色)，可以读写，和Canvas中的设置保持一致
    //  * @link https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
    //  */
    // get fillStyle() {
    //     return this._fillStyle;
    // }

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

        const radius = (this._radius.value ?? defaultRadius) * this._scale.value;

        if (this.selected) {
            drawPoint(ctx, left, top, radius + 3, this._selectedStyle.value ?? '#F00');
        }

        // 先画大一圈的，这样作为轮廓来使用
        // drawPoint(ctx, mbx, mby+2, w+4, '#FFFA');
        if (this.actived && this._clickEvent && !this._clickEvent.empty) {
            drawPoint(ctx, left, top, radius + 1, this._fillStyle.value ?? '#FFF');
        }

        if (this._outlineStyle.value) {
            if (this.hovered) {
                drawPoint(ctx, left, top, radius + 1, this._outlineStyle.value);
            } else {
                drawPoint(ctx, left, top, radius + 1, this._outlineStyle.value);
            }
        }

        drawPoint(ctx, left, top, radius, this._fillStyle.value ?? '#FFF');

        if (this._text.value) {
            // const font = this._scale.value > 1.2 ? 'bold 14px Arial' : 'bold 10px Arial';
            const font = this._font.value ?? 'bold 10px Arial';
            const fontStyle = this._fontStyle.value ?? '#000';
            drawText(ctx, left, top, this._text.value, font, fontStyle);
        }

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

        const radius = (this._radius.value ?? defaultRadius) * this._scale.value;
        const pickColor = createPickColor('default');
        drawPoint(ctx, left, top, radius, pickColor);
    }
}
