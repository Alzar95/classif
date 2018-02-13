import { IDictionaryDescriptor } from 'eos-dictionaries/interfaces';
import { LINEAR_TEMPLATE } from './_linear-template';
import { NOT_EMPTY_STRING } from 'eos-dictionaries/consts/input-validation';

export const SECURITY_DICT: IDictionaryDescriptor = Object.assign({}, LINEAR_TEMPLATE, {
    id: 'security',
    apiInstance: 'SECURITY_CL',
    keyField: 'SECURLEVEL',
    title: 'Грифы доступа',
    visible: true,
    actions: LINEAR_TEMPLATE.actions.concat(['tableCustomization']),
    fields: LINEAR_TEMPLATE.fields.concat([{
        key: 'SECURLEVEL',
        type: 'number',
        title: 'Гриф доступа',
        length: 10,
        pattern: NOT_EMPTY_STRING,
    }, {
        key: 'GRIF_NAME',
        type: 'string',
        title: 'Наименование грифа',
        length: 64,
        pattern: NOT_EMPTY_STRING,
        required: true,
        isUnic: true,
        unicInDict: true,
    }, {
        key: 'EDS_FLAG',
        type: 'boolean',
        title: 'Требуется ЭП',
        length: 20,
        pattern: NOT_EMPTY_STRING,
    }, {
        key: 'ENCRYPT_FLAG',
        type: 'boolean',
        title: 'Требуется шифрование',
        length: 20,
        pattern: NOT_EMPTY_STRING,
    }, {
        key: 'SEC_INDEX',
        type: 'string',
        title: 'Индекс грифа',
        length: 24,
        pattern: NOT_EMPTY_STRING,
    }, {
        key: 'CONFIDENTIONAL',
        type: 'boolean',
        title: 'Конфиденциальность',
        length: 20,
        pattern: NOT_EMPTY_STRING,
    }, {
        key: 'NOTE',
        type: 'text',
        title: 'Примечание',
        length: 255,
        pattern: NOT_EMPTY_STRING,
    }]),
    treeFields: ['GRIF_NAME'],
    allVisibleFields: ['EDS_FLAG', 'ENCRYPT_FLAG', 'SEC_INDEX', 'NOTE'],
    listFields: ['GRIF_NAME'],
    editFields: ['SEC_INDEX', 'GRIF_NAME', 'EDS_FLAG', 'ENCRYPT_FLAG', 'NOTE'],
    shortQuickViewFields: ['GRIF_NAME'],
    quickViewFields: ['SEC_INDEX', 'EDS_FLAG', 'ENCRYPT_FLAG', 'NOTE'],
});