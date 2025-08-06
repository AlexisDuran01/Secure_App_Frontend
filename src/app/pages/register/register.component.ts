import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { RoleService } from '../../services/role.service';
import { Observable } from 'rxjs';
import { Role } from '../../interfaces/role';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ValidationError } from '../../interfaces/validation-error';

@Component({
  selector: 'app-register',
  imports: [
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    RouterLink,
    ReactiveFormsModule,
    AsyncPipe,
    CommonModule,
    MatSnackBarModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  roleService = inject(RoleService);
  authService = inject(AuthService);
  matSnackBar = inject(MatSnackBar);
  roles$!: Observable<Role[]>;
  fb = inject(FormBuilder);
  router = inject(Router);
  registerForm!: FormGroup;
  confirmPasswordHide: boolean = true;
  passwordHide: boolean = true;
  errors: ValidationError[] = []; // Inicializar como array vacío

  register() {
  // Limpiar errores previos
  this.errors = [];

  if (this.registerForm.valid) {
    // Mapear los datos del formulario al formato que espera el servidor
    const registerData = {
      EmailAddress: this.registerForm.value.email,
      Password: this.registerForm.value.password,
      FullName: this.registerForm.value.fullName,
      Roles: this.registerForm.value.roles
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log(response);

        this.matSnackBar.open(response.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
        });
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        if (err?.status === 400) {
          // Convertir los errores del servidor al formato esperado
          this.errors = this.processServerErrors(err.error);
          this.matSnackBar.open('Validation errors', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
          });
        }
      },
    });
  }
}

  private processServerErrors(serverError: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (serverError && serverError.errors) {
      // Procesar los errores del formato del servidor
      Object.keys(serverError.errors).forEach((field) => {
        const fieldErrors = serverError.errors[field];
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach((errorMessage) => {
            errors.push({
              description: errorMessage,
              code: field,
            });
          });
        }
      });
    }

    return errors;
  }

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        fullName: ['', [Validators.required]],
        roles: [''],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );

    this.roles$ = this.roleService.getRoles();
  }

  private passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }
}