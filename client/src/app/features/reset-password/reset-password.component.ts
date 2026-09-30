import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastService } from '@core/services/toast/toast.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  // ============================================================
  // INJECT
  // ============================================================
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // ============================================================
  // PROPERTIES
  // ============================================================
  resetPasswordForm: FormGroup = new FormGroup({});
  protected hideNewPassword: boolean = true;
  protected hideConfirmPassword: boolean = true;

  private token: string | null = null;
  private email: string | null = null;

  //Getters to simplify the html file
  protected get newPassword() {
    return this.resetPasswordForm.get('newPassword');
  };

  protected get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  };

  // ============================================================
  // LIFE CYCLES
  // ============================================================
  ngOnInit(): void {
    this.readQueryParams();
    this.initializeForm();
  }

  // ============================================================
  // METHODS
  // ============================================================
  private readQueryParams() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.email = this.route.snapshot.queryParamMap.get('email');

    //Without a token/email, this page has no valid purpose: send the user back to login
    if (!this.token || !this.email) {
      this.toastService.error('This reset link is invalid or has expired.');
      this.router.navigateByUrl('/auth/login');
    }
  }

  private initializeForm() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordsMatchValidator });
  }

  protected resetPassword() {
    if (this.resetPasswordForm.invalid || !this.token || !this.email) return;

    this.toastService.loading(
      this.authService.resetPassword({
        token: this.token,
        email: this.email,
        newPassword: this.newPassword?.value,
        confirmPassword: this.confirmPassword?.value
      }),
      {
        loading: 'Resetting password...',
        success: 'Password reset successful! Please sign in.',
        error: (err) => err?.error?.title ?? 'This reset link is invalid or has expired.'
      }
    ).subscribe({
      next: async () => {
        await this.router.navigateByUrl('/auth/login');
        this.resetPasswordForm.reset();
      }
    });
  }
}

//Cross-field validator: ensures newPassword and confirmPassword match
function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return newPassword === confirmPassword ? null : { passwordsMismatch: true };
}