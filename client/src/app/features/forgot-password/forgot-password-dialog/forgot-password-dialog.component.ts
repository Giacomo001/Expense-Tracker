import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastService } from '@core/services/toast/toast.service';
import { strictEmailValidator } from '@shared/validators/email.validators';

@Component({
  selector: 'app-forgot-password-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './forgot-password-dialog.component.html',
  styleUrl: './forgot-password-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordDialogComponent {
  // ============================================================
  // INJECT
  // ============================================================
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private dialogRef = inject(MatDialogRef<ForgotPasswordDialogComponent>);
  private fb = inject(FormBuilder);

  // ============================================================
  // SIGNALS
  // ============================================================
  protected forgotPasswordForm: FormGroup = new FormGroup({});
  protected emailSent = signal<boolean>(false);

  // ============================================================
  // COMPUTED
  // ============================================================

  // ============================================================
  // PROPERTIES
  // ============================================================

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
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, strictEmailValidator()]]
    });
  }
  
  protected send() {
    if(this.forgotPasswordForm.invalid) return;

    this.toastService.loading(
      this.authService.forgotPassword(this.forgotPasswordForm.value),
      {
        loading: 'Sending reset link...',
        success: 'If that email exists, a reset link has been sent.',
        error: 'There was a problem sending the reset link.'
      }
    ).subscribe({
      next: () => this.emailSent.set(true)
    });
  }

  protected close() {
    this.dialogRef.close();
  }
}
