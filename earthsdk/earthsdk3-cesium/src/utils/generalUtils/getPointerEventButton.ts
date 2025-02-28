import { PickedInfo } from "earthsdk3";
import { getObjectProperties } from "./getObjectProperties";

// 获取pointerEvent鼠标button数字
export function getPointerEventButton(pickedInfo: PickedInfo) {
    const pointerEvent = getObjectProperties(pickedInfo, "attachedInfo")?.pointerEvent as PointerEvent;
    // 默认值修改为-1,找不到鼠标事件，返回-1，为自定义触发处理
    return pointerEvent?.buttons != 0 ? pointerEvent?.button ?? 0 : -1;
}