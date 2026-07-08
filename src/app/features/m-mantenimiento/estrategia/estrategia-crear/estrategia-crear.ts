import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstrategiaRequest } from '../../models/EstrategiaRequest';
import { ModalFlota } from '../components/modal-flota/modal-flota';
import { ModalEquipo } from '../components/modal-equipo/modal-equipo';
import { FlotaResponse } from '../../../m-flota/models/FlotaResponse';
import { EquipoResponse } from '../../../m-flota/models/EquipoResponse';

@Component({
  selector: 'app-estrategia-crear',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalFlota, ModalEquipo],
  templateUrl: './estrategia-crear.html',
  styleUrls: ['./estrategia-crear.css']
})
export class EstrategiaCrear {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  showModalFlota = false;
  showModalEquipo = false;

  flotaSeleccionada: FlotaResponse | null = null;
  equipoSeleccionado: EquipoResponse | null = null;

  estrategiaForm: FormGroup = this.fb.group({
    cod_estrategia: ['', Validators.required],
    titulo_estrategia: ['', Validators.required],
    estado: ['ACTIVO', Validators.required],
    tipoAsignacion: ['flota', Validators.required]
  });

  isFormValid(): boolean {
    if (this.estrategiaForm.invalid) return false;
    const tipo = this.estrategiaForm.value.tipoAsignacion;
    if (tipo === 'flota' && !this.flotaSeleccionada) return false;
    if (tipo === 'equipo' && !this.equipoSeleccionado) return false;
    return true;
  }

  onFlotaSelected(flota: FlotaResponse) {
    this.flotaSeleccionada = flota;
    this.showModalFlota = false;
  }

  onEquipoSelected(equipo: EquipoResponse) {
    this.equipoSeleccionado = equipo;
    this.showModalEquipo = false;
  }

  siguiente() {
    if (this.isFormValid()) {
      const formValue = this.estrategiaForm.value;
      const draft: EstrategiaRequest = {
        cod_estrategia: formValue.cod_estrategia,
        titulo_estrategia: formValue.titulo_estrategia,
        estado: formValue.estado,
        id_flota: formValue.tipoAsignacion === 'flota' ? this.flotaSeleccionada?.idFlota : null,
        id_equipo: formValue.tipoAsignacion === 'equipo' ? this.equipoSeleccionado?.idEquipo : null,
        detalles: []
      };

      // Navigate to the details screen, passing the draft data via state
      this.router.navigate(['/GestionMantenimiento/estrategia/0/detalle/crear'], { state: { draftEstrategia: draft } });
    }
  }
}
