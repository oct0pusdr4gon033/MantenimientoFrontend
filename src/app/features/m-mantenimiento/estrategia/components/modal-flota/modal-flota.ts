import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlotaService } from '../../../../m-flota/services/Flota.service';
import { FlotaResponse } from '../../../../m-flota/models/FlotaResponse';

@Component({
  selector: 'app-modal-flota',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-flota.html',
  styleUrls: ['./modal-flota.css']
})
export class ModalFlota implements OnInit {
  @Output() onSelect = new EventEmitter<FlotaResponse>();
  @Output() onClose = new EventEmitter<void>();

  flotas: FlotaResponse[] = [];
  searchTerm: string = '';

  private flotaService = inject(FlotaService);

  ngOnInit() {
    this.flotaService.listar().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.flotas = response.data;
        }
      }
    });
  }

  filteredFlotas() {
    return this.flotas.filter(f => 
      f.codFlota?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      f.nombreFlota?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      f.tipoControl?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  select(flota: FlotaResponse) {
    this.onSelect.emit(flota);
  }

  close() {
    this.onClose.emit();
  }
}
