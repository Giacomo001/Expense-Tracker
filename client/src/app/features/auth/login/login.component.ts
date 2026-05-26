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

Chart.register(ArcElement, Tooltip, DoughnutController);

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, RouterLink, BaseChartDirective],
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
  
  // ============================================================
  // PROPERTIES
  // ============================================================
  private fb = inject(FormBuilder);
  loginForm: FormGroup = new FormGroup({});
  protected hidePassword: boolean = true;

  // ============================================================
  // GRAPHS
  // ============================================================
  protected readonly donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  };

  protected readonly chartColors = ['#60A5FA', '#34D399', '#FBBF24', '#F472B6', '#A78BFA'];

  protected readonly februaryData: ChartData<'doughnut'> = {
    labels: ['Food', 'Rent', 'Transport', 'Hobbies', 'Other'],
    datasets: [{
      data: [35, 28, 15, 12, 10],
      backgroundColor: this.chartColors,
      borderWidth: 0
    }]
  };

  protected readonly yearData: ChartData<'doughnut'> = {
    labels: ['Food', 'Rent', 'Transport', 'Hobbies', 'Other'],
    datasets: [{
      data: [30, 32, 18, 10, 10],
      backgroundColor: this.chartColors,
      borderWidth: 0
    }]
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
      email: ['', [Validators.email, Validators.required]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
        ]
      ]
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
}
