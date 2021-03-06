import { Component, Input } from '@angular/core';

import { EosDeskService } from '../services/eos-desk.service';
import { EosDesk } from '../core/eos-desk';
import { EosMessageService } from '../../eos-common/services/eos-message.service';
import { WARN_LINK_PIN } from '../consts/messages.consts';

@Component({
    selector: 'eos-pushpin',
    templateUrl: 'pushpin.component.html',
})
export class PushpinComponent {
    @Input() infoOpened: boolean;
    hideSystem = true;
    showSelected = false;

    constructor(private _deskSrv: EosDeskService, private _msgSrv: EosMessageService) { }

    /**
     * Add dictionary to desktop
     * @param desk desktop with which add dictionary
     */
    pin(desk: EosDesk) {
        if (!this._deskSrv.appendDeskItemToView(desk)) {
            this._msgSrv.addNewMessage(WARN_LINK_PIN);
        }
    }
}
