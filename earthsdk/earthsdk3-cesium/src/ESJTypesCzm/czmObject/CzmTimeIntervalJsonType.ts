export type CzmTimeIntervalCollectionJsonType = {
    type: 'fromIso8601',
    iso8601: string; //	String		An ISO 8601 interval.
    isStartIncluded?: boolean; //	Boolean	true	optionaltrue if start time is included in the interval, false otherwise.
    isStopIncluded?: boolean; //	Boolean	true	optionaltrue if stop time is included in the interval, false otherwise.
    leadingInterval?: boolean; //	Boolean	false	optionaltrue if you want to add a interval from Iso8601.MINIMUM_VALUE to start time, false otherwise.
    trailingInterval?: boolean; //	Boolean	false	optionaltrue if you want to add a interval from stop time to Iso8601.MAXIMUM_VALUE, false otherwise.
} | {
    type: 'fromIso8601DateArray',
    iso8601Dates?: string[]; //	Array.<String>		An array of ISO 8601 dates.
    isStartIncluded?: boolean; //	Boolean	true	optionaltrue if start time is included in the interval, false otherwise.
    isStopIncluded?: boolean; //	Boolean	true	optionaltrue if stop time is included in the interval, false otherwise.
    leadingInterval?: boolean; //	Boolean	false	optionaltrue if you want to add a interval from Iso8601.MINIMUM_VALUE to start time, false otherwise.
    trailingInterval?: boolean; //	Boolean	false	optionaltrue if you want to add a interval from stop time to Iso8601.MAXIMUM_VALUE, false otherwise.
};