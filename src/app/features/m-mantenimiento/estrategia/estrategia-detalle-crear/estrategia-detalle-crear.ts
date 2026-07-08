import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstrategiaService } from '../../services/estrategia.service';
import { EstrategiaRequest } from '../../models/EstrategiaRequest';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-estrategia-detalle-crear',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './estrategia-detalle-crear.html',
  styleUrls: ['./estrategia-detalle-crear.css']
})
export class EstrategiaDetalleCrear implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private estrategiaService = inject(EstrategiaService);

  draftEstrategia: EstrategiaRequest | null = null;
  detallesForm: FormGroup;

  constructor() {
    // Get state passed from previous route
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { draftEstrategia: EstrategiaRequest };
    if (state && state.draftEstrategia) {
      this.draftEstrategia = state.draftEstrategia;
    }

    this.detallesForm = this.fb.group({
      detalles: this.fb.array([])
    });
  }

  ngOnInit() {
    if (!this.draftEstrategia) {
      // If refreshed or no draft, go back
      this.router.navigate(['/GestionMantenimiento/estrategia/crear']);
      return;
    }
    // Add an initial empty detail row
    this.addDetalle();
  }

  get detallesArray() {
    return this.detallesForm.get('detalles') as FormArray;
  }

  createDetalleFormGroup(): FormGroup {
    const group = this.fb.group({
      tipo_pm: ['', Validators.required],
      nombre_medida: ['Horometros', Validators.required],
      uni_med: ['H', Validators.required],
      umbral_mant: [0, [Validators.required, Validators.min(0)]],
      tolerancia_inf: [0, [Validators.required, Validators.min(0)]],
      tolerancia_sup: [0, [Validators.required, Validators.min(0)]],
      porcentaje_tol: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    const umbralCtrl = group.get('umbral_mant');
    const porcCtrl = group.get('porcentaje_tol');
    const infCtrl = group.get('tolerancia_inf');
    const supCtrl = group.get('tolerancia_sup');
    const medidaCtrl = group.get('nombre_medida');
    const uniCtrl = group.get('uni_med');

    // Auto-fill unit based on measurement
    medidaCtrl?.valueChanges.subscribe(medida => {
      let uni = 'H';
      if (medida === 'Dias') uni = 'D';
      else if (medida === 'Meses') uni = 'M';
      else if (medida === 'Semanas') uni = 'S';
      else if (medida === 'Kilometros') uni = 'KM';
      uniCtrl?.setValue(uni, { emitEvent: false });
    });

    // Calculate tolerances when percentage changes
    porcCtrl?.valueChanges.subscribe(porc => {
      const umbral = umbralCtrl?.value || 0;
      const offset = (umbral * (porc || 0)) / 100;
      infCtrl?.setValue(umbral - offset, { emitEvent: false });
      supCtrl?.setValue(umbral + offset, { emitEvent: false });
    });

    // Calculate tolerances when umbral changes
    umbralCtrl?.valueChanges.subscribe(umbral => {
      const porc = porcCtrl?.value || 0;
      const offset = ((umbral || 0) * porc) / 100;
      infCtrl?.setValue((umbral || 0) - offset, { emitEvent: false });
      supCtrl?.setValue((umbral || 0) + offset, { emitEvent: false });
    });

    return group;
  }

  addDetalle() {
    this.detallesArray.push(this.createDetalleFormGroup());
  }

  removeDetalle(index: number) {
    this.detallesArray.removeAt(index);
  }

  regresar() {
    // We could pass state back if needed, but going back simple for now
    this.router.navigate(['/GestionMantenimiento/estrategia/crear']);
  }

  guardarEstrategia() {
    if (this.detallesForm.invalid || !this.draftEstrategia) {
      Swal.fire('Atención', 'Complete correctamente todos los campos obligatorios.', 'warning');
      return;
    }

    // Attach details to draft
    this.draftEstrategia.detalles = this.detallesArray.value;

    this.estrategiaService.crear(this.draftEstrategia).subscribe({
      next: (res) => {
        // Assume success if no error thrown, typical for non-wrapped responses
        // or check res if using ApiResponse
        Swal.fire({
          title: '¡Éxito!',
          text: 'Estrategia y detalles registrados correctamente',
          icon: 'success',
          confirmButtonColor: '#e86b1a'
        }).then(() => {
          this.router.navigate(['/GestionMantenimiento/estrategia']);
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Ocurrió un error al registrar la estrategia.', 'error');
      }
    });
  }
}
