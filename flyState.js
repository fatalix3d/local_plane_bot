const FlyState = Object.freeze({
    START: "start",
    JET_SELECT: "jet_select",
    FLIGHT_DATE: "flight_date",
    SECOND_PILOT: "second_pilot",
    SECOND_PILOT_INFO: "second_pilot_info",
    START_AIR_PORT : "start_airport",
    START_FUEL : "start_fuel",
    START_HOBS : "start_hobs",
    START_FLY_TIME : "start_fly_time",
    END_FLY_TIME : "end_fly_time",
    LANDING_COUNT : "landing_count",
    END_AIR_PORT : "end_air_port",
    END_HOBS : "end_hobs",
    END_FUEL : "end_fuel",
    COMMENT_DIALOG : "comment_dialog",
    COMMENT : "comment",
});

module.exports = FlyState;