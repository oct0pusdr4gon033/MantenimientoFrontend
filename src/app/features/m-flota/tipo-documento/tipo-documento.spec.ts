import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoDocumento } from './tipo-documento';

describe('TipoDocumento', () => {
  let component: TipoDocumento;
  let fixture: ComponentFixture<TipoDocumento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoDocumento],
    }).compileComponents();

    fixture = TestBed.createComponent(TipoDocumento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
