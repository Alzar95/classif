import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IFieldView, E_FIELD_TYPE } from '../interfaces';
import { HintConfiguration } from '../long-title-hint/hint-configuration.interface';
import { EosDictionaryNode } from '../core/eos-dictionary-node';

@Component({
    selector: 'eos-node-field',
    templateUrl: 'node-field.component.html'
})
export class NodeFieldComponent {
    @Input() field: IFieldView;
    @Input() node: EosDictionaryNode;
    @Input() width: number;
    @Input() dualTable: boolean;
    @Input() margin: number;
    @Input() custom: boolean;
    @Input() index: number;
    @Input() selected: boolean;
    @Input() marginTop: number;
    @Output() view: EventEmitter<any> = new EventEmitter<any>();
    @Output() fieldHover: EventEmitter<HintConfiguration> = new EventEmitter<HintConfiguration>();

    types = E_FIELD_TYPE;

    showHint(el: HTMLElement) {
        const span = document.createElement('span'),
            body = document.getElementsByTagName('body');
        span.style.position = 'absolute';
        span.style.top = '-5000px';
        span.style.left = '-5000px';
        span.style.padding = '20px';
        span.innerText = el.innerText;
        body[0].appendChild(span);
        if (span.clientWidth > el.clientWidth) {
            const top = el.offsetParent ? el.offsetTop - el.offsetParent.scrollTop : el.offsetTop - this.marginTop;
            this.fieldHover.emit({
                top: top,
                left: el.offsetLeft,
                text: el.innerText,
                show: true,
                node: this.node
            });
        } else {
            this.fieldHover.emit({
                show: false,
                node: this.node
            });
        }
        body[0].removeChild(span);
    }

    viewNode(evt: Event) {
        this.view.emit(evt);
    }

    getMargin() {
        if (this.dualTable && this.custom && this.index === 0) {
            return this.margin;
        } else if (this.dualTable && !this.custom) {
            return this.margin;
        } else {
            return 0;
        }
    }
}
