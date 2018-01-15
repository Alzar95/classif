
import { Component, Injector, Input } from '@angular/core';
import { DepartmentsCardEditComponent } from './departments-card-edit.component';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'eos-departments-card-edit-person',
    templateUrl: 'departments-card-edit-person.component.html',
})
export class DepartmentsCardEditPersonComponent extends DepartmentsCardEditComponent {
    @Input('form') form: FormGroup;
    @Input('inputs') inputs: any;
    fieldGroups: string[];
    currTab = 0;

    constructor(injector: Injector) {
        super(injector);

        this.fieldGroups = ['Основные данные', 'Контактная информация', 'Дополнительные сведения'];
        this.currTab = this.dictSrv.currentTab;
    }

    /**
     * switch tabs
     * @param i tab number
     */
    setTab(i: number) {
        this.currTab = i;
        this.dictSrv.currentTab = this.currTab;
    }
}
