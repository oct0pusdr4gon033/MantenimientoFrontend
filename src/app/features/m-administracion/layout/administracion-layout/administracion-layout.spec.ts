import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministracionLayout } from './administracion-layout';

describe('AdministracionLayout', () => {
  let component: AdministracionLayout;
  let fixture: ComponentFixture<AdministracionLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministracionLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministracionLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
