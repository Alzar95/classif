import { IDeskItem } from './desk-item.interface';

export class EosDesk {
    id: string;
    name: string;
    references: IDeskItem[];
    edited: boolean;

    constructor(data: any) {
        Object.assign(this, data);
    }
}
