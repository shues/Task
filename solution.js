/**
 * Состояние приложения
 * shema - хранит загруженную схему
 * data - хранит объект данных для формы
 * action - Хранит объект даннх о событии выбора в селекторе
 * mode - режим работы приложения (не используется)
 */
const state = {
    schema: {},
    data: {},
    action: {
        property: "",
        subproperty: "",
        value: "",
        stage: "",
        stack: []
    },
    mode: "init",
}

/**
 * Инициализация приложения 
 * первоначальное заполнение полей
 * установка слушателей событий
 */
function init() {
    getPropertiesData(state.schema.properties);
    drawChanges();
    setListeners();
}

/**
 * Функция загружает схему из файла json а затем, если все прошло удачно,
 * вызывает функцию для обработки полученного значения
 * @param {*} name Имя нужной нам схемы
 * @param {*} callback Функция которая будет парсить схему
 */
function loadSchema(name, callback) {
    fetch(document.location.origin + '/' + name + '.json')
        .then(res => res.json())
        .then(res => state.schema = res)
        .then(() => callback())
        .catch(err => console.log("Ошибка загрузки схемы: " + err))
        .finally(() => console.log("load finished"))
}


/**
 * Получить данные для свойств и поместить их в объект данных формы
 * @param {*} properties набор свойств для которых нужно получить данные
 */
function getPropertiesData(properties) {
    Object.keys(properties).forEach(property => {
        state.data[property] = parsePropertyData(properties[property])
    })
}

/**
 * Реализует выбор данных из раздела properties схемы
 * @param {*} property 
 * @returns 
 */
function parsePropertyData(property) {
    let res = {};
    Object.keys(property).forEach(key => {
        const data = property[key];

        switch (key) {
            case "items":
                res = getItems(data);
                break;
            case "properties":
                res = getProperties(data);
                break;
            case "anyOf":
                res = getAnyOf(data);
                break;
            case "enum":
                res.enum = getEnum(data);
                break;
            case "enumNames":
                res.enumNames = getEnumNames(data);
                break;
            default:
                break;
        }
    })
    if (res.enum !== undefined && res.enumNames !== undefined) {
        res = makeMass(res.enum, res.enumNames);
    }
    return res;
}

/**
 * Возвращает данные из инструкции items
 * @param {*} items 
 * @returns 
 */
function getItems(items) {
    return parsePropertyData(items);
}

/**
 * Создает объект свойства для объекта данных формы
 * @param {*} properties 
 * @returns 
 */
function getProperties(properties) {
    const res = {};
    Object.keys(properties).forEach(property => {
        res[property] = {};
        res[property].changed = true;
        const _items = parsePropertyData(properties[property]);
        res[property].items = Array.isArray(_items) ? [{ id: 0, name: "Select value", show: true }, ..._items] : _items;
        res[property].current = 0;
    });
    return res;
}

/**
 * Вернуть результат обработки массива объектов в инструкции anyOf
 * @param {*} anyOf 
 * @returns 
 */
function getAnyOf(anyOf) {
    const res = anyOf.map(item => parsePropertyData(item))
        .filter(item => Object.keys(item).length > 0);
    if (res.length > 0) {
        return res[0];
    }
    return {};
}

/**
 * вернуть массив идентификаторов
 * @param {*} _enum 
 * @returns 
 */
function getEnum(_enum) {
    return _enum;
}

/**
 * вернуть массив имен
 * @param {*} _enum 
 * @returns 
 */
function getEnumNames(_enum) {
    return _enum;
}


/**
 * Функция отрисовывает те поля в которых произошли изменения
 */
function drawChanges() {
    Object.keys(state.data).forEach(key => {
        const property = state.data[key];
        Object.keys(property).forEach(subprop => {
            const subproperty = property[subprop];
            if (subproperty.changed) {
                subproperty.changed = false;
                const elmass = document.getElementsByName(key + ' ' + subprop);
                if (elmass.length === 0) {
                    return;
                }
                const el = elmass[0];
                if (el !== null) {
                    removeAllChildren(el);

                    subproperty.items.forEach(option_value => {
                        if (option_value.show) {
                            const element = document.createElement("option");
                            element.setAttribute("value", option_value.id);
                            element.textContent = option_value.name;
                            el.appendChild(element);
                        }
                    });
                    const current = subproperty.items.filter(item => item.id === subproperty.current)[0];

                    el.value = current.show ? subproperty.current : 0;
                }
            }
        });
    });
}

