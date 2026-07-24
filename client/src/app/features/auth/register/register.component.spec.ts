import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastService } from '@core/services/toast/toast.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe("RegisterComponent", () => {
    // ================================================
    // SETUP
    // ================================================
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;

    let compAny: any;

    //Service Mocking
    const authServiceMock = {
        registration: jest.fn()
    };

    const toastServiceMock = {
        loading: jest.fn(),
        error: jest.fn()
    };

    const routerMock = {
        navigateByUrl: jest.fn()
    };

    beforeEach(async () => {
        jest.resetAllMocks();

        await TestBed.configureTestingModule({
            imports: [RegisterComponent, ReactiveFormsModule],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
                { provide: Router, useValue: routerMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;

        compAny = (component as any);
        fixture.detectChanges();
    });

    //Form helper
    const fillForm = (values: { userName: string, email: string, password: string, confirmPassword: string }) => {
        component.registerForm.patchValue(values);
        component.registerForm.markAllAsTouched();
        fixture.detectChanges();
    };

    const validPayload = {
        userName: 'johndoe',
        email: 'test@test.com',
        password: 'Passw0rd',
        confirmPassword: 'Passw0rd'
    };

    // ================================================
    // VALIDATORS
    // ================================================
    describe("registerForm Validator", () => {
        it("should be invalid when empty", () => {
            expect(component.registerForm.valid).toBe(false);
        });

        it("should be valid with correct data", () => {
            fillForm(validPayload);
            expect(component.registerForm.valid).toBe(true);
        });

        it("should flag userName as invalid when empty", () => {
            //The spread operator allows to change only the specific parameter (userName in this case)
            fillForm({...validPayload, userName: ''});
            expect(component.registerForm.get('userName')?.hasError('required')).toBe(true);
        });

        it("should flag email when format is incorrect", () => {
            fillForm({...validPayload, email: 'test.test'});
            expect(component.registerForm.get('email')?.hasError('email')).toBe(true);
        });

        //Password tests
        it.each([
            ['short1A', false], //Too short (less than 8 char)
            ['alllowercase1', false], //No uppercase
            ['ALLUPPERCASE1', false], //No lowercase
            ['NoDigitsHere', false], //No digit
            ['ValidPass1', true], //Meets all rules
        ])("password '%s' -> valid=%s", (password, expected) => {
            fillForm({...validPayload, password, confirmPassword: password});
            expect(component.registerForm.get('password')?.valid).toBe(expected);
        });

        it("should flag password when exceeding MaximumLength", () => {
            const longPass = 'A1a' + 'a'.repeat(126); //Repeats 'a' 126 times. Password is valid but of 129 characters
            fillForm({...validPayload, password: longPass, confirmPassword: longPass});
            expect(component.registerForm.get('password')?.hasError('maxLength')).toBe(true);
        });
    });

    // ================================================
    // PASSWORD - CONFIRMPASSWORD MATCH
    // ================================================
    describe("matchValues (password/confirmPassword match)", () => {
        it("should mark confirmPassword invalid when values differ", () => {
            fillForm({ ...validPayload, password: 'Passw0rd', confirmPassword: 'Different1' });
            expect(component.registerForm.get('confirmPassword')?.hasError('passwordMismatch')).toBe(true);
        });

        it("should mark confirmPassword valid when values match", () => {
            fillForm({ ...validPayload, password: 'Passw0rd', confirmPassword: 'Passw0rd' });
            expect(component.registerForm.get('confirmPassword')?.hasError('passwordMismatch')).toBe(false);
        });

        it("should re-validate confirmPassword when password changes afterwards", () => {
            //confirmPassword is filled first and matches the initial password
            fillForm({ ...validPayload, password: 'Passw0rd', confirmPassword: 'Passw0rd' });
            expect(component.registerForm.get('confirmPassword')?.valid).toBe(true);

            //password changes -> confirmPassword must become invalid without being touched again
            component.registerForm.get('password')?.setValue('NewPassw1');
            fixture.detectChanges();

            expect(component.registerForm.get('confirmPassword')?.hasError('passwordMismatch')).toBe(true);
        });
    });

    // ================================================
    // REGISTER METHOD
    // ================================================
    describe("register", () => {
        it("should return early and not call AuthService when form is invalid", () => {
            fillForm({ ...validPayload, email: 'bad-email' });

            compAny.register();

            expect(authServiceMock.registration).not.toHaveBeenCalled();
        });

        it("should call AuthService.registration with form value when form is valid", () => {
            toastServiceMock.loading.mockReturnValue(of({ id: 'user-1' }));
            fillForm(validPayload);

            compAny.register();

            expect(authServiceMock.registration).toHaveBeenCalledWith(validPayload);
        });

        it("should call ToastService.loading with the auth observable", () => {
            const registrationObservable = of({ id: 'user-1' });
            authServiceMock.registration.mockReturnValue(registrationObservable);
            toastServiceMock.loading.mockReturnValue(registrationObservable);
            fillForm(validPayload);

            compAny.register();

            expect(toastServiceMock.loading).toHaveBeenCalledWith(
                registrationObservable,
                expect.objectContaining({
                    loading: expect.any(String),
                    success: expect.any(String),
                    error: expect.any(Function)
                })
            );
        });

        it("should navigate to '/auth/login' and reset the form on successful registration", () => {
            toastServiceMock.loading.mockReturnValue(of({ id: 'user-1' }));
            fillForm(validPayload);

            compAny.register();

            expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/login');
            expect(component.registerForm.value.email).toBeNull();
        });

        it("should NOT navigate when registration fails", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { message: 'Email already in use' } })));
            fillForm(validPayload);

            compAny.register();

            expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
        });

        it("should keep form values when registration fails", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { message: 'Email already in use' } })));
            fillForm(validPayload);

            compAny.register();

            expect(component.registerForm.value.email).toBe(validPayload.email);
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interactions", () => {
    describe("submit button", () => {
        const getSubmitBtn = () => fixture.debugElement.query(By.css('button[type="submit"]'));

        it("should be disabled when form is invalid", () => {
            expect(getSubmitBtn().nativeElement.disabled).toBe(true);
        });

        it("should be enabled when form is valid", () => {
            fillForm(validPayload);
            expect(getSubmitBtn().nativeElement.disabled).toBe(false);
        });
    });

    describe("password visibility toggles", () => {
        it("should default both password fields to type 'password'", () => {
            const password = fixture.debugElement.query(By.css('input[formControlName="password"]'));
            const confirmPassword = fixture.debugElement.query(By.css('input[formControlName="confirmPassword"]'));

            expect(password.nativeElement.type).toBe('password');
            expect(confirmPassword.nativeElement.type).toBe('password');
        });

        it("should toggle password field independently from confirmPassword", () => {
            const toggleBtn = fixture.debugElement.query(By.css('[data-testid="toggle-password-visibility"]'));
            toggleBtn.nativeElement.click();
            fixture.detectChanges();

            const password = fixture.debugElement.query(By.css('input[formControlName="password"]'));
            const confirmPassword = fixture.debugElement.query(By.css('input[formControlName="confirmPassword"]'));

            expect(password.nativeElement.type).toBe('text');
            expect(confirmPassword.nativeElement.type).toBe('password'); //untouched by the other toggle
        });

        it("should toggle confirmPassword field independently from password", () => {
            const toggleBtn = fixture.debugElement.query(By.css('[data-testid="toggle-confirm-password-visibility"]'));
            toggleBtn.nativeElement.click();
            fixture.detectChanges();

            const password = fixture.debugElement.query(By.css('input[formControlName="password"]'));
            const confirmPassword = fixture.debugElement.query(By.css('input[formControlName="confirmPassword"]'));

            expect(password.nativeElement.type).toBe('password'); //untouched by the other toggle
            expect(confirmPassword.nativeElement.type).toBe('text');
        });
    });

    describe("validation error messages", () => 
        {
            //helper: finds an element whose own text content matches (not just contains, to avoid parent-match false positives)
            const findErrorText = (text: string) =>
                fixture.debugElement.query(el => el.nativeElement.textContent?.trim() === text);

            it("should show 'Username is required' only after touched", () => {
                expect(findErrorText('Username is required')).toBeNull();

                fillForm({ ...validPayload, userName: '' });

                expect(findErrorText('Username is required')).not.toBeNull();
            });

            it("should show 'Invalid email format' when email is malformed and touched", () => {
                fillForm({ ...validPayload, email: 'not-an-email' });

                expect(findErrorText('Invalid email format')).not.toBeNull();
            });

            it("should show 'Password must be at least 8 characters' when password is too short", () => {
                fillForm({ ...validPayload, password: 'Ab1', confirmPassword: 'Ab1' });

                expect(findErrorText('Password must be at least 8 characters')).not.toBeNull();
            });

            it("should show pattern error when password lacks required character types", () => {
                fillForm({ ...validPayload, password: 'alllowercase1', confirmPassword: 'alllowercase1' });

                expect(findErrorText('Password must contain uppercase, lowercase and a number')).not.toBeNull();
            });

            it("should show 'Passwords do not match' when confirmPassword differs from password", () => {
                fillForm({ ...validPayload, password: 'Passw0rd', confirmPassword: 'Different1' });

                expect(findErrorText('Passwords do not match')).not.toBeNull();
            });

            it("should NOT show 'Passwords do not match' when both fields are equal", () => {
                fillForm({ ...validPayload, password: 'Passw0rd', confirmPassword: 'Passw0rd' });

                expect(findErrorText('Passwords do not match')).toBeNull();
            });
        });
    });
});