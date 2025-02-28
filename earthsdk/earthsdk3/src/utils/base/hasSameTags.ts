
export function hasSameTags(leftTags: string[], rightTags: string[]) {
    for (let tag of leftTags) {
        if (rightTags.includes(tag)) {
            return true;
        }
    }
    return false;
}

//去除_ES_Viewer_限制
// export function getViewerTags(devTags: string[] | undefined) { return devTags && devTags.filter(v => v.startsWith('_ES_Viewer_')) }

export function hasSameViewerTags(leftDevTags: string[] | undefined, rightDevTags: string[] | undefined) {
    const leftViewerTags = leftDevTags;
    const rightViewerTags = rightDevTags;

    // 如果viewerTags或者sceneObject的viewerTags都是空数组或者undefined的话，就认为都接受
    if (leftViewerTags === undefined || leftViewerTags.length === 0 || rightViewerTags === undefined || rightViewerTags.length === 0) {
        return true;
    } else {
        return hasSameTags(leftViewerTags, rightViewerTags);
    }
}