/**
 * служебная функция для удаления всех дочерних элементов
 * @param {*} parent элемент для которого удаляем потомков
 */
function removeAllChildren(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

/**
 * Сборка массива объектов для элементов свойств объекта данных формы 
 * из массивов идентификаторов и имен
 * @param {*} arrId массив идентификаторов
 * @param {*} arrVal массив имен
 * @returns 
 */
function makeMass(arrId, arrVal) {
    return arrId.reduce((mass, item, i) => {
        const obj = {};
        obj.id = item;
        obj.name = arrVal[i];
        obj.show = true;
        mass.push(obj);
        return mass;
    }, []);
}

/**
 * Установка слушателей на объекты формы
 */
function setListeners() {
    document.querySelector('form').addEventListener('change', formChangedAction);
}

/**
 * Обработка события выбора значения в селекторе на форме
 * @param {*} e - объект события
 */
function formChangedAction(e) {
    [state.action.property, state.action.subproperty] = e.target.getAttribute('name').split(' ');
    state.action.value = e.target.value;
    state.action.stage = "findRool";

    setCurrentItem();
    scanRools();
}

/**
 * Устанавливает текущее значение в 
 * объекте данных после его выбора в селекторе
 */
function setCurrentItem() {
    const el = state.data[state.action.property][state.action.subproperty];
    el.current = state.action.value;
}


/**
 * Запускает правила на анализ
 */
function scanRools() {
    const rools = state.schema.allOf;
    let roolCounter = 0;
    rools.forEach(rool => {
        roolCounter++;

        let res = dispatchRool(rool);
        if (res === null) {
            return;
        }
    });
}


/**
 * диспетчер анализа правил
 * разбирает правило на части и 
 * отправляет каждую часть на обработку
 * @param {*} rool 
 * @returns 
 */
function dispatchRool(rool) {
    const instructions = Object.keys(rool);

    if (instructions.length === 0) {
        return null;
    }

    let res = {}
    instructions.forEach((instruction) => {
        let currInstruction = rool[instruction];

        switch (instruction) {
            case 'if':
                res.if = if_processing(currInstruction);
                break;
            case 'then':
                if (res.if) {
                    res.then = processing(currInstruction);
                }
                break;
            case 'else':
                if (!res.if) {
                    res.else = processing(currInstruction);
                }
                break;
            case "required":
                res.required = required_processing(currInstruction);
                break;
            case "properties":
                res.properties = properties_processing(currInstruction);
                break;
            case "contains":
                res.contains = contains_processing(currInstruction);
                break;
            case "enum":
                res.enum = enum_processing(currInstruction);
                break;
            case "items":
                res.items = items_processing(currInstruction);
                break;
            case "allOf":
                res.allOf = allOf_processing(currInstruction);
                break;
            case "not":
                res.not = not_processing(currInstruction);
                break;
            default:
                break;
        }
    });
    return res;
}

 /**
  * реализация обработки инструкции if
  * @param {*} condition 
  * @returns 
  */
function if_processing(condition) {
    const res = and_processing(dispatchRool(condition));
    return res;
}

/**
 * Реализация обработки инструкции required
 * определяем, присутствует ли значение в объекте данных формы
 * @param {*} required содержимое инструкции
 * @returns результат true || false
 */
function required_processing(required) {
    let res = true;


    let currProperty = state.data;
    state.action.stack.forEach(prop => {
        currProperty = currProperty[prop];
    })

    if (currProperty === undefined) {
        return false;
    }

    required.forEach(prop => {
        if (currProperty[prop] === undefined) {
            res = false;
        }
    })
    return res;
}

/**
 * Реализация обработки инстукции properties
 * @param {*} properties содержимое инструкции
 * @returns результат true || false
 */
function properties_processing(properties) {

    const res = {};

    Object.keys(properties).forEach(property => {


        state.action.stack.push(property); // помещаем property в стек

        res[property] = and_processing(dispatchRool(properties[property]));


        state.action.stack.pop(); // Удаляем property из стека
    })

    return and_processing(res);
}

/**
 * Реализация обработки инструкции contains
 * @param {*} contains содержимое инструкции
 * @returns результат true || false
 */
function contains_processing(contains) {
    const res = dispatchRool(contains);
    if (typeof (res) === "object") {
        return and_processing(res);
    }
    return res;
}

/**
 * Обработка списка значений
 * проверка входит ли в него значение 
 * нужного нам свойства
 * @param {*} _enum список значений
 * @returns результат true или false
 */
function enum_processing(_enum) {
    let value = state.data;
    for (let i = 0; i < state.action.stack.length; i++) {
        let item = state.action.stack[i];
        value = value[item];
        if (value === undefined) {
            return false;
        }
    }

    if (_enum.indexOf(value.current) !== -1) {
        return true;
    }
    return false;
}

/**
 * Реализация обработки инструкции item
 * @param {*} items - содержимое инструкции
 * @returns результат обработки (true или false)
 */
function items_processing(items) {
    const res = and_processing(dispatchRool(items))
    return res;
}

/**
 * Анализ набора правил с последующим сворачиванием результатов 
 * при помощи операции AND
 * @param {*} rools 
 * @returns boolean
 */
function allOf_processing(rools) {
    return rools
        .map(rool => dispatchRool(rool))
        .reduce((def, res) => {
            if (typeof (res) === "object") {
                return and_processing(res) && def;
            }

            return res && def
        }, true);
}

/**
 * Обработка инструкции not
 * результат с отрицанием
 * @param {*} condition 
 * @returns 
 */
function not_processing(condition) {
    const res = dispatchRool(condition);
    return !res;
}

/**
 * Служебная функция,
 * реализует операцию AND над переданным объектом
 * @param {*} obj объект свойства которого будут анализироваться
 * @returns результат операции AND
 */
function and_processing(obj) {
    let res = true;
    Object.keys(obj).forEach(key => {
        if (typeof (obj[key]) !== 'object') {
            res = res && obj[key];
        }
    });

    return res;
}

/**
 * Получение и обработка данных для
 * изменений которые нужно внести в объект данных формы 
 * @param {*} condition 
 * @returns 
 */
function processing(condition) {
    if (condition.properties !== undefined) {
        
        updateState(condition.properties);
        drawChanges();
        return true;
    } else {
        const res = dispatchRool(condition);
        return res;
    }
}

/**
 * Обновляет объект данных фомы в соответствии с правилами
 * @param {*} props - объект набора свойств которые нужно изменить в форме
 */
function updateState(props) {
    Object.keys(props).forEach(prop => {
        const res = parsePropertyData(props[prop]);
        const subprop = Object.keys(res)[0];

        if (subprop !== undefined) {

            state.data[prop][subprop].items.forEach(item => {
                if (item.id !== 0) {
                    if (res[subprop].items.enum.indexOf(item.id) === -1) {
                        item.show = false;
                    } else {
                        item.show = true;
                    }
                }
            });
            state.data[prop][subprop].changed = true;
        }
    })

}

/**
 * Точка входа в приложение
 */
loadSchema("schema", init);

//----------------- устаревшие функции

/**
 * Функция переносит необходимые данные из схемы во внутреннее состояние приложения
 * в данный момент не используется
 */
function parseSchema() {
    let enums = state.schema.properties.age_range_description.items.properties.value.anyOf[1];
    state.data.age_range_description.items = makeMass(enums.enum, enums.enumNames);
    state.data.age_range_description.changed = true;

    const sizeProp = state.schema.properties.apparel_size.items.properties;

    enums = sizeProp.size_system;
    state.data.size_system.items = makeMass(enums.enum, enums.enumNames);
    state.data.size_system.changed = true;

    enums = sizeProp.size_class;
    state.data.size_class.items = makeMass(enums.enum, enums.enumNames);
    state.data.size_class.changed = true;

    enums = sizeProp.size;
    state.data.size.items = makeMass(enums.enum, enums.enumNames);
    state.data.size.changed = true;

    enums = sizeProp.size_to;
    state.data.size_to.items = makeMass(enums.enum, enums.enumNames);
    state.data.size_to.changed = true;

    enums = sizeProp.body_type;
    state.data.body_type.items = makeMass(enums.enum, enums.enumNames);
    state.data.body_type.changed = true;

    enums = sizeProp.height_type;
    state.data.height_type.items = makeMass(enums.enum, enums.enumNames);
    state.data.height_type.changed = true;
}
