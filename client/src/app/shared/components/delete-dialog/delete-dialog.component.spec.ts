import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DeleteDialogComponent, ConfirmDialogData } from './delete-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { By } from "@angular/platform-browser";

describe("DeleteDialogComponent", () => {
    let component: DeleteDialogComponent;
    let fixture: ComponentFixture<DeleteDialogComponent>;
    let compAny: any;

    const dialogRefMock = {
        close: jest.fn()
    };

    const mockData: ConfirmDialogData = {
        itemName: 'Food',
        title: 'category'
    };

    beforeEach(async () => {
        jest.resetAllMocks();

        await TestBed.configureTestingModule({
            imports: [DeleteDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: mockData },
                { provide: MatDialogRef, useValue: dialogRefMock },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DeleteDialogComponent);
        component = fixture.componentInstance;
        compAny = (component as any);
        fixture.detectChanges();
    });

    describe("confirm", () => {
        it("should close the dialog with true", () => {
            compAny.confirm();
            expect(dialogRefMock.close).toHaveBeenCalledWith(true);
        });
    });

    describe("cancel", () => {
        it("should close the dialog with false", () => {
            compAny.cancel();
            expect(dialogRefMock.close).toHaveBeenCalledWith(false);
        });
    });

    describe("template interactions", () => {
        it("should render the item name and title from data", () => {
            const text = fixture.debugElement.query(el => el.nativeElement.textContent?.includes('Food'));
            expect(text).not.toBeNull();
        });

        it("should call confirm when the Delete button is clicked", () => {
            const spy = jest.spyOn(compAny, 'confirm');
            const btn = fixture.debugElement.query(el => el.nativeElement.textContent?.trim() === 'Delete');
            btn.nativeElement.click();
            expect(spy).toHaveBeenCalled();
        });

        it("should call cancel when the Cancel button is clicked", () => {
            const spy = jest.spyOn(compAny, 'cancel');
            const btn = fixture.debugElement.query(el => el.nativeElement.textContent?.trim() === 'Cancel');
            btn.nativeElement.click();
            expect(spy).toHaveBeenCalled();
        });
    });
});