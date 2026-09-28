import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastService } from '@core/services/toast/toast.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChartData, ChartOptions, Chart, ArcElement, Tooltip, DoughnutController } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AuthChartsComponent } from "@shared/components/charts/auth-charts/auth-charts.component";
import { MatDialog } from '@angular/material/dialog';
import { ForgotPasswordDialogComponent } from '@features/forgot-password/forgot-password-dialog/forgot-password-dialog.component';
import { strictEmailValidator } from '@shared/validators/email.validators';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, RouterLink, AuthChartsComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  // ============================================================
  // INJECT
  // ============================================================
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  private dialog = inject(MatDialog);
  
  // ============================================================
  // PROPERTIES
  // ============================================================
  private fb = inject(FormBuilder);
  loginForm: FormGroup = new FormGroup({});
  protected hidePassword: boolean = true;
  
  //Getters to simplify the html file
  protected get email() {
    return this.loginForm.get('email');
  };

  protected get password() {
    return this.loginForm.get('password');
  };

  // ============================================================
  // LIFE CYCLES
  // ============================================================
  ngOnInit(): void {
    this.initializeForm();
  }
  
  // ============================================================
  // METHODS
  // ============================================================
  private initializeForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, strictEmailValidator()]],
      password: ['', [Validators.required]]
    });
  }

  protected login() {
    if (this.loginForm.invalid) return;
    
    this.toastService.loading(
      this.authService.login(this.loginForm.value),
      {
        loading: 'Logging in...',
        success: 'Login Successful!',
        error: (err) => err?.error?.message ?? 'There was an error during the login'
      }
    ).subscribe({
      next: async () => {
        await this.router.navigateByUrl('/');
        this.loginForm.reset();
      }
    });
  }

  protected openForgotPasswordDialog() {
    this.dialog.open(ForgotPasswordDialogComponent);
  }
}
