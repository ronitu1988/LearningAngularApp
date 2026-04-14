export interface MaterialRequestRow {
  requestId: number;
  status: string;

  hull?: string;
  ric?: string;
  niin?: string;
  qty?: number;

  submittedBy?: string;
  submittedDate?: string;

  approvedBy?: string;
  approvedDate?: string;

  removedBy?: string;
  removedDate?: string | null;

  fileName?: string | null;
  filePath?: string | null;

  onLocation?: string;
  priority?: string;
  notes?: string;

  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;

  [key: string]: any;
}

export interface UpdateRemovalRequest {
  requestId: number;
  status: string;
  removedBy?: string | null;
  removedDate?: string | null;
}

export interface UploadResponse {
  success: boolean;
  fileName?: string;
  filePath?: string;
  message?: string;
}

---------------
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MaterialRequestRow,
  UpdateRemovalRequest,
  UploadResponse
} from './material-request.model';

@Injectable({
  providedIn: 'root'
})
export class MaterialRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/material-requests';

  getApprovedWaitingForRemove(): Observable<MaterialRequestRow[]> {
    const params = new HttpParams().set('status', 'Approved - Waiting for Remove');
    return this.http.get<MaterialRequestRow[]>(`${this.baseUrl}/queue`, { params });
  }

  updateRemoval(payload: UpdateRemovalRequest): Observable<MaterialRequestRow> {
    return this.http.put<MaterialRequestRow>(`${this.baseUrl}/${payload.requestId}/removal`, payload);
  }

  uploadAttachment(requestId: number, file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(
      `${this.baseUrl}/${requestId}/attachment`,
      formData
    );
  }
}


----------------------
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MaterialRequestRow,
  UpdateRemovalRequest
} from './material-request.model';
import { MaterialRequestService } from './material-request.service';

type EditableRowState = {
  isEditing: boolean;
  status: string;
  removedBy: string;
  removedDate: string;
  selectedFile?: File | null;
  isSaving: boolean;
  isUploading: boolean;
  error?: string;
  success?: string;
};

@Component({
  selector: 'app-approved-removal-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approved-removal-queue.component.html',
  styleUrls: ['./approved-removal-queue.component.css']
})
export class ApprovedRemovalQueueComponent implements OnInit {
  private readonly materialRequestService = inject(MaterialRequestService);

  rows: MaterialRequestRow[] = [];
  filteredRows: MaterialRequestRow[] = [];

  loading = false;
  pageError = '';
  globalSearch = '';

  readonly statusOptions = [
    'Approved - Waiting for Remove',
    'Removed',
    'Partially Removed',
    'Cancelled'
  ];

  rowState: Record<number, EditableRowState> = {};

  ngOnInit(): void {
    this.loadQueue();
  }

  loadQueue(): void {
    this.loading = true;
    this.pageError = '';

    this.materialRequestService.getApprovedWaitingForRemove().subscribe({
      next: (data) => {
        this.rows = data ?? [];
        this.filteredRows = [...this.rows];
        this.initializeRowState();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.pageError = 'Failed to load approved removal queue.';
        this.loading = false;
      }
    });
  }

  initializeRowState(): void {
    const newState: Record<number, EditableRowState> = {};

    for (const row of this.rows) {
      newState[row.requestId] = {
        isEditing: false,
        status: row.status ?? 'Approved - Waiting for Remove',
        removedBy: row.removedBy ?? '',
        removedDate: this.toInputDate(row.removedDate),
        selectedFile: null,
        isSaving: false,
        isUploading: false,
        error: '',
        success: ''
      };
    }

    this.rowState = newState;
  }

  applyFilter(): void {
    const term = this.globalSearch.trim().toLowerCase();

    if (!term) {
      this.filteredRows = [...this.rows];
      return;
    }

    this.filteredRows = this.rows.filter((row) => {
      return Object.values(row).some((value) =>
        String(value ?? '').toLowerCase().includes(term)
      );
    });
  }

  startEdit(row: MaterialRequestRow): void {
    const state = this.rowState[row.requestId];
    if (!state) {
      return;
    }

    state.isEditing = true;
    state.error = '';
    state.success = '';
    state.status = row.status ?? 'Approved - Waiting for Remove';
    state.removedBy = row.removedBy ?? '';
    state.removedDate = this.toInputDate(row.removedDate);
  }

  cancelEdit(row: MaterialRequestRow): void {
    const state = this.rowState[row.requestId];
    if (!state) {
      return;
    }

    state.isEditing = false;
    state.error = '';
    state.success = '';
    state.selectedFile = null;
    state.status = row.status ?? 'Approved - Waiting for Remove';
    state.removedBy = row.removedBy ?? '';
    state.removedDate = this.toInputDate(row.removedDate);
  }

