import { PickedInfo } from "earthsdk3";

export class CzmPickedInfo extends PickedInfo {
    constructor(public czmPickedInfo: any, childPickedInfo?: PickedInfo, public tilesetPickInfo?: any) {
        super(childPickedInfo);
    }
}
