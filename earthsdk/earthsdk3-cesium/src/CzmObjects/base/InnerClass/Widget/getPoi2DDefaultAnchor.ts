// 计算标注锚点
export function getPoi2DDefaultAnchor(widgetInfo: HTMLElement, mode: string) {
    // 通过createInstanceClass加载div后,获取不到尺寸，克隆个节点手动添加后获取尺寸后再删除
    let defaultAnchor: [number, number] = [0, 0];
    if (!widgetInfo || !mode) return defaultAnchor;
    const tempDiv = widgetInfo.cloneNode(true) as HTMLDivElement;
    tempDiv.style.position = "absolute";
    tempDiv.style.top = "0";
    tempDiv.style.zIndex = '-1';
    document.body.appendChild(tempDiv);
    const anchorImg = (tempDiv.querySelector(`.${mode}-anchor`) ?? tempDiv.querySelector(`.${mode}-iconBox`)) as HTMLImageElement;
    if (anchorImg && anchorImg.parentElement) {
        // ["P3D02", "P3D04", "Flag01"]锚点需要特殊处理，锚点根据锚点元素在整个标注的位置进行确定
        const anchorY =
            (anchorImg.parentElement.offsetTop + anchorImg.parentElement.offsetHeight - (["Flag01"].includes(mode) ? 10 : ["P3D02", "P3D04"].includes(mode) ? 15 : 0)) / tempDiv.offsetHeight;
        defaultAnchor = [
            (anchorImg.offsetLeft + anchorImg.width / 2) / tempDiv.offsetWidth,
            anchorY < 1 ? anchorY : 1
        ] as [number, number];
    }
    document.body.removeChild(tempDiv);
    return defaultAnchor;
}