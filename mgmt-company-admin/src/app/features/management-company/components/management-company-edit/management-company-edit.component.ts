import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-management-company-edit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="edit-placeholder">
      <h1>Edit Management Company</h1>
      <p>This component will be implemented in the next phase.</p>
    </div>
  `,
  styles: [`
    .edit-placeholder {
      padding: 2rem;
      text-align: center;
      color: #666;
    }
  `]
})
export class ManagementCompanyEditComponent {}