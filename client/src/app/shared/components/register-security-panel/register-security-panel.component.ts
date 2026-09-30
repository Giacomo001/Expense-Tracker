import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register-security-panel',
  imports: [MatIconModule],
  templateUrl: './register-security-panel.component.html',
  styleUrl: './register-security-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterSecurityPanelComponent {}
