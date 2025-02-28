import { CanvasPoi, CanvasPrimitivesContext, getExtProp, react, setExtProp, Transition } from "xbsj-base";
import { drawTextBlock, getColorHexStr, getDrawRect, imageToCanvas, setCanvasUniformColor } from "./drawUtils";

function getExtImage(image: CanvasImageSource, color: [number, number, number]) {
    const [r, g, b] = color;
    const name = `${r}-${g}-${b}`;
    let imageCanvas = getExtProp<HTMLCanvasElement>(image, name);
    if (!imageCanvas) {
        imageCanvas = imageToCanvas(image);
        setCanvasUniformColor(imageCanvas, color);
        setExtProp(image, name, imageCanvas);
    }

    return imageCanvas;
}

export class CanvasImagePoi extends CanvasPoi {
    private _tooltip: string = '';
    private _title: string = '';
    private __scale: [number, number] = [1, 1];
    private _tooltipAlpha: number = 0;
    private _bgColor: [number, number, number, number] = [.3, .3, .3, 0.8];
    private _bgColorHexStr: string = getColorHexStr(this._bgColor);
    private _fgColor: [number, number, number, number] = [1, 1, 1, 1];
    private _fgColorHexStr: string = getColorHexStr(this._fgColor);

    // 用来强制确定tooltipShow是否显示
    private _tooltipShow = this.disposeVar(react(true));
    get tooltipShow() { return this._tooltipShow.value; }
    set tooltipShow(value: boolean) { this._tooltipShow.value = value; }
    get tooltipShowChanged() { return this._tooltipShow.changed; }

    constructor(
        canvasPrimitivesContext: CanvasPrimitivesContext,
        private _image?: CanvasImageSource,
        private _size: [number, number] = [32, 32],
        private _originRatioAndOffset: [number, number, number, number] = [0.5, 1.0, 0.0, 0.0], // 原点在底部中间位置，先到比例所在位置，再做进一步偏移。
        private _defaultColorStr: string = '#F00F',
    ) {
        super(canvasPrimitivesContext);

        const hoverScaleTransition = new Transition(100);
        const activeScaleTransition = new Transition(100);
        this.dispose(() => {
            hoverScaleTransition.destroy();
            activeScaleTransition.destroy();
        });

        const updateScale = () => {
            if (this._clickEvent && !this._clickEvent.empty) {
                const scale = (1.0 + .08 * activeScaleTransition.current) * (1.0 + .08 * hoverScaleTransition.current);
                this._scale = [scale, scale];

                this._tooltipAlpha = hoverScaleTransition.current;
            }
        }

        this.dispose(this.activedChanged.disposableOn(actived => {
            activeScaleTransition.target = actived ? 1 : 0;
            this.needRedraw();
        }));

        const updateHovered = () => {
            const hovered = this.tooltipShow && this.hovered;
            hoverScaleTransition.target = hovered ? 1 : 0;
            this.needRedraw();
        }
        this.dispose(this.hoveredChanged.disposableOn(updateHovered));
        this.dispose(this.tooltipShowChanged.disposableOn(updateHovered));

        this.dispose(this.selectedChanged.disposableOn(() => {
            this.needRedraw();
        }));

        this.dispose(activeScaleTransition.currentChanged.disposableOn(updateScale));
        this.dispose(hoverScaleTransition.currentChanged.disposableOn(updateScale));
    }

    set size(value: [width: number, height: number]) {
        const [w, h] = value;
        const [w_, h_] = this._size;
        if (w_ !== w || h_ !== h) {
            this._size[0] = w;
            this._size[1] = h;
            this.needRedraw();
            this.needPickRedraw();
        }
    }

    get size() {
        return this._size;
    }

    protected set _scale(value: [width: number, height: number]) {
        const [w, h] = value;
        const [w_, h_] = this.__scale;
        if (w_ !== w || h_ !== h) {
            this.__scale[0] = w;
            this.__scale[1] = h;
            this.needRedraw();
            this.needPickRedraw();
        }
    }

    protected get _scale() {
        return this.__scale;
    }

    set fgColor(value: [red: number, green: number, blue: number, alpha: number]) {
        if (!this._fgColor.every((e, i) => value[i] === e)) {
            const [r, g, b, a] = value;
            this._fgColor.splice(0, 4, r, g, b, a);
            this._fgColorHexStr = getColorHexStr(this._fgColor);
            this.needRedraw();
        }
    }

    get fgColor() {
        return this._fgColor;
    }

    set bgColor(value: [red: number, green: number, blue: number, alpha: number]) {
        if (!this._bgColor.every((e, i) => value[i] === e)) {
            const [r, g, b, a] = value;
            this._bgColor.splice(0, 4, r, g, b, a);
            this._bgColorHexStr = getColorHexStr(this._bgColor);
            this.needRedraw();
        }
    }

