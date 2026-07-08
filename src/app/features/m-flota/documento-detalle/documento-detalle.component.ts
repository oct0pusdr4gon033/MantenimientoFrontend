import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ExpedienteService } from '../services/Expediente.service';
import { ExpedienteDocumentoResponse } from '../models/ExpedienteDocumentoResponse';

@Component({
  standalone: true,
  selector: 'app-documento-detalle',
  imports: [CommonModule],
  templateUrl: './documento-detalle.component.html',
  styleUrl: './documento-detalle.component.css'
})
export class DocumentoDetalleComponent implements OnInit {

  idEquipo: number = 0;
  idDocumento: number = 0;

  documento = signal<ExpedienteDocumentoResponse | null>(null);
  cargando = signal(true);
  errorMsg = signal('');

  /** URL segura para el iframe */
  pdfUrl = signal<SafeResourceUrl | null>(null);
  pdfCargando = signal(true);
  pdfError = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private expedienteSvc: ExpedienteService
  ) { }

  ngOnInit(): void {
    const idEq  = this.route.snapshot.paramMap.get('idEquipo');
    const idDoc = this.route.snapshot.paramMap.get('idDocumento');

    if (!idEq || !idDoc || isNaN(+idEq) || isNaN(+idDoc)) {
      this.errorMsg.set('Parámetros de ruta no válidos.');
      this.cargando.set(false);
      return;
    }

    this.idEquipo   = +idEq;
    this.idDocumento = +idDoc;
    this.cargarDocumento();
  }

  cargarDocumento(): void {
    this.cargando.set(true);
    this.expedienteSvc.obtenerDocumento(this.idDocumento).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.documento.set(res.data);
          if (res.data.documentoUrl) {
            const safe = this.sanitizer.bypassSecurityTrustResourceUrl(res.data.documentoUrl);
            this.pdfUrl.set(safe);
          }
        } else {
          this.errorMsg.set(res.message || 'No se encontró el documento.');
        }
        this.cargando.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al conectar con el servidor.');
        this.cargando.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/GestionFlota/expediente', this.idEquipo]);
  }

  onPdfLoad(): void {
    this.pdfCargando.set(false);
    this.pdfError.set(false);
  }

  onPdfError(): void {
    this.pdfCargando.set(false);
    this.pdfError.set(true);
  }

  abrirEnNuevaVentana(): void {
    const doc = this.documento();
    if (doc?.documentoUrl) {
      window.open(doc.documentoUrl, '_blank');
    }
  }

  badgeVencido(doc: ExpedienteDocumentoResponse): string {
    const hoy = new Date();
    const venc = new Date(doc.fechaVencimiento);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return 'badge-vencido';
    if (diff <= 30) return 'badge-por-vencer';
    return 'badge-vigente';
  }

  textoVencimiento(doc: ExpedienteDocumentoResponse): string {
    const hoy = new Date();
    const venc = new Date(doc.fechaVencimiento);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return 'Vencido';
    if (diff === 0) return 'Vence hoy';
    if (diff <= 30) return `Vence en ${diff} día(s)`;
    return 'Vigente';
  }
}
