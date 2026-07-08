import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  contrasena: string = '';
  mostrarContrasena: boolean = false;
  cargando: boolean = false;
  errorMensaje: string = '';

  constructor(private authService: AuthService) {}

  toggleContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  ingresar(): void {
    this.errorMensaje = '';

    if (!this.email.trim() || !this.contrasena.trim()) {
      this.errorMensaje = 'Por favor ingrese correo electrónico y contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.login(this.email.trim(), this.contrasena).subscribe({
      next: (exito) => {
        this.cargando = false;
        if (!exito) {
          this.errorMensaje = 'Credenciales incorrectas.';
        }
      },
      error: (err) => {
        this.cargando = false;
        if (err.status === 401 || err.status === 400) {
          this.errorMensaje = 'Correo electrónico o contraseña incorrectos.';
        } else if (err.status === 0) {
          this.errorMensaje = 'No se puede conectar al servidor. Verifique su conexión.';
        } else {
          this.errorMensaje = 'Error inesperado. Intente nuevamente.';
        }
      }
    });
  }
}
