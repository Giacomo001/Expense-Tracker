import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function strictEmailValidator(): ValidatorFn {
    const validatorRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return(control: AbstractControl): ValidationErrors | null => {
        if(!control.value) return null;

        const emailIsValid = validatorRegex.test(control.value);
        return emailIsValid ? null : { invalidEmailDomain: true };
    }
}