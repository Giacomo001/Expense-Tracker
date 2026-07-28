import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastService } from '@core/services/toast/toast.service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe("RegisterComponent", () => {
    // ================================================
    // SETUP
    // ================================================
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;
    let router: Router;
    let navigateByUrlSpy: jest.SpyInstance;

    let compAny: any;

    //Service Mocking
    const authServiceMock = {
        registration: jest.fn()
    };

    const toastServiceMock = {
        loading: jest.fn(),
        error: jest.fn()
    };

    beforeEach(async () => {
        jest.resetAllMocks();

        await TestBed.configureTestingModule({
            imports: [RegisterComponent, ReactiveFormsModule],
            providers: [
                //Same rule as LoginComponent: provideRouter creates a REAL Router instance.
                //Do NOT also override Router with a plain mock object — it breaks provideRouter's
                //internal providers (they expect a real Router, not a flat { navigateByUrl } object).
                //Spy on the real instance's method instead.
                provideRouter([]),
                { provide: AuthService, useValue: authServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
            ]
        }).compileComponents();

        router = TestBed.inject(Router);
        navigateByUrlSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;

        compAny = (component as any);
        fixture.detectChanges();
    });

    //Form helper — registerForm is `protected`, so it must be accessed via compAny
    const fillForm = (values: { userName: string, email: string, password: string, confirmPassword: string }) => {
        compAny.registerForm.patchValue(values);
        compAny.registerForm.markAllAsTouched();
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
            expect(compAny.registerForm.valid).toBe(false);
        });

        it("should be valid with correct data", () => {
            fillForm(validPayload);
            expect(compAny.registerForm.valid).toBe(true);
        });

        it("should flag userName as invalid when empty", () => {
            fillForm({ ...validPayload, userName: '' });
            expect(compAny.registerForm.get('userName')?.hasError('required')).toBe(true);
        });

        it("should flag email when format is incorrect", () => {
            fillForm({ ...validPayload, email: 'test.test' });
            expect(compAny.registerForm.get('email')?.hasError('email')).toBe(true);
        });

        //Password tests
        it.each([
            ['short1A', false],        //too short (less than 8 char)
            ['alllowercase1', false],  //no uppercase
            ['ALLUPPERCASE1', false],  //no lowercase
            ['NoDigitsHere', false],   //no digit
            ['ValidPass1', true],      //meets all rules
        ])("password '%s' -> valid=%s", (password, expected) => {
            fillForm({ ...validPayload, password, confirmPassword: password });
            expect(compAny.registerForm.get('password')?.valid).toBe(expected);
        });

        it("should flag password when exceeding maxLength", () => {
            const longPass = 'A1a' + 'a'.repeat(126); //valid characters, but 129 chars total
            fillForm({ ...validPayload, password: longPass, confirmPassword: longPass });
            //NOTE: Angular's built-in validator key is lowercase 'maxlength', not 'maxLength'
            expect(compAny.registerForm.get('password')?.hasError('maxlength')).toBe(true);
        });
    });

    // ================================================
    // PASSWORD - CONFIRMPASSWORD MATCH
    // ================================================
    describe("matchValues (password/confirmPassword match)", () => {
        it("should mark confirmPassword invalid when values differ", () => {
            fillForm({ ...validPayload, password: 'Passw0rd', confirmPassword: 'Different1' });
            expect(compAny.registerForm.get('confirmPassword')?.hasError('passwordMismatch')).toBe(true);
        });

        it("should mark confirmPassword valid when values match", () => {
            fillForm({ ...validPayload, password: 'Passw0rd', confirmPassword: 'Passw0rd' });
            expect(compAny.registerForm.get('confirmPassword')?.hasError('passwordMismatch')).toBe(false);
        });

        it("should re-validate confirmPassword when password changes afterwards", () => {
            fillForm({ ...validPayload, password: 'Passw0rd', confirmPassword: 'Passw0rd' });
            expect(compAny.registerForm.get('confirmPassword')?.valid).toBe(true);

            compAny.registerForm.get('password')?.setValue('NewPassw1');
            fixture.detectChanges();

            expect(compAny.registerForm.get('confirmPassword')?.hasError('passwordMismatch')).toBe(true);
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

        it("should navigate to '/auth/login' and reset the form on successful registration", async () => {
            toastServiceMock.loading.mockReturnValue(of({ id: 'user-1' }));
            fillForm(validPayload);

            compAny.register();
            //navigateByUrl is awaited inside the subscribe callback, same pattern as LoginComponent
            await Promise.resolve();

            expect(navigateByUrlSpy).toHaveBeenCalledWith('/auth/login');
            expect(compAny.registerForm.value.email).toBeFalsy();
        });

        it("should NOT navigate when registration fails", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { message: 'Email already in use' } })));
            fillForm(validPayload);

            compAny.register();

            expect(navigateByUrlSpy).not.toHaveBeenCalled();
        });

        it("should keep form values when registration fails", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { message: 'Email already in use' } })));
            fillForm(validPayload);

            compAny.register();

            expect(compAny.registerForm.value.email).toBe(validPayload.email);
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

        describe("validation error messages", () => {
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