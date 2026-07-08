import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialDetalle } from './historial-detalle';

describe('HistorialDetalle', () => {
  let component: HistorialDetalle;
  let fixture: ComponentFixture<HistorialDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialDetalle],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
