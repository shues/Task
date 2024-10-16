const state = {
    schema: {},
    data: {
        age_range_description: {
            items: [],
            changed: false,
            el: "age_range_description"
        },
        size_system: {
            items: [],
            changed: false,
            el: "size_system"
        },
        size_class: {
            items: [],
            changed: false,
            el: "size_class"
        },
        size: {
            items: [],
            changed: false,
            el: "size"
        },
        size_to: {
            items: [],
            changed: false,
            el: "size_to"
        },
        body_type: {
            items: [],
            changed: false,
            el: "body_type"
        },
        height_type: {
            items: [],
            changed: false,
            el: "height_type"
        }
    }
}

function init() {
    parseSchema();
    drawChanges();
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
 * Функция переносит необходимые данные из схемы во внутреннее состояние приложения
 */
function parseSchema() {
    let enums = state.schema.properties.age_range_description.items.properties.value.anyOf[1];
    state.data.age_range_description.items = makeObj(enums.enum, enums.enumNames);
    state.data.age_range_description.changed = true;

    const sizeProp = state.schema.properties.apparel_size.items.properties;

    enums = sizeProp.size_system;
    state.data.size_system.items = makeObj(enums.enum, enums.enumNames);
    state.data.size_system.changed = true;

    enums = sizeProp.size_class;
    state.data.size_class.items = makeObj(enums.enum, enums.enumNames);
    state.data.size_class.changed = true;

    enums = sizeProp.size;
    state.data.size.items = makeObj(enums.enum, enums.enumNames);
    state.data.size.changed = true;

    enums = sizeProp.size_to;
    state.data.size_to.items = makeObj(enums.enum, enums.enumNames);
    state.data.size_to.changed = true;
    
    enums = sizeProp.body_type;
    state.data.body_type.items = makeObj(enums.enum, enums.enumNames);
    state.data.body_type.changed = true;

    enums = sizeProp.height_type;
    state.data.height_type.items = makeObj(enums.enum, enums.enumNames);
    state.data.height_type.changed = true;
}


/**
 * Функция отрисовывает те поля в которых произошли изменения
 */
function drawChanges() {
    Object.keys(state.data).forEach(key => {
        const item = state.data[key];
        if (item.changed) {
            item.changed = false;
            const el = document.querySelector('#' + item.el);
            if (el !== null) {
                Object.keys(item.items).forEach(option_value => {
                    const element = document.createElement("option");
                    element.setAttribute("value", option_value);
                    element.textContent = item.items[option_value];
                    el.appendChild(element);
                })
            }
        }
    })
}

/**
 * Функция преобразует массивы с именами и идентификаторами перечислений в объект
 * @param {*} arrId 
 * @param {*} arrVal 
 * @returns 
 */
function makeObj(arrId, arrVal) {
    return arrId.reduce((obj, item, i) => {
        obj[item] = arrVal[i];
        return obj;
    }, {});

}


loadSchema("schema", init);

