import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialHorometros } from './historial-horometros';

describe('HistorialHorometros', () => {
  let component: HistorialHorometros;
  let fixture: ComponentFixture<HistorialHorometros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialHorometros],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialHorometros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
