import { PickedInfo } from "earthsdk3";
import { CzmPickedInfo } from "../../ESJTypesCzm";

export function getCzmPickedInfoFromPickedInfo(pickedInfo?: PickedInfo): CzmPickedInfo | undefined {
    if (!pickedInfo) return undefined;
    // Check if pickedInfo is already of type CzmPickedInfo
    if (pickedInfo instanceof CzmPickedInfo) {
        return pickedInfo;
    }
    // If not, try to find it in childPickedInfo (assuming it exists)
    const childCzmPickedInfo = pickedInfo.childPickedInfo;
    if (childCzmPickedInfo) {
        return getCzmPickedInfoFromPickedInfo(childCzmPickedInfo);
    }
    // If childPickedInfo is also undefined, return undefined
    return undefined;
}
