export type DrawRect = {
    left: number,
    top: number,
    right: number,
    bottom: number,
}

export function getDrawRect(
    winPos: [number, number],
    size: [number, number],
    scale: [number, number],
    originRatioAndOffset: [number, number, number, number]
): DrawRect {
    const [left, top] = winPos;
    const [rx, ry, mx, my] = originRatioAndOffset;
    const _w = size[0] * scale[0];
    const _h = size[1] * scale[1];
    const left_ = left - (_w * rx + mx);
    const top_ = top - (_h * ry + my);

    return {
        left: left_,
        top: top_,
        right: left_ + _w,
        bottom: top_ + _h,
    };
}

/**
 * 
 * @param ctx Context
 * @param mbx 底部中点x值
 * @param mby 底部中点y值
 * @param w 底部中点到圆心中点的距离
 * @param fillStyle
 */
export function drawPoint(ctx: CanvasRenderingContext2D, mbx: number, mby: number, w: number, fillStyle: string) {
    ctx.beginPath();
    ctx.moveTo(mbx, mby);
    ctx.lineTo(mbx - w * .5, mby - w * .5);
    ctx.arc(mbx, mby - w, w * .7071067811865475, Math.PI * .75, Math.PI * .25);
    ctx.lineTo(mbx, mby);

    // 这种方法对性能消耗太大！
    // ctx.lineCap = 'square';
    // ctx.lineWidth = 2;
    // ctx.strokeStyle = '#000A';
    // ctx.stroke();
    // ctx.shadowColor = "rgba(255, 255, 255, 1)";
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

export function drawRoundRectPath(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(left + radius, top);
    ctx.lineTo(left + width - radius, top);
    ctx.arcTo(left + width, top, left + width, top + radius, radius);
    ctx.lineTo(left + width, top + height - radius);
    ctx.arcTo(left + width, top + height, left + width - radius, top + height, radius);
    ctx.lineTo(left + radius, top + height);
    ctx.arcTo(left, top + height, left, top + height - radius, radius);
    ctx.lineTo(left, top + radius);
    ctx.arcTo(left, top, left + radius, top, radius);
}

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
//     ctx.fillText(text, cx - tw*.5, cy + th*.5 - textMetrics.fontBoundingBoxDescent);
// }

// 修复firefox浏览文字不显示的问题 vtxf 20220308
export function drawText(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, font: string, fillStyle: string) {
    ctx.font = font;

    const textMetrics = ctx.measureText(text); // TextMetrics object
    const tw = textMetrics.actualBoundingBoxLeft + textMetrics.actualBoundingBoxRight;
    // firefox浏览器没有fontBoundingBoxAscent，会导致th变成NaN！
    const ascent = Number.isFinite(textMetrics.fontBoundingBoxAscent) ? textMetrics.fontBoundingBoxAscent : textMetrics.actualBoundingBoxAscent;
    const descent = Number.isFinite(textMetrics.fontBoundingBoxDescent) ? textMetrics.fontBoundingBoxDescent : textMetrics.actualBoundingBoxDescent;

    let th = ascent + descent // 注意actualXXX并不能反映真实高度！

    // 这个对性能消耗太大
    // ctx.strokeStyle = '#FFFA';
    // ctx.lineWidth = 1;
    // ctx.strokeText(text, mbx - tw*.5, mby - w*.5 + th*.5 - textMetrics.fontBoundingBoxDescent);

    ctx.fillStyle = fillStyle;
    ctx.fillText(text, cx - tw * .5, cy + th * .5 - descent);
}


export function imageToCanvas(image: CanvasImageSource) {
    //@ts-ignore
    const { width: _w, height: _h } = image;
    const width = _w instanceof SVGAnimatedLength ? _w.baseVal.SVG_LENGTHTYPE_PX : _w;
    const height = _h instanceof SVGAnimatedLength ? _h.baseVal.SVG_LENGTHTYPE_PX : _h;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const cavnasCtx = canvas.getContext('2d');
    if (!cavnasCtx) {
        throw new Error(`!cavnasCtx`);
    }
    cavnasCtx.drawImage(image, 0, 0, width, height);

    return canvas;
}

export function setCanvasUniformColor(canvas: HTMLCanvasElement, color: [number, number, number]) {
    const { width, height } = canvas;
    const cavnasCtx = canvas.getContext('2d');
    if (!cavnasCtx) {
        throw new Error(`!cavnasCtx`);
    }
    const [r, g, b] = color.map(e => (e * 255 | 0));

    const imageData = cavnasCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }
    cavnasCtx.putImageData(imageData, 0, 0);
}

export function drawTextBlock(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    originRatioAndOffset: [number, number, number, number] = [0.5, 1, 0, 0],
    text: string,
    fontStyle: string = '12px Arial',
    borderWidth: number = 2,
    fgStyle: string = '#FFF',
    bgStyle: string = '#000A',
) {
    ctx.font = fontStyle;
    const textMetrics = ctx.measureText(text); // TextMetrics object
    const width = textMetrics.actualBoundingBoxLeft + textMetrics.actualBoundingBoxRight;
    const height = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent; // 注意actualXXX并不能反映真实高度！
    const posLeft = left;
    const posTop = top;
    const boxWidth = width + borderWidth * 2;
    const boxHeight = height + borderWidth * 2;
    const { left: l, top: t, bottom: b } = getDrawRect([posLeft, posTop], [boxWidth, boxHeight], [1, 1], originRatioAndOffset);
    ctx.fillStyle = bgStyle;
    // ctx.fillRect(l, t, boxWidth, boxHeight);
    drawRoundRectPath(ctx, l, t, boxWidth, boxHeight, borderWidth);
    ctx.fill();

    ctx.fillStyle = fgStyle;
    ctx.fillText(text, l + borderWidth, b - borderWidth - textMetrics.fontBoundingBoxDescent);
}

export function uint8ToHexStr(uint8: number) {
    return ('00' + uint8.toString(16).toUpperCase()).substr(-2);
}

export function getColorHexStr(color: [number, number, number, number]) {
    const [r, g, b, a] = color.map(e => (e * 255 | 0));
    return `#${uint8ToHexStr(r)}${uint8ToHexStr(g)}${uint8ToHexStr(b)}${uint8ToHexStr(a)}`;
}