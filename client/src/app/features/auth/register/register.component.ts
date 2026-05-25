import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastService } from '@core/services/toast/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  // ============================================================
  // INJECT
  // ============================================================
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  
  // ============================================================
  // SIGNALS
  // ============================================================
  private fb = inject(FormBuilder);
  registerForm: FormGroup = new FormGroup({});
  protected hidePassword: boolean = true;
  protected hideConfirmPassword: boolean = true;

  //Signals when the component is destroyed. Used with 'takeUntilDestroyed' to auto-complete subscriptions
  private destroyRef = inject(DestroyRef);
  
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
    this.registerForm = this.fb.group({
      userName: ['', Validators.required],
      email: ['', [Validators.email, Validators.required]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
        ]
      ],
      confirmPassword: ['', [Validators.required, this.matchValues('password')]]
    });

    //Makes sure that returns INVALID if the two passwords are not the same
    this.registerForm.controls['password'].valueChanges
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => this.registerForm.controls['confirmPassword'].updateValueAndValidity()
    });
  }

  //Personal Validator to compare the string parameter to another string
  matchValues(matchTo: string): ValidatorFn { //Every validator has 'ValidatorFn' as type
    return (control: AbstractControl): ValidationErrors | null => { //Every input field inherits from AbstractControl
      return control.value === control.parent?.get(matchTo)?.value ? null : {passwordMismatch: true};
    }
  }

  register() {
    if(this.registerForm.invalid) return; 
    
    this.toastService.loading(
      this.authService.registration(this.registerForm.value),
      {
        loading: 'Creating the account...',
        success: 'Registration Successful!',
        error: (err) => err?.error?.message ?? 'There was an error during the registration'
      }
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/auth/login');
        this.registerForm.reset();
      }
    });
  }
}
