import { Component, Injector } from '@angular/core';
import { BaseParamComponent } from '../shared/base-param.component';
import { AUTH_PARAM } from '../shared/consts/auth-consts';
import { PARM_CANCEL_CHANGE } from '../shared/consts/eos-parameters.const';

@Component({
    selector: 'eos-param-authentication',
    templateUrl: 'param-authentication.component.html'
})
export class ParamAuthenticationComponent extends BaseParamComponent {
    constructor( injector: Injector ) {
        super(injector, AUTH_PARAM);
        this.init()
        .then(() => {
            this.afterInitRC();
        });
    }
    cancel() {
        if (this.isChangeForm) {
            this.msgSrv.addNewMessage(PARM_CANCEL_CHANGE);
            this.isChangeForm = false;
            this.formChanged.emit(false);
            this.ngOnDestroy();
            this.init()
            .then(() => {
                this.afterInitRC();
            });
        }
    }
    afterInitRC() {
        // console.log(this.prepareData);
        this.checkDataToDisabled('CHANGE_PASS', true);
        this.subscriptions.push(
            this.form.controls['rec.CHANGE_PASS'].valueChanges
            .subscribe(newValue => {
                this.checkDataToDisabled('CHANGE_PASS', true);
            })
        );
        this.subscriptions.push(
            this.form.controls['rec.PASS_ALF'].valueChanges
            .subscribe(newValue => {
                if (this.form.controls['rec.PASS_ALF'].enabled) {
                    if (+newValue > 1) {
                        this.form.controls['rec.PASS_CASE'].enable();
                    } else {
                        this.form.controls['rec.PASS_CASE'].patchValue(false);
                        this.form.controls['rec.PASS_CASE'].disable();
                    }
                }
            })
        );
        this.form.controls['rec.PASS_ALF'].updateValueAndValidity();
    }
}
