import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoEquipo } from './tipo-equipo';

describe('TipoEquipo', () => {
  let component: TipoEquipo;
  let fixture: ComponentFixture<TipoEquipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoEquipo],
    }).compileComponents();

    fixture = TestBed.createComponent(TipoEquipo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
