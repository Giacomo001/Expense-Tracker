import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastService } from '@core/services/toast/toast.service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe("LoginComponent", () => {
    // ================================================
    // SETUP
    // ================================================
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let router: Router;
    let navigateByUrlSpy: jest.SpyInstance;

    let compAny: any;

    //Service Mocking
    const authServiceMock = {
        login: jest.fn()
    };

    const toastServiceMock = {
        loading: jest.fn(),
        error: jest.fn()
    };

    beforeAll(() => {
        HTMLCanvasElement.prototype.getContext = jest.fn() as any;
    });

    beforeEach(async () => {
        jest.resetAllMocks();

        await TestBed.configureTestingModule({
            imports: [LoginComponent, ReactiveFormsModule],
            providers: [
                //provideRouter creates a REAL Router instance to satisfy RouterLink/ActivatedRoute
                //dependencies used inside the template. Do NOT also override Router with a plain
                //object ({ provide: Router, useValue: {...} }) — provideRouter's internal providers
                //expect a real Router instance (they read internal state like `.root`), and a fake
                //object breaks that chain with "Cannot read properties of undefined (reading 'root')".
                //Instead, spy on the real instance's method.
                provideRouter([]),
                { provide: AuthService, useValue: authServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
            ]
        }).compileComponents();

        router = TestBed.inject(Router);
        navigateByUrlSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;

        compAny = (component as any);
        fixture.detectChanges();
    });

    //Form helper — loginForm is `protected`, so it must be accessed via compAny
    const fillForm = (email: string, password: string) => {
        compAny.loginForm.patchValue({ email, password });
        compAny.loginForm.markAllAsTouched();
        fixture.detectChanges();
    };

    // ================================================
    // VALIDATORS
    // ================================================
    describe("loginForm Validator", () => {
        //it.each loops the matrix (array of array) and check each case
        it.each([
            ['', '', false],                         //both email and password are empty
            ['test.test', 'Password1', false],        //both filled but email is invalid
            ['test@test.test', '', false],             //email is valid but password is empty
            ['test@test.test', 'Password1', true],     //both are filled and valid
        ])("email=%s password=%s -> form valid=%s", (email, password, expected) => {
            fillForm(email, password);

            expect(compAny.loginForm.valid).toBe(expected);
        });

        it("should flag email as invalid with 'required' error when empty", () => {
            fillForm('', 'password');

            expect(compAny.loginForm.get('email')?.hasError('required')).toBe(true);
        });

        it("should flag password as invalid with 'required' error when empty", () => {
            fillForm('test@test.test', '');

            expect(compAny.loginForm.get('password')?.hasError('required')).toBe(true);
        });
    });

    // ================================================
    // LOGIN
    // ================================================
    describe("login", () => {
        it("should return early and not call AuthService when form is invalid", () => {
            fillForm('', '');

            compAny.login();

            expect(authServiceMock.login).not.toHaveBeenCalled();
        });

        it("should call AuthService.login with form value when form is valid", () => {
            toastServiceMock.loading.mockReturnValue(of({ token: 'fake' }));
            fillForm('test@test.test', 'password');

            compAny.login();

            expect(authServiceMock.login).toHaveBeenCalledWith({ email: 'test@test.test', password: 'password' });
        });

        it("should call ToastService.loading with the auth observable", () => {
            const loginObservable = of({ token: 'fake' });
            authServiceMock.login.mockReturnValue(loginObservable);
            toastServiceMock.loading.mockReturnValue(loginObservable);
            fillForm('test@test.test', 'password');

            compAny.login();

            expect(toastServiceMock.loading).toHaveBeenCalledWith(
                loginObservable,
                expect.objectContaining({
                    loading: expect.any(String),
                    success: expect.any(String),
                    error: expect.any(Function)
                })
            );
        });

        it("should navigate to '/' and reset the form on successful login", async () => {
            toastServiceMock.loading.mockReturnValue(of({ token: 'fake' }));
            fillForm('test@test.test', 'password');

            compAny.login();
            //navigateByUrl is awaited inside the subscribe callback
            await Promise.resolve();

            expect(navigateByUrlSpy).toHaveBeenCalledWith('/');
            expect(compAny.loginForm.value.email).toBeFalsy(); //loginForm is reset after navigateByUrl
        });

        it("should NOT navigate when login fails", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
            fillForm('test@test.com', 'wrongpassword');

            compAny.login();

            expect(navigateByUrlSpy).not.toHaveBeenCalled();
        });

        it("should keep form values when login fails", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
            fillForm('test@test.com', 'wrongpassword');

            compAny.login();

            expect(compAny.loginForm.value.email).toBe('test@test.com');
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interaction", () => {
        const getSubmitBtn = () => fixture.debugElement.query(By.css('button[type="submit"]'));
        const getPasswordInput = () => fixture.debugElement.query(By.css('input[formControlName="password"]'));
        const getVisibilityToggleBtn = () => fixture.debugElement.query(By.css('[data-testid="toggle-password-visibility"]'));

        describe("submit button", () => {
            it("should be disabled when form is invalid", () => {
                expect(getSubmitBtn().nativeElement.disabled).toBe(true);
            });

            it("should be enabled when form is valid", () => {
                fillForm('test@test.test', 'password');

                expect(getSubmitBtn().nativeElement.disabled).toBe(false);
            });

            it("should call login on click", () => {
                //NOTE: previously this called toastServiceMock.loading() (invoking the mock)
                //instead of configuring it — that returned undefined and made login() crash
                //before reaching navigateByUrl. Configure the mock's return value instead.
                toastServiceMock.loading.mockReturnValue(of({ token: 'fake' }));
                fillForm('test@test.test', 'password');
                const spy = jest.spyOn(compAny, 'login');

                getSubmitBtn().nativeElement.click();

                expect(spy).toHaveBeenCalled();
            });
        });

        describe("password visibility toggle", () => {
            it("should default to type 'password' with hidePassword=true", () => {
                expect(getPasswordInput().nativeElement.type).toBe('password');
            });

            it("should switch input type to 'text' on toggle click", () => {
                getVisibilityToggleBtn().nativeElement.click();
                fixture.detectChanges();

                expect(getPasswordInput().nativeElement.type).toBe('text');
            });

            it("should switch back to type 'password' on second toggle click", () => {
                getVisibilityToggleBtn().nativeElement.click();
                getVisibilityToggleBtn().nativeElement.click();
                fixture.detectChanges();

                expect(getPasswordInput().nativeElement.type).toBe('password');
            });
        });

        describe("validation error message", () => {
            it("should show 'required' error for email only after touched", () => {
                let error = fixture.debugElement.query(By.css('mat-error'));
                expect(error).toBeNull();

                fillForm('', ''); //form is invalid and touched

                error = fixture.debugElement.query(By.css('mat-error'));
                expect(error).not.toBeNull();
            });
        });
    });
});