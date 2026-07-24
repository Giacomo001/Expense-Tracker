import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { EmailValidator, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastService } from '@core/services/toast/toast.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe("LoginComponent", () => {
    // ================================================
    // SETUP
    // ================================================
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;

    let compAny: any;

    //Service Mocking
    const authServiceMock = {
        login: jest.fn()
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
            imports: [LoginComponent, ReactiveFormsModule],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
                { provide: Router, useValue: routerMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;

        compAny = (component as any);
        fixture.detectChanges();
    });

    //Form helper
    const fillForm = (email: string, password: string) => {
        component.loginForm.patchValue({ email, password });
        component.loginForm.markAllAsTouched();
        fixture.detectChanges();
    };

    // ================================================
    // VALIDATORS
    // ================================================
    describe("loginForm Validator", () => {
        //it.each loops the matrix (array of array) and check each case
        it.each([
            ['', '', false], //Both email and password are empty
            ['test.test', 'password', false], //Both filled but email is invalid
            ['test@test.test', '', false], //Email is valid but password is empty
            ['test@test.test', 'password', true] //Both are filled and valid
            //("email=%s password=%s -> form valid=%s", (email, password, expected) gives the "title" to the it() for each case
        ])("email=%s password=%s -> form valid=%s", (email, password, expected) => {
            fillForm(email, password);

            expect(component.loginForm.valid).toBe(expected);
        });

        it("should flag email as invalid with email' error on malformed value", () => {
            fillForm('test.test', 'password');

            expect(component.loginForm.get('email')?.hasError('email')).toBe(true);
        });

        it("should flag email as invalid with 'required' error when empty", () => {
            fillForm('', 'password');

            expect(component.loginForm.get('email')?.hasError('required')).toBe(true);
        });

        it("should flag password as invalid with 'required' error when empty", () => {
            fillForm('test@test.test', '');

            expect(component.loginForm.get('password')?.hasError('required')).toBe(true);
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
            routerMock.navigateByUrl.mockResolvedValue(true);
            fillForm('test@test.test', 'password');

            compAny.login();
            //navigateByUrl is awaited inside the subscribe callback
            await Promise.resolve();

            expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
            expect(component.loginForm.value.email).toBeFalsy(); //LoginForm is reset after the 'navigateByUrl'
        });

        it("should NOT navigate when login fails", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
            fillForm('test@test.com', 'wrongpassword');

            compAny.login();

            expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
        });

        it("should keep form values when login fails", () => {
            toastServiceMock.loading.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
            fillForm('test@test.com', 'wrongpassword');

            compAny.login();

            expect(component.loginForm.value.email).toBe('test@test.com');
        });
    });

    // ================================================
    // DOM
    // ================================================
    describe("template interaction", () => {
        //Standard variables for the buttons would throw an error
        const getSubmitBtn = () => fixture.debugElement.query(By.css('button[type="submit"]'));
        const getPasswordInput = () => fixture.debugElement.query(By.css('input[formControlName="password"]'));
        const getVibilityToggleBtn = () => fixture.debugElement.query(By.css('[data-testid="toggle-password-visibility"]'));

        describe("submit button", () => {
            it("should be disabled when form is invalid", () => {
                expect(getSubmitBtn().nativeElement.disabled).toBe(true);
            });
    
            it("should be enabled when form is valid", () => {
                fillForm('test@test.test', 'password');

                expect(getSubmitBtn().nativeElement.disabled).toBe(false);
            });
    
            it("should call login on click", () => {
                toastServiceMock.loading().mockReturnValue(of({ token: 'fake' }));
                fillForm('test@test.test', 'password');
                const spy = jest.spyOn(compAny, 'login');

                getSubmitBtn().nativeElement.click(); //Button is clicked

                expect(spy).toHaveBeenCalled();
            });
        });

        describe("password visibility toggle", () => {
            it("should default to type 'password' with hidePassword=true", () => {
                expect(getPasswordInput().nativeElement.type).toBe('password');
            });
    
            it("should switch input type to 'text' on toggle click", () => {
                getVibilityToggleBtn().nativeElement.click();
                fixture.detectChanges();

                expect(getPasswordInput().nativeElement.type).toBe('text');
            });
    
            it("should switch back to type 'password' on second toggle click", () => {
                //Double click
                getVibilityToggleBtn().nativeElement.click();
                getVibilityToggleBtn().nativeElement.click();
                fixture.detectChanges();

                expect(getPasswordInput().nativeElement.type).toBe('password');
            });
        });
    
        describe("validation error message", () => {
            it("should show 'required' error for email only after touched", () => {
                let error = fixture.debugElement.query(By.css('mat-error'));
                expect(error).toBeNull();

                fillForm('', ''); //Form is invalid

                error = fixture.debugElement.query(By.css('mat-error'));
                expect(error).not.toBeNull();
            });
        });
    });
})