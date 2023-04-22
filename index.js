const TelegramApi = require('node-telegram-bot-api');
const token = "6229051464:AAEA0hgr5WIuQWiCJQm8C-DnXMj4zzCvt60";
const bot = new TelegramApi(token, {polling:true});

const FlyInfo = require('./flyInfo.js');
const FlyState = require('./flyState.js');

const admins =[351029552, 103045];

const axios = require('axios');

const users = [
    { id: "103045", airplanes: ["Cessna 150", "Zlin42M"] }, //sasha_milokhov = 351029552
    { id: "130543585", airplanes: ["Cessna 150"] },                 //div_nokia = 130543585
    { id: "PlanUragan150", airplanes: ["Cessna 150"] },             //PlanUragan150
    { id: "931282059", airplanes: ["Cessna 150"] },                  //OstLetin = 931282059
    { id: "332568271", airplanes: ["Cessna 150"] },                   //ippiart = 332568271
    { id: "810476772", airplanes: ["Cessna 150", "Zlin42M"] },     //AirAlex100 = 810476772
    { id: "332568271", airplanes: ["Cessna 150"] },                 //dbsmirnov = 332568271
    { id: "levan_z", airplanes: ["Cessna 150", "Zlin42M"] },        //levan_z
    { id: "351029552", airplanes: ["Cessna 150", "Zlin42M"] },          //ftx3d = 351029552
];

const userFlyInfo = [];

bot.setMyCommands([
    {command: '/start', description: 'Запуск бота'},
    {command: '/new_fly', description: 'Регистрация полета'},
]);

bot.on("message", async  msg => {
    const text = msg.text;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.username;

    if (msg.text === undefined)
        return;

    console.log(msg);
    //return bot.sendMessage(chatId, 'Ок');

    await ParseCommands(msg.text.toLowerCase(), chatId, userId, userName);
});

bot.on('callback_query', async (query) => {
    try {
        const chatId = query.message.chat.id;
        const option = query.data;

        if (userFlyInfo[chatId].state === FlyState.JET_SELECT) {
            switch (option) {
                case 'Cessna 150':
                    //await bot.answerCallbackQuery(query.id, {text: `Вы выбрали: ${option}`,});
                    await bot.sendMessage(query.message.chat.id, `Вы выбрали: ${option}`);
                    userFlyInfo[chatId].plane_id = 1;
                    userFlyInfo[chatId].state = FlyState.FLIGHT_DATE;
                    await bot.sendMessage(chatId, 'Введите дату вылета в формате (дд.мм.гггг):');
                    break;

                case 'Zlin42M':
                    await bot.sendMessage(query.message.chat.id, `Вы выбрали: ${option}`);
                    userFlyInfo[chatId].plane_id = 2;
                    userFlyInfo[chatId].state = FlyState.FLIGHT_DATE;
                    await bot.sendMessage(chatId, 'Введите дату вылета в формате (дд.мм.гггг):');
                    break;
            }
        }

        if (userFlyInfo[chatId].state === FlyState.SECOND_PILOT) {
            switch (option) {
                case 'Да':
                    await bot.sendMessage(query.message.chat.id, `Вы выбрали: [${option}]`);
                    userFlyInfo[chatId].second_pilot = true;
                    userFlyInfo[chatId].state = FlyState.SECOND_PILOT_INFO;
                    await bot.sendMessage(chatId, 'Введите ФИО второго пилота :');
                    break;

                case 'Нет':
                    await bot.sendMessage(query.message.chat.id, `Вы выбрали: [${option}]`);
                    userFlyInfo[chatId].second_pilot = false;
                    userFlyInfo[chatId].state = FlyState.START_AIR_PORT;
                    await bot.sendMessage(chatId, 'Аэропорт вашего вылета :');
                    break;
            }
        }

        if (userFlyInfo[chatId].state === FlyState.COMMENT_DIALOG) {
            switch (option) {
                case 'Да':
                    await bot.sendMessage(query.message.chat.id, `Вы выбрали: [${option}]`);
                    userFlyInfo[chatId].state = FlyState.COMMENT;
                    await bot.sendMessage(chatId, 'Комментарий :');
                    break;

                case 'Нет':
                    await bot.sendMessage(query.message.chat.id, `Вы выбрали: [${option}]`);

                    if(!userFlyInfo[chatId].HasNullValues()){
                        const jsonString = userFlyInfo[chatId].ToJSONString();
                        //await SendData(jsonString);

                        let data = jsonString;

                        let config = {
                            method: 'post',
                            maxBodyLength: Infinity,
                            url: 'https://localplane.ru/api/save',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer 1|uDYBAqRE1TzBTtDSc2XvEj7ZCJbxHvxTM3Om1VCw'
                            },
                            data : data
                        };

                        axios.request(config)
                            .then((response) => {
                                console.log(JSON.stringify(response.data));
                            })
                            .catch((error) => {
                                console.log(error);
                                if (error.response) {
                                    console.log('Error body:', error.response.data);
                                    return bot.sendMessage(chatId, `Ошибка. Такого пользователя нет`);
                                } else {
                                    console.log('Error:', error.message);
                                }
                            });
                    }

                    userFlyInfo[chatId].state = FlyState.START;
                    await bot.sendMessage(chatId, 'Спасибо, ваши данные были сохранены.');
                    break;
            }
        }

        // Удаляем inline клавиатуру после обработки выбора
        bot.answerCallbackQuery(query.id);
        bot.editMessageReplyMarkup({
            inline_keyboard: []
        }, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        });
    }
    catch (e){
        console.log(e);
    }
});

