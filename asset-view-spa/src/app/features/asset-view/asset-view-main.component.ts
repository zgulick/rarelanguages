import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent } from 'ag-grid-community';

@Component({
  selector: 'app-asset-view-main',
  standalone: true,
  styleUrls: ['./asset-view-main.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatExpansionModule,
    AgGridAngular
  ],
  template: `
    <div class="asset-view-container">
      <!-- Header -->
      <div class="main-header">
        <div class="header-left">
          <button mat-icon-button class="menu-button">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="property-address">1838 Zach Ave, Waterloo, Black Hawk, IA 5072</span>
        </div>
        
        <div class="header-right">
          <button mat-icon-button><mat-icon>undo</mat-icon></button>
          <button mat-icon-button><mat-icon>view_list</mat-icon></button>
          <button mat-icon-button><mat-icon>attach_money</mat-icon></button>
          <button mat-icon-button><mat-icon>content_copy</mat-icon></button>
          <button mat-icon-button><mat-icon>attach_file</mat-icon></button>
          <button mat-icon-button><mat-icon>description</mat-icon></button>
          <button mat-icon-button><mat-icon>group</mat-icon></button>
          
          <div class="view-toggle-buttons">
            <button mat-stroked-button class="view-btn active">
              <mat-icon>view_agenda</mat-icon>
              Default View
            </button>
            <button mat-stroked-button class="view-btn">
              <mat-icon>dashboard</mat-icon>
              Dashboard View
            </button>
          </div>
        </div>
      </div>

      <div class="main-content">
        <!-- Left Sidebar -->
        <div class="left-sidebar">
          <!-- Asset Actions -->
          <div class="asset-actions">
            <div class="action-item">
              <mat-icon>star_border</mat-icon>
              <span>FAVORITE</span>
            </div>
            <div class="action-item">
              <mat-icon>file_upload</mat-icon>
              <span>UPLOAD IMAGE</span>
            </div>
            <mat-icon class="edit-icon">edit</mat-icon>
          </div>

          <!-- Search -->
          <div class="search-section">
            <mat-form-field appearance="outline" class="search-field">
              <input matInput placeholder="Search" [(ngModel)]="searchTerm">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>

          <!-- Sidebar Accordion -->
          <div class="sidebar-accordion">
            <mat-accordion class="sidebar-accordion-container">
              <!-- Asset Details Panel -->
              <mat-expansion-panel class="accordion-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="panel-icon">info</mat-icon>
                    <span class="panel-name">ASSET DETAILS</span>
                  </mat-panel-title>
                </mat-expansion-panel-header>
                
                <div class="panel-content">
                  <div class="detail-field">
                    <label>Official Approval Number</label>
                    <div class="value">E1230345</div>
                  </div>
                  
                  <div class="detail-field">
                    <label>Processor / Advisor</label>
                    <div class="input-field">
                      <input type="text" class="text-input bordered">
                    </div>
                  </div>
                  
                  <div class="detail-field">
                    <label>Aspen Reference Number</label>
                    <div class="value">R00573964</div>
                  </div>
                  
                  <div class="detail-field">
                    <label>Status</label>
                    <div class="value">Certified</div>
                  </div>
                  
                  <div class="detail-field">
                    <label>Member</label>
                    <div class="value">Joe Bloggs</div>
                  </div>
                  
                  <div class="detail-field">
                    <label>Scope</label>
                    <div class="value">Beef, Dairy</div>
                  </div>
                </div>
              </mat-expansion-panel>

              <!-- PQAS Certification Process -->
              <mat-expansion-panel 
                [expanded]="selectedSidebarProcess === 'pqas'"
                (opened)="selectSidebarProcess('pqas')"
                class="accordion-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="panel-icon">verified</mat-icon>
                    <span class="panel-name">PQAS CERTIFICATION</span>
                  </mat-panel-title>
                  <mat-panel-description>
                    <span class="panel-status">On Inspection Cycle</span>
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="panel-content">
                  <div class="detail-field">
                    <label>Status:</label>
                    <div class="value">On Inspection Cycle</div>
                  </div>
                  <div class="detail-field">
                    <label>Added Date:</label>
                    <div class="value">02/04/1994</div>
                  </div>
                  <div class="detail-field">
                    <label>Status Date:</label>
                    <div class="value">12/05/2022</div>
                  </div>
                  <div class="detail-field">
                    <label>Tasks:</label>
                    <div class="value">2 Open, 1 Completed</div>
                  </div>
                </div>
              </mat-expansion-panel>

              <!-- Audit Close Out Process -->
              <mat-expansion-panel 
                [expanded]="selectedSidebarProcess === 'audit'"
                (opened)="selectSidebarProcess('audit')"
                class="accordion-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="panel-icon">assignment</mat-icon>
                    <span class="panel-name">AUDIT - CLOSE OUT</span>
                  </mat-panel-title>
                  <mat-panel-description>
                    <span class="panel-status">In Progress</span>
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="panel-content">
                  <div class="detail-field">
                    <label>Status:</label>
                    <div class="value">In Progress</div>
                  </div>
                  <div class="detail-field">
                    <label>Added Date:</label>
                    <div class="value">02/04/1994</div>
                  </div>
                  <div class="detail-field">
                    <label>Status Date:</label>
                    <div class="value">12/05/2022</div>
                  </div>
                  <div class="detail-field">
                    <label>Tasks:</label>
                    <div class="value">1 Open, 0 Completed</div>
                  </div>
                </div>
              </mat-expansion-panel>

              <!-- Generic Process -->
              <mat-expansion-panel 
                [expanded]="selectedSidebarProcess === 'process'"
                (opened)="selectSidebarProcess('process')"
                class="accordion-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="panel-icon">task</mat-icon>
                    <span class="panel-name">PROCESS NAME</span>
                  </mat-panel-title>
                  <mat-panel-description>
                    <span class="panel-status">Pending</span>
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="panel-content">
                  <div class="detail-field">
                    <label>Status:</label>
                    <div class="value">Pending</div>
                  </div>
                  <div class="detail-field">
                    <label>Added Date:</label>
                    <div class="value">02/04/1994</div>
                  </div>
                  <div class="detail-field">
                    <label>Status Date:</label>
                    <div class="value">12/05/2022</div>
                  </div>
                  <div class="detail-field">
                    <label>Tasks:</label>
                    <div class="value">0 Open, 0 Completed</div>
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="main-content-area">
          <!-- Process Header -->
          <div class="process-header">
            <div class="process-summary">
              <strong>3 Process(es) | 3 Open | 0 Closed</strong>
            </div>
            <div class="process-actions">
              <button mat-button [matMenuTriggerFor]="sortMenu" class="sort-filter-btn">
                <mat-icon>sort</mat-icon>
                Sort & Filter
                <mat-icon>keyboard_arrow_down</mat-icon>
              </button>
              <button mat-icon-button class="star-btn">
                <mat-icon>star_border</mat-icon>
              </button>
              <button mat-raised-button color="primary" class="add-process-btn">
                <mat-icon>add</mat-icon>
                Add Process
              </button>
            </div>
          </div>

          <!-- Process Cards -->
          <div class="process-cards-container">
            <div class="process-card" [class.selected]="selectedProcess === 'pqas'" (click)="selectProcess('pqas')">
              <div class="card-header">
                <h4>PQAS Certification</h4>
              </div>
              <div class="card-content">
                <div class="detail-row">
                  <span class="label">Status</span>
                  <span class="value">On Inspection Cycle</span>
                </div>
                <div class="detail-row">
                  <span class="label">Added Date</span>
                  <span class="value">02/04/1994</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status Date</span>
                  <span class="value">12/05/2022</span>
                </div>
              </div>
            </div>

            <div class="process-card" [class.selected]="selectedProcess === 'audit'" (click)="selectProcess('audit')">
              <div class="card-header">
                <h4>Audit - Close Out</h4>
              </div>
              <div class="card-content">
                <div class="detail-row">
                  <span class="label">Status</span>
                  <span class="value">Status</span>
                </div>
                <div class="detail-row">
                  <span class="label">Added Date</span>
                  <span class="value">02/04/1994</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status Date</span>
                  <span class="value">12/05/2022</span>
                </div>
              </div>
            </div>

            <div class="process-card" [class.selected]="selectedProcess === 'process'" (click)="selectProcess('process')">
              <div class="card-header">
                <h4>Process Name</h4>
              </div>
              <div class="card-content">
                <div class="detail-row">
                  <span class="label">Status</span>
                  <span class="value">Status</span>
                </div>
                <div class="detail-row">
                  <span class="label">Added Date</span>
                  <span class="value">02/04/1994</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status Date</span>
                  <span class="value">12/05/2022</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Process Details -->
          <div class="process-details-section" *ngIf="selectedProcess">
            <div class="process-title-bar">
              <h2>{{ getProcessTitle() }} PR000023133</h2>
              <button mat-button class="process-details-btn">
                <mat-icon>edit</mat-icon>
                Process Details
              </button>
            </div>

            <div class="process-info-bar">
              <div class="info-item">
                <span class="label">Description</span>
                <span class="value">Verify sustainability, qu...</span>
              </div>
              <div class="info-item">
                <span class="label">Current Cert Expiry:</span>
                <span class="value">Vacant</span>
              </div>
              <div class="info-item">
                <span class="label">Original Cert Expiry:</span>
                <span class="value">05/04/2021</span>
              </div>
              <div class="info-item">
                <span class="label">Cert Extension:</span>
                <span class="value">05/06/2021</span>
              </div>
              <div class="info-item">
                <span class="label">Last Audit Date:</span>
                <span class="value">06/02/2021</span>
              </div>
              <div class="info-item">
                <span class="label">Secondary Processor</span>
                <span class="value">Foyle Foods</span>
                <button mat-button class="show-more-btn">SHOW MORE</button>
              </div>
            </div>
          </div>

          <!-- Tasks Section -->
          <div class="tasks-section" *ngIf="selectedProcess">
            <div class="tasks-header">
              <div class="task-tabs">
                <button class="tab-button" [class.active]="selectedTab === 'open'" (click)="selectTab('open')">
                  Open (2)
                </button>
                <button class="tab-button" [class.active]="selectedTab === 'closed'" (click)="selectTab('closed')">
                  Closed (0)
                </button>
                <button class="tab-button" [class.active]="selectedTab === 'archived'" (click)="selectTab('archived')">
                  Archived (1)
                </button>
                <button class="tab-button" [class.active]="selectedTab === 'all'" (click)="selectTab('all')">
                  All (3)
                </button>
              </div>

              <div class="task-controls">
                <mat-form-field appearance="outline" class="task-search">
                  <input matInput placeholder="Search" [(ngModel)]="taskSearchTerm">
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="view-select">
                  <mat-select value="Default">
                    <mat-option value="Default">View: Default</mat-option>
                  </mat-select>
                  <mat-icon matSuffix>keyboard_arrow_down</mat-icon>
                </mat-form-field>
                
                <button mat-raised-button color="primary" class="add-task-btn">
                  <mat-icon>add</mat-icon>
                  Add Task
                </button>
              </div>
            </div>

            <!-- AG Grid Task Table -->
            <div class="task-grid-container">
              <ag-grid-angular
                class="ag-theme-alpine task-grid"
                [rowData]="taskData"
                [columnDefs]="columnDefs"
                [defaultColDef]="defaultColDef"
                [domLayout]="'normal'"
                [suppressHorizontalScroll]="false"
                [rowHeight]="48"
                [headerHeight]="44"
                [animateRows]="true"
                [enableCellTextSelection]="true"
                [suppressRowClickSelection]="true"
                (gridReady)="onGridReady($event)">
              </ag-grid-angular>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Menus -->
    <mat-menu #sortMenu="matMenu">
      <button mat-menu-item>Sort by Date</button>
      <button mat-menu-item>Sort by Status</button>
      <button mat-menu-item>Filter by Type</button>
    </mat-menu>
  `
})
export class AssetViewMainComponent implements OnInit {
  searchTerm = '';
  taskSearchTerm = '';
  selectedProcess: string = 'pqas';  // For top tiles
  selectedSidebarProcess: string = '';  // For left accordion (independent)
  selectedTab: string = 'open';

