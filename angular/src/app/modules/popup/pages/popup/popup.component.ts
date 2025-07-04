// @ts-nocheck
import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { bindCallback } from 'rxjs';
import { map } from 'rxjs/operators';
import { TAB_ID } from '../../../../providers/tab-id.provider';

@Component({
  selector: 'app-popup',
  templateUrl: 'popup.component.html',
  styleUrls: ['popup.component.scss']
})
export class PopupComponent {

  constructor(@Inject(TAB_ID) readonly tabId: number) { }


}