  saveRow(row: MaterialRequestRow): void {
    const state = this.rowState[row.requestId];
    if (!state) {
      return;
    }

    state.error = '';
    state.success = '';

    if (state.status === 'Removed') {
      if (!state.removedBy?.trim()) {
        state.error = 'Removed By is required when status is Removed.';
        return;
      }

      if (!state.removedDate?.trim()) {
        state.error = 'Removed Date is required when status is Removed.';
        return;
      }
    }

    const payload: UpdateRemovalRequest = {
      requestId: row.requestId,
      status: state.status,
      removedBy: state.removedBy?.trim() || null,
      removedDate: state.removedDate || null
    };

    state.isSaving = true;

    this.materialRequestService.updateRemoval(payload).subscribe({
      next: (updatedRow) => {
        const idx = this.rows.findIndex((x) => x.requestId === row.requestId);
        if (idx >= 0) {
          this.rows[idx] = { ...this.rows[idx], ...updatedRow };
        }

        const filteredIdx = this.filteredRows.findIndex((x) => x.requestId === row.requestId);
        if (filteredIdx >= 0) {
          this.filteredRows[filteredIdx] = { ...this.filteredRows[filteredIdx], ...updatedRow };
        }

        state.isSaving = false;
        state.isEditing = false;
        state.success = 'Saved successfully.';
      },
      error: (err) => {
        console.error(err);
        state.isSaving = false;
        state.error = 'Failed to save row.';
      }
    });
  }

  onFileSelected(event: Event, row: MaterialRequestRow): void {
    const input = event.target as HTMLInputElement;
    const state = this.rowState[row.requestId];

    if (!input.files || input.files.length === 0 || !state) {
      return;
    }

    state.selectedFile = input.files[0];
    state.error = '';
    state.success = '';
  }

  uploadFile(row: MaterialRequestRow): void {
    const state = this.rowState[row.requestId];
    if (!state?.selectedFile) {
      state.error = 'Please choose a file first.';
      return;
    }

    state.isUploading = true;
    state.error = '';
    state.success = '';

    this.materialRequestService.uploadAttachment(row.requestId, state.selectedFile).subscribe({
      next: (resp) => {
        row.fileName = resp.fileName ?? state.selectedFile?.name ?? null;
        row.filePath = resp.filePath ?? null;

        state.isUploading = false;
        state.selectedFile = null;
        state.success = 'File uploaded successfully.';
      },
      error: (err) => {
        console.error(err);
        state.isUploading = false;
        state.error = 'Failed to upload file.';
      }
    });
  }

  trackByRequestId(_: number, row: MaterialRequestRow): number {
    return row.requestId;
  }

  getVisibleColumns(row: MaterialRequestRow): string[] {
    return Object.keys(row);
  }

  private toInputDate(value?: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}

---------------------------
<div class="page-shell">
  <div class="page-header">
    <div>
      <h1>Approved Removal Queue</h1>
      <p>Requests approved and waiting for removal processing.</p>
    </div>

    <div class="header-actions">
      <input
        type="text"
        placeholder="Search all columns..."
        [(ngModel)]="globalSearch"
        (input)="applyFilter()"
        class="search-input"
      />
      <button type="button" class="btn btn-secondary" (click)="loadQueue()">
        Refresh
      </button>
    </div>
  </div>

  <div *ngIf="loading" class="state-box">Loading queue...</div>
  <div *ngIf="pageError" class="state-box error">{{ pageError }}</div>

  <div *ngIf="!loading && !pageError" class="table-card">
    <div class="table-wrapper">
      <table class="queue-table">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Status</th>
            <th>Hull</th>
            <th>RIC</th>
            <th>NIIN</th>
            <th>QTY</th>
            <th>Submitted By</th>
            <th>Submitted Date</th>
            <th>Approved By</th>
            <th>Approved Date</th>
            <th>Removed By</th>
            <th>Removed Date</th>
            <th>File</th>
            <th>Upload</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr *ngFor="let row of filteredRows; trackBy: trackByRequestId">
            <td>{{ row.requestId }}</td>

            <td>
              <ng-container *ngIf="rowState[row.requestId]?.isEditing; else statusRead">
                <select [(ngModel)]="rowState[row.requestId].status">
                  <option *ngFor="let status of statusOptions" [value]="status">
                    {{ status }}
                  </option>
                </select>
              </ng-container>
              <ng-template #statusRead>
                <span class="badge">{{ row.status }}</span>
              </ng-template>
            </td>

            <td>{{ row.hull }}</td>
            <td>{{ row.ric }}</td>
            <td>{{ row.niin }}</td>
            <td>{{ row.qty }}</td>
            <td>{{ row.submittedBy }}</td>
            <td>{{ row.submittedDate | date: 'short' }}</td>
            <td>{{ row.approvedBy }}</td>
            <td>{{ row.approvedDate | date: 'short' }}</td>