  columnDefs: ColDef[] = [
    {
      headerName: 'TASK #',
      field: 'taskNumber',
      width: 160,
      pinned: 'left',
      cellRenderer: (params: any) => {
        return `
          <div class="task-number-cell">
            <svg class="task-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            ${params.value}
          </div>
        `;
      }
    },
    {
      headerName: 'TASK',
      field: 'task',
      width: 130,
      cellStyle: { fontWeight: '500' }
    },
    {
      headerName: 'DESCRIPTION',
      field: 'description',
      width: 200,
      flex: 1,
      cellStyle: { color: '#656d76' }
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 180,
      cellRenderer: (params: any) => {
        return `
          <div class="status-cell">
            <div class="status-chip">
              <div class="status-dot"></div>
              ${params.value}
            </div>
          </div>
        `;
      }
    },
    {
      headerName: 'DETAILS',
      field: 'details',
      width: 100,
      cellRenderer: () => {
        return '<button style="border:none;background:none;color:#0969da;cursor:pointer;font-weight:500;">Details</button>';
      }
    },
    {
      headerName: 'SCHEDULED DATE',
      field: 'scheduledDate',
      width: 140,
      cellStyle: { fontFamily: 'monospace' }
    },
    {
      headerName: 'AUDITOR',
      field: 'auditor',
      width: 120
    },
    {
      headerName: 'TEAM',
      field: 'team',
      width: 100,
      cellStyle: { fontWeight: '500' }
    },
    {
      headerName: 'PERSON',
      field: 'person',
      width: 120
    },
    {
      headerName: '',
      field: 'actions',
      width: 60,
      cellRenderer: () => {
        return '<button style="border:none;background:none;cursor:pointer;font-size:16px;color:#656d76;">▼</button>';
      },
      sortable: false,
      filter: false
    }
  ];

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: false,
    suppressMenu: true,
    cellStyle: { 
      display: 'flex', 
      alignItems: 'center',
      fontSize: '14px',
      color: '#1f2328'
    }
  };

  taskData = [
    {
      taskNumber: 'T0026019907',
      task: 'Pig Audit',
      description: 'Lorem Ipsum',
      status: 'Awaiting Assignment',
      details: 'Details',
      scheduledDate: '10/19/2024',
      auditor: 'Lynne Cole',
      team: 'Bord Bia',
      person: 'Ciara Smith'
    },
    {
      taskNumber: 'T0026019907',
      task: 'Pig Audit',
      description: 'Lorem Ipsum',
      status: 'Awaiting Assignment',
      details: 'Details',
      scheduledDate: '10/19/2024',
      auditor: 'N/A',
      team: 'Bord Bia',
      person: 'Ciara Smith'
    }
  ];

  ngOnInit() {
    // Initialize with PQAS selected
  }

  selectProcess(processId: string) {
    this.selectedProcess = processId;
  }

  selectSidebarProcess(processId: string) {
    this.selectedSidebarProcess = this.selectedSidebarProcess === processId ? '' : processId;
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  getProcessTitle(): string {
    switch (this.selectedProcess) {
      case 'pqas': return 'PQAS CERTIFICATION';
      case 'audit': return 'AUDIT - CLOSE OUT';
      case 'process': return 'PROCESS NAME';
      default: return 'PROCESS';
    }
  }

  onGridReady(params: GridReadyEvent) {
    params.api.sizeColumnsToFit();
    // Auto-resize grid when window resizes
    window.addEventListener('resize', () => {
      setTimeout(() => {
        params.api.sizeColumnsToFit();
      }, 100);
    });
  }
}