async function SendData(jsonString){
    let data = jsonString;

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://localplane.ru/api/save',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 1|uDYBAqRE1TzBTtDSc2XvEj7ZCJbxHvxTM3Om1VCw'
        },
        data : data
    };

    axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            //console.log(error);
            if (error.response) {
                console.log('Error body:', error.response.data);
                return bot.sendMessage(chatId, `Ошибка. Такого пользователя нет`);
            } else {
                console.log('Error:', error.message);
            }
        });
}

/////////////////// COMMANDS ////////////////////

async function ParseCommands(message, chatId, userId, userName){

    switch (message){
        // Initial state
        case '/start':
            if(isAdmin(userId)){
                await bot.sendMessage(chatId, "Вы админ!");
            }

            userFlyStateExist(chatId, userId);
            return  bot.sendMessage(chatId, "Добро пожаловать в чат");

        // Create else reset user fly state
        case '/new_fly':
            userFlyStateExist(chatId, userId);
            userFlyInfo[chatId].state = FlyState.JET_SELECT;

            const inlineKeyboard = createInlineKeyboard(userId.toString());
            let replyMarkup = null;
            replyMarkup = {
                inline_keyboard: inlineKeyboard,
            };

            if(replyMarkup !== null){
                return bot.sendMessage(chatId, 'Выберите самолет:', { reply_markup: replyMarkup });
            }
            else {
                return bot.sendMessage(chatId, 'Пользователь не найдет');
            }
    }

    if(!userFlyInfo[chatId])
        return ;

    switch (userFlyInfo[chatId].state) {

        case FlyState.FLIGHT_DATE.toLowerCase():
            if (!isValidDate(message)) {
                return bot.sendMessage(chatId, 'Введите дату вылета в формате (дд.мм.гггг):');
            }

            userFlyInfo[chatId].flight_date = message;
            userFlyInfo[chatId].state = FlyState.SECOND_PILOT;
            return bot.sendMessage(chatId, 'Наличие второго пилота :', {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'Да', callback_data: 'Да'}],
                        [{text: 'Нет', callback_data: 'Нет'}],
                    ]
                }
            });

        case FlyState.SECOND_PILOT_INFO.toLowerCase():
            const result = parseFullName(message);
            if (!result.lastName || !result.firstName || !result.middleName) {
                return bot.sendMessage(chatId, 'Введите ФИО второго пилота :');
            }

            userFlyInfo[chatId].second_pilot_last_name = result.lastName;
            userFlyInfo[chatId].second_pilot_first_name = result.firstName;
            userFlyInfo[chatId].second_pilot_second_name = result.middleName;

            userFlyInfo[chatId].state = FlyState.START_AIR_PORT;
            return bot.sendMessage(chatId, 'Аэропорт вашего вылета: ');

        case FlyState.START_AIR_PORT.toLowerCase():
            if (!checkText(message)) {
                return bot.sendMessage(chatId, `Не корректные данные!`);
            }

            userFlyInfo[chatId].start_airport = message;
            userFlyInfo[chatId].state = FlyState.START_FUEL;
            return bot.sendMessage(chatId, `Уровень топлива перед вылетом (пример 10.5):`);

        case FlyState.START_FUEL.toLowerCase():
            if (!CheckFuelValue(message)) {
                return bot.sendMessage(chatId, `Уровень топлива перед вылетом (пример 10.5):`);
            }

            userFlyInfo[chatId].start_fuel = message;
            userFlyInfo[chatId].state = FlyState.START_HOBS;
            return bot.sendMessage(chatId, `HOBBS запуск (1234.5) введите значение : `);

        case FlyState.START_HOBS.toLowerCase():
            if (!hobbsValueCheck(message)) {
                return bot.sendMessage(chatId, `HOBBS запуск (1234.5) введите значение : `);
            }

            userFlyInfo[chatId].start_hobs = message;
            userFlyInfo[chatId].state = FlyState.START_FLY_TIME;
            return bot.sendMessage(chatId, `Время вылета (UTC) в формате Часы,Минуты (ЧЧ:ММ) : `);

        case FlyState.START_FLY_TIME.toLowerCase():
            const t1 = validateTimeString(message);
            if(t1 === null){
                return bot.sendMessage(chatId, `Время вылета (UTC) в формате Часы,Минуты (ЧЧ:ММ) : `);
            }

            userFlyInfo[chatId].start_time = parseTime(t1, userFlyInfo[chatId].flight_date);
            userFlyInfo[chatId].state = FlyState.END_FLY_TIME;
            return bot.sendMessage(chatId, `Время посадки (UTC) в формате Часы,Минуты (ЧЧ:ММ) : `);

        case FlyState.END_FLY_TIME.toLowerCase():
            const t2 = validateTimeString(message);
            if(t2 === null){
                return bot.sendMessage(chatId, `Время посадки (UTC) в формате Часы,Минуты (ЧЧ:ММ) : `);
            }

            userFlyInfo[chatId].end_time = parseTime(t2, userFlyInfo[chatId].flight_date);
            userFlyInfo[chatId].state = FlyState.LANDING_COUNT;
            return bot.sendMessage(chatId, `Введите количество посадок : `);

        case FlyState.LANDING_COUNT.toLowerCase():
            if(!checkOnlyDigits(message)) {
                return bot.sendMessage(chatId, `Введите количество посадок : `);
            }
            userFlyInfo[chatId].landing_count = parseInt(message);
            userFlyInfo[chatId].state = FlyState.END_AIR_PORT;
            return bot.sendMessage(chatId, 'Аэропорт посадки :');

        case FlyState.END_AIR_PORT.toLowerCase():
            if (!checkText(message)){
                return bot.sendMessage(chatId, 'Аэропорт посадки :');
            }

            userFlyInfo[chatId].end_airport = message;
            userFlyInfo[chatId].state = FlyState.END_HOBS;
            return bot.sendMessage(chatId, `HOBBS выключение (1234.5) введите значение : `);

        case FlyState.END_HOBS.toLowerCase():
            if (!hobbsValueCheck(message)) {
                return bot.sendMessage(chatId, `HOBBS выключение (1234.5) введите значение : `);
            }

            userFlyInfo[chatId].end_hobs = message;
            userFlyInfo[chatId].state = FlyState.END_FUEL;
            return bot.sendMessage(chatId, `Уровень топлива после остановким (пример : 10.5)`);

        case FlyState.END_FUEL.toLowerCase():
            if (!CheckFuelValue(message)) {
                return bot.sendMessage(chatId, `Уровень топлива после остановким (пример : 10.5)`);
            }

            if(parseInt(message) >= userFlyInfo[chatId].start_fuel){
                await bot.sendMessage(chatId, `Уровень топлива не может быть больше начального ${userFlyInfo[chatId].start_fuel}`);
                return bot.sendMessage(chatId, `Уровень топлива после остановким (пример : 10.5)`);
            }
            userFlyInfo[chatId].end_fuel = message;
            userFlyInfo[chatId].state = FlyState.COMMENT_DIALOG;

            return bot.sendMessage(chatId, 'Комментарий :', {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'Да', callback_data: 'Да'}],
                        [{text: 'Нет', callback_data: 'Нет'}],
                    ]
                }
            });

        case FlyState.COMMENT.toLowerCase():
            userFlyInfo[chatId].comment = message;

            if(!userFlyInfo[chatId].HasNullValues()){
                const jsonString = userFlyInfo[chatId].ToJSONString();
                //await SendData(jsonString);

                let data = jsonString;

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://localplane.ru/api/save',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer 1|uDYBAqRE1TzBTtDSc2XvEj7ZCJbxHvxTM3Om1VCw'
                    },
                    data : data
                };

                axios.request(config)
                    .then((response) => {
                        console.log(JSON.stringify(response.data));
                    })
                    .catch((error) => {
                        console.log(error);
                        if (error.response) {
                            console.log('Error body:', error.response.data);
                            return bot.sendMessage(chatId, `Ошибка. Такого пользователя нет`);
                        } else {
                            console.log('Error:', error.message);
                        }
                    });
            }

            userFlyInfo[chatId].state = FlyState.START;

            return  bot.sendMessage(chatId, 'Спасибо, ваши данные были сохранены.');
    }
}
/////////////////// CHECK FUN ///////////////////

