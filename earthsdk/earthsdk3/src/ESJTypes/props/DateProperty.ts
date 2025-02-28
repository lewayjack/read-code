import { ReactVarProperty } from "./ReactVarProperty";

export class DateProperty extends ReactVarProperty<number | undefined> {
    override get type() { return 'DateProperty'; }
}