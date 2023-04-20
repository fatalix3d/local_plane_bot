const FlyState = require('./flyState.js');

class FlyInfo{
    constructor(chatId, userId) {
        this.state = FlyState.START;
        this.chat_id = chatId;
        this.user_id = userId;
        this.plane_id = 0;
        this.flight_date = 'no data';
        this.start_airport = 'no data';
        this.end_airport = 'no data';
        this.start_fuel = 0;
        this.end_fuel = 0;
        this.start_hobs = 0;
        this.end_hobs = 0;
        this.start_time = 'no data';
        this.end_time = 'no data';
        this.landing_count = 0;
        this.second_pilot = false;
        this.second_pilot_first_name = 'no data';
        this.second_pilot_second_name = 'no data';
        this.second_pilot_last_name = 'no data';
        this.comment = 'empty';
    }

    Clear(){
        this.state = FlyState.START;
    }

    HasNullValues() {
        for (const key in this) {
            if (this[key] === null) {
                return true;
            }
        }
        return false;
    }

    ToJSONString() {
        const replacer = (key, value) => {
            if (key === 'state' || key === 'user_id' || key === 'landing_count') {
                return undefined;
            }
            return value;
        };
        return JSON.stringify(this, replacer);
    }
}

module.exports = FlyInfo;