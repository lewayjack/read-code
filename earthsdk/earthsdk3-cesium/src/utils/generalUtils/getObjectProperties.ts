// 查找对象属性
export function getObjectProperties(pickedInfo: any, searchKey: string): any {
    if (!pickedInfo) return undefined;
    if (!Object.prototype.hasOwnProperty.call(pickedInfo, searchKey)) {
        return getObjectProperties(pickedInfo.childPickedInfo, searchKey);
    } else {
        return pickedInfo[searchKey] != undefined ? Object.assign({}, pickedInfo[searchKey]) : undefined;
    }
}