function isAdmin(userId) {
    return admins.includes(userId);
}

function isValidDate(str) {
    // Проверяем формат даты
    const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (!regex.test(str)) {
        return false;
    }

    // Разбиваем строку на части и преобразуем их в числа
    const [day, month, year] = str.split('.').map(Number);

    // Проверяем, является ли год високосным
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    // Проверяем, что месяц находится в диапазоне от 1 до 12
    if (month < 1 || month > 12) {
        return false;
    }

    // Проверяем, что день находится в диапазоне от 1 до 31, исключая февраль
    if (month !== 2 && (day < 1 || day > 31)) {
        return false;
    }

    // Проверяем, что день находится в диапазоне от 1 до 29, если год високосный и месяц февраль
    if (month === 2 && isLeapYear && (day < 1 || day > 29)) {
        return false;
    }

    // Проверяем, что день находится в диапазоне от 1 до 28, если год не високосный и месяц февраль
    if (month === 2 && !isLeapYear && (day < 1 || day > 28)) {
        return false;
    }

    // Проверяем, что день находится в диапазоне от 1 до 30, для остальных месяцев
    if ([4, 6, 9, 11].includes(month) && (day < 1 || day > 30)) {
        return false;
    }

    // Все проверки пройдены, возвращаем true
    return true;
}

