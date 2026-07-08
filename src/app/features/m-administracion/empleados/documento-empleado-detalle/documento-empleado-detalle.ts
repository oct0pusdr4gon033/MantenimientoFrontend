import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../../../environments/environment';

import { ExpedienteEmpleadoService } from '../services/expediente-empleado.service';
import { ExpedienteDocumentoEmpleadoResponse } from '../models/ExpedienteEmpleadoModels';

@Component({
  standalone: true,
  selector: 'app-documento-empleado-detalle',
  imports: [CommonModule],
  templateUrl: './documento-empleado-detalle.html',
  styleUrl: './documento-empleado-detalle.css'
})
export class DocumentoEmpleadoDetalleComponent implements OnInit {

  dniEmpleado: string = '';
  codigoExp: string = '';
  idDocumento: number = 0;

  documento = signal<ExpedienteDocumentoEmpleadoResponse | null>(null);
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
    private expedienteSvc: ExpedienteEmpleadoService
  ) { }

  ngOnInit(): void {
    const dni = this.route.snapshot.paramMap.get('dni');
    const codExp = this.route.snapshot.paramMap.get('codigoExp');
    const idDoc = this.route.snapshot.paramMap.get('idDocumento');

    if (!dni || !codExp || !idDoc || isNaN(+idDoc)) {
      this.errorMsg.set('Parámetros de ruta no válidos.');
      this.cargando.set(false);
      return;
    }

    this.dniEmpleado = dni;
    this.codigoExp = codExp;
    this.idDocumento = +idDoc;
    this.cargarDocumento();
  }

  cargarDocumento(): void {
    this.cargando.set(true);
    this.expedienteSvc.obtenerDocumentos(this.codigoExp).subscribe({
      next: (res) => {
        const doc = res.find(d => d.idExpedienteDocumentoEmp === this.idDocumento || (d as any).IdExpedienteDocumentoEmp === this.idDocumento);
        if (doc) {
          this.documento.set(doc);
          if (doc.documentoUrl) {
            const baseUrl = environment.baseUrl.replace('/api', '');
            const urlCompleta = doc.documentoUrl.startsWith('http') ? doc.documentoUrl : `${baseUrl}${doc.documentoUrl}`;
            const safe = this.sanitizer.bypassSecurityTrustResourceUrl(urlCompleta);
            this.pdfUrl.set(safe);
          }
        } else {
          this.errorMsg.set('No se encontró el documento.');
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
    this.router.navigate(['/GestionAdministracion/expediente-empleado/detalle', this.dniEmpleado]);
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
      const baseUrl = environment.baseUrl.replace('/api', '');
      const urlCompleta = doc.documentoUrl.startsWith('http') ? doc.documentoUrl : `${baseUrl}${doc.documentoUrl}`;
      window.open(urlCompleta, '_blank');
    }
  }

  badgeVencido(doc: ExpedienteDocumentoEmpleadoResponse): string {
    if (!doc.fechaVencimiento) return 'badge-vigente';
    const hoy = new Date();
    const venc = new Date(doc.fechaVencimiento);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return 'badge-vencido';
    if (diff <= 30) return 'badge-por-vencer';
    return 'badge-vigente';
  }

  textoVencimiento(doc: ExpedienteDocumentoEmpleadoResponse): string {
    if (!doc.fechaVencimiento) return 'Sin vencimiento';
    const hoy = new Date();
    const venc = new Date(doc.fechaVencimiento);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return 'Vencido';
    if (diff === 0) return 'Vence hoy';
    if (diff <= 30) return `Vence en ${diff} día(s)`;
    return 'Vigente';
  }
}
