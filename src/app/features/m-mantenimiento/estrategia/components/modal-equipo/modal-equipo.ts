import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipoService } from '../../../../m-flota/services/Equipo.service';
import { EquipoResponse } from '../../../../m-flota/models/EquipoResponse';

@Component({
  selector: 'app-modal-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-equipo.html',
  styleUrls: ['./modal-equipo.css']
})
export class ModalEquipo implements OnInit {
  @Output() onSelect = new EventEmitter<EquipoResponse>();
  @Output() onClose = new EventEmitter<void>();

  equipos: EquipoResponse[] = [];
  searchTerm: string = '';

  private equipoService = inject(EquipoService);

  ngOnInit() {
    this.equipoService.listar().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.equipos = response.data;
        }
      }
    });
  }

  filteredEquipos() {
    return this.equipos.filter(e => 
      e.codEqp?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      e.placaEqp?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      e.numSerie?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  select(equipo: EquipoResponse) {
    this.onSelect.emit(equipo);
  }

  close() {
    this.onClose.emit();
  }
}
