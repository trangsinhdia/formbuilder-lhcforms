import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LfbControlWidgetComponent } from './lfb-control-widget.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';

describe('LfbControlWidgetComponent', () => {
  let component: LfbControlWidgetComponent;
  let fixture: ComponentFixture<LfbControlWidgetComponent>;

  CommonTestingModule.setUpTestBed(LfbControlWidgetComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(LfbControlWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