            <td>
              <ng-container *ngIf="rowState[row.requestId]?.isEditing; else removedByRead">
                <input
                  type="text"
                  [(ngModel)]="rowState[row.requestId].removedBy"
                  placeholder="Removed By"
                />
              </ng-container>
              <ng-template #removedByRead>
                {{ row.removedBy || '-' }}
              </ng-template>
            </td>

            <td>
              <ng-container *ngIf="rowState[row.requestId]?.isEditing; else removedDateRead">
                <input
                  type="date"
                  [(ngModel)]="rowState[row.requestId].removedDate"
                />
              </ng-container>
              <ng-template #removedDateRead>
                {{ row.removedDate ? (row.removedDate | date: 'shortDate') : '-' }}
              </ng-template>
            </td>

            <td>
              <span *ngIf="row.fileName; else noFile">{{ row.fileName }}</span>
              <ng-template #noFile>-</ng-template>
            </td>

            <td>
              <div class="upload-cell">
                <input
                  type="file"
                  (change)="onFileSelected($event, row)"
                  [disabled]="rowState[row.requestId]?.isUploading"
                />
                <button
                  type="button"
                  class="btn btn-secondary btn-small"
                  (click)="uploadFile(row)"
                  [disabled]="rowState[row.requestId]?.isUploading"
                >
                  {{ rowState[row.requestId]?.isUploading ? 'Uploading...' : 'Upload' }}
                </button>
              </div>
            </td>

            <td>
              <div class="action-buttons">
                <ng-container *ngIf="!rowState[row.requestId]?.isEditing">
                  <button
                    type="button"
                    class="btn btn-primary btn-small"
                    (click)="startEdit(row)"
                  >
                    Edit
                  </button>
                </ng-container>

                <ng-container *ngIf="rowState[row.requestId]?.isEditing">
                  <button
                    type="button"
                    class="btn btn-success btn-small"
                    (click)="saveRow(row)"
                    [disabled]="rowState[row.requestId]?.isSaving"
                  >
                    {{ rowState[row.requestId]?.isSaving ? 'Saving...' : 'Save' }}
                  </button>

                  <button
                    type="button"
                    class="btn btn-secondary btn-small"
                    (click)="cancelEdit(row)"
                  >
                    Cancel
                  </button>
                </ng-container>
              </div>

              <div *ngIf="rowState[row.requestId]?.error" class="row-message error">
                {{ rowState[row.requestId].error }}
              </div>

              <div *ngIf="rowState[row.requestId]?.success" class="row-message success">
                {{ rowState[row.requestId].success }}
              </div>
            </td>
          </tr>

          <tr *ngIf="filteredRows.length === 0">
            <td colspan="15" class="empty-state">
              No approved removal requests found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

---------------
:host {
  display: block;
  padding: 20px;
  background: #f5f7fb;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

.page-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 26px;
}

.page-header p {
  margin: 4px 0 0;
  color: #666;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  min-width: 280px;
  padding: 9px 12px;
  border: 1px solid #cfd6e4;
  border-radius: 6px;
  background: #fff;
}

.table-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(18, 38, 63, 0.08);
  overflow: hidden;
}

.table-wrapper {
  overflow: auto;
}

.queue-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1500px;
}

.queue-table th,
.queue-table td {
  padding: 12px;
  border-bottom: 1px solid #e8edf5;
  vertical-align: top;
  text-align: left;
  font-size: 14px;
}

.queue-table thead th {
  position: sticky;
  top: 0;
  background: #f0f4fa;
  z-index: 1;
  font-weight: 700;
  white-space: nowrap;
}

.queue-table tbody tr:hover {
  background: #fafcff;
}

.badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  background: #e7f0ff;
  color: #1e4fa8;
  font-weight: 600;
  font-size: 12px;
}

.btn {
  border: none;
  border-radius: 6px;
  padding: 9px 14px;
  cursor: pointer;
  font-weight: 600;
}

.btn-small {
  padding: 7px 10px;
  font-size: 12px;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-success {
  background: #16a34a;
  color: #fff;
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

input[type="text"],
input[type="date"],
select {
  width: 100%;
  min-width: 120px;
  padding: 8px 10px;
  border: 1px solid #cfd6e4;
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
}

.upload-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.row-message {
  margin-top: 8px;
  font-size: 12px;
}

.row-message.error,
.state-box.error {
  color: #b42318;
}

.row-message.success {
  color: #067647;
}

.state-box {
  padding: 14px 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(18, 38, 63, 0.06);
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 24px !important;
}