function parseFullName(fullName) {
    // Разбиваем строку на отдельные слова и удаляем лишние пробелы
    const parts = fullName.trim().split(/\s+/);

    // Получаем фамилию, имя и отчество (если есть)
    const lastName = parts[0];
    const firstName = parts[1];
    const middleName = parts.length > 2 ? parts[2] : null;

    // Возвращаем объект с отдельными свойствами
    return {
        lastName: lastName,
        firstName: firstName,
        middleName: middleName
    };
}

function checkText(str){
    const regex = /^[a-zA-Zа-яА-Я0-9,\s]+$/;
    return regex.test(str);
}

function CheckFuelValue(str){
    const regex = /^([1-9]\d{0,2}|0)(\.\d{1,3})?$/;
    return regex.test(str);
}

function hobbsValueCheck(str){
    const regex =/^\d{4}\.[0-9]$|^$/;
    return regex.test(str);
}

function parseTime(timeStr, flyDate) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const [day, month, year] = flyDate.split('.').map(Number);

    const date = `${day}.${month}.${year} ${hours}:${minutes} UTC`
    return date;
}

function validateTimeString(timeString) {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/; // регулярное выражение для проверки формата 24:00

    if (!regex.test(timeString)) {
        return  null;
    }

    return timeString;
}

function checkOnlyDigits(str){
    const regex = /^\d+$/;
    return regex.test(str);
}

/////////////////// FUNCTIONS ///////////////////
function userFlyStateExist(chatId, userId){
    if(!userFlyInfo[chatId]){
        userFlyInfo[chatId] = new FlyInfo(chatId, userId);
        console.log('New user state created');
    }
    else{
        userFlyInfo[chatId].Clear();
        console.log('User state reset');
    }
}


function createInlineKeyboard(userId) {

    const user = users.find(user => user.id === userId);
    const airplanes = user ? user.airplanes : [];
    const options = airplanes.map(airplane => {
        return {
            text: airplane,
            callback_data: `${airplane}`,
        };
    });

    return options.map(option => [
        { text: option.text, callback_data: option.callback_data },
    ]);
}

