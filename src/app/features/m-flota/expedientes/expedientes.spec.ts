import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Expedientes } from './expedientes';

describe('Expedientes', () => {
  let component: Expedientes;
  let fixture: ComponentFixture<Expedientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Expedientes],
    }).compileComponents();

    fixture = TestBed.createComponent(Expedientes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
