import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

const EMAIL_REGEX = /^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;

export function strictEmailValidator(): ValidatorFn {
    return(control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if(!value) return null;

        //localPart becomes value.split('@')[0]. It's an array destructuring
        const [localPart = ''] = String(value).split('@');

        //Is valid if it's less/equal than 254 chars, the local part is less/equal than 64 chars and if it passes the regex 
        const isValid = String(value).length <= MAX_EMAIL_LENGTH &&
            localPart.length <= MAX_LOCAL_PART_LENGTH &&
            EMAIL_REGEX.test(value);

        return isValid ? null : { strictEmail: true };
    }
}