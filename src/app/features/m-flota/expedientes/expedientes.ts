import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExpedienteService } from '../services/Expediente.service';
import { ExpedienteResponse } from '../models/ExpedienteResponse';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-expedientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expedientes.html',
  styleUrls: ['./expedientes.css'],
})
export class Expedientes implements OnInit {
  private expedienteService = inject(ExpedienteService);
  private router = inject(Router);

  expedientes = signal<ExpedienteResponse[]>([]);
  cargando = signal<boolean>(true);
  filtroCodigo = signal<string>('');

  ngOnInit(): void {
    this.cargarExpedientes();
  }

  cargarExpedientes() {
    this.cargando.set(true);
    this.expedienteService.listar().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.expedientes.set(res.data);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando expedientes', err);
        this.cargando.set(false);
      }
    });
  }

  get expedientesFiltrados() {
    const filtro = this.filtroCodigo().toLowerCase();
    if (!filtro) return this.expedientes();
    return this.expedientes().filter(e => e.codigoExp?.toLowerCase().includes(filtro));
  }

  verDetalles(idEquipo: number) {
    this.router.navigate(['/GestionFlota/expediente', idEquipo]);
  }
}