    get bgColor() {
        return this._bgColor;
    }

    set originRatioAndOffset(value: [leftRatio: number, topRatio: number, leftOffset: number, topOffset: number]) {
        const [a, b, c, d] = this._originRatioAndOffset
        const [a_, b_, c_, d_] = value;
        if (a !== a_ || b !== b_ || c !== c_ || d !== d_) {
            this._originRatioAndOffset.splice(0, 4, a_, b_, c_, d_);
            this.needRedraw();
            this.needPickRedraw();
        }
    }

    get originRatioAndOffset() {
        return this._originRatioAndOffset;
    }

    set image(value: CanvasImageSource | undefined) {
        if (this._image !== value) {
            this._image = value;
            this.needRedraw();
        }
    }

    get image() {
        return this._image;
    }

    set defaultColorStr(value: string) {
        if (this._defaultColorStr !== value) {
            this._defaultColorStr = value;
            this.needRedraw();
        }
    }

    get defaultColorStr() {
        return this._defaultColorStr;
    }

    set tooltip(value: string) {
        if (this._tooltip !== value) {
            this._tooltip = value;
            this.needRedraw();
        }
    }

    get tooltip() {
        return this._tooltip;
    }

    set title(value: string) {
        if (this._title !== value) {
            this._title = value;
            this.needRedraw();
        }
    }

    get title() {
        return this._title;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this._show) {
            return;
        }

        const [left, top] = this._winPos;

        const w = this._size[0] * this.__scale[0];
        const h = this._size[1] * this.__scale[1];

        const { left: l, top: t, right: r, bottom: b } = getDrawRect([left, top], this._size, this.__scale, this._originRatioAndOffset);

        const originGlobalAlpha = ctx.globalAlpha;
        ctx.globalAlpha = this.opacity;
        if (this._image) {
            if (this.selected) {
                const whiteImageCanvas = getExtImage(this._image, [1, 0, 0]);
                const { left: l, top: t } = getDrawRect([left, top], [w + 6, h + 6], [1, 1], this._originRatioAndOffset);
                ctx.drawImage(whiteImageCanvas, l, t, w + 6, h + 6);
                // drawPoint(ctx, left, top+5, w*.6+5, '#FFF');
            }

            // 背景色 前景色 用到图片上的效果特别不好！
            // if (this.actived) {
            //     const [r, g, b, a] = this._fgColor;
            //     const whiteImageCanvas = getExtImage(this._image, [r, g, b]);
            //     const { left: l, top: t } = getDrawRect([left, top], [w+8, h+8], [1, 1], this._originRatioAndOffset);
            //     ctx.drawImage(whiteImageCanvas, l, t, w+8, h+8);
            //     // drawPoint(ctx, left, top+5, w*.6+5, '#FFF');
            // }

            // if (this.hovered) { 
            //     const [r, g, b, a] = this._bgColor;
            //     const blackImageCanvas = getExtImage(this._image, [r, g, b]);
            //     const { left: l, top: t } = getDrawRect([left, top], [w+4, h+4], [1, 1], this._originRatioAndOffset);
            //     ctx.drawImage(blackImageCanvas, l, t, w+4, h+4);
            //     // drawPoint(ctx, left, top+3, w*.6+3, '#000A');
            // }

            ctx.drawImage(this._image, l, t, w, h);
        } else {
            ctx.fillStyle = this._fgColorHexStr;
            ctx.fillRect(l, t, w, h);
        }

        if (this._title !== '') {
            drawTextBlock(ctx, left + 20, top - 16, [0, .5, 0, 0], this._title, '14px Arial', 4, this._fgColorHexStr, this._bgColorHexStr);
        }

        ctx.globalAlpha = originGlobalAlpha;

        if (this._hovered && this._tooltip !== '') {
            const originGlobalAlpha = ctx.globalAlpha;
            ctx.globalAlpha = this._tooltipAlpha;

            drawTextBlock(ctx, (l + r) * .5, t - 5, [0.5, 1, 0, 0], this._tooltip, '12px Arial', 4, this._fgColorHexStr, this._bgColorHexStr);

            ctx.globalAlpha = originGlobalAlpha;
        }
    }

    drawForPick(ctx: CanvasRenderingContext2D, createPickColor: (tag: string) => string) {
        if (!this._show) {
            return;
        }

        const [left, top] = this._winPos;

        const pickColor = createPickColor('default');

        const w = this._size[0] * this.__scale[0];
        const h = this._size[1] * this.__scale[1];

        const { left: l, top: t } = getDrawRect([left, top], this._size, this.__scale, this._originRatioAndOffset);

        ctx.fillStyle = pickColor;
        ctx.fillRect(l, t, w, h);
    }
}

