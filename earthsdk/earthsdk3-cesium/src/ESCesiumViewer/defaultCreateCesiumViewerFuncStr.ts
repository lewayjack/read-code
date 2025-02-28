export const defaultCreateCesiumViewerFuncStr = `\
async function initCesiumViewer(container, czmViewer) {
    const viewer = await XE2.g.defaultCreateCesiumViewerFunc(container, czmViewer);

    // 若原Czm版权信息展示位置遮挡重要信息，可将以下语句解注释，在别的位置展示
    viewer._cesiumWidget._creditContainer.style.display = "none";

    return viewer;
}
`;