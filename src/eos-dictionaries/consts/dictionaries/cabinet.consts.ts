import { IDictionaryDescriptor } from 'eos-dictionaries/interfaces';
import { LINEAR_TEMPLATE } from './_linear-template';
import { environment } from 'environments/environment';

export const CABINET_DICT: IDictionaryDescriptor = Object.assign({}, LINEAR_TEMPLATE, {
    id: 'cabinet',
    apiInstance: 'CABINET',
    title: 'Кабинеты',
    keyField: 'ISN_CABINET',
    visible: !environment.production,
    actions: ['add', 'markRecords', 'quickSearch', 'fullSearch', 'order', 'userOrder',
        'moveUp', 'moveDown', 'navigateUp', 'navigateDown', 'showDeleted', 'removeHard', 'tableCustomization'],
    fields: [{
        key: 'ISN_CABINET',
        type: 'number',
        title: 'ISN кабинета',
        pattern: /^\d*$/,
        length: 10,
        invalidMessage: 'Максимальная длинна 10 символов. Только числовые значения. Пробелы запрещены.',
    }, {
        key: 'DUE',
        type: 'string',
        title: 'Код подразделения',
        length: 248,
    }, {
        key: 'CABINET_NAME',
        type: 'string',
        title: 'Имя кабинета',
        length: 64,
    }, {
        key: 'FULLNAME',
        type: 'text',
        title: 'Полное наименование',
        length: 2000,
    }, {
        key: 'DEPARTMENT_NAME',
        title: 'Подразделение',
        type: 'text',
        length: 255
    }, {
        key: 'department',
        type: 'dictionary',
        title: 'Подразделение'
    }, {
        key: 'users',
        type: 'dictionary',
        title: 'Пользователи кабинета'
    }, {
        key: 'folders',
        type: 'dictionary',
        title: 'Папки кабинета'
    }, {
        key: 'owners',
        type: 'dictionary',
        title: 'Владельцы кабинета'
    }, {
        key: 'cabinetAccess',
        type: 'dictionary',
        title: 'Доступ пользователей'
    }],
    treeFields: ['CABINET_NAME'],
    listFields: ['CABINET_NAME', 'DEPARTMENT_NAME'],
    allVisibleFields: ['FULLNAME'],
    shortQuickViewFields: ['CABINET_NAME', 'FULLNAME'],
    quickViewFields: ['CABINET_NAME', 'DEPARTMENT_NAME', 'department'],
    editFields: ['CABINET_NAME', 'FULLNAME', 'department', 'users', 'owners', 'folders', 'cabinetAccess'],
});

export const CABINET_FOLDERS = [{
    key: 1,
    title: 'Поступившие'
}, {
    key: 2,
    title: 'На исполнении'
}, {
    key: 3,
    title: 'На контроле'
}, {
    key: 4,
    title: 'У руководства'
}, {
    key: 5,
    title: 'На рассмотрении'
}, {
    key: 6,
    title: 'В дело'
}, {
    key: 7,
    title: 'Управление проектам'
}, {
    key: 8,
    title: 'На визировании'
}, {
    key: 9,
    title: 'На подписи'
}];
