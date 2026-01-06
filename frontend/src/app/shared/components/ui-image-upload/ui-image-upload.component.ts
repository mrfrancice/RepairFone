import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UploadedImage {
  file: File;
  preview: string;
  progress?: number;
  error?: string;
  url?: string;
}

@Component({
  selector: 'ui-image-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="upload-container" [class.has-error]="error">
      @if (label) {
        <label class="upload-label">
          {{ label }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }

      <!-- Single Image Upload (Avatar style) -->
      @if (mode === 'avatar') {
        <div class="avatar-upload">
          <div
            class="avatar-preview"
            [class.has-image]="currentImage() || previewUrl"
            (click)="triggerFileInput()"
          >
            @if (currentImage()?.preview || previewUrl) {
              <img [src]="currentImage()?.preview || previewUrl" alt="Avatar" />
            } @else {
              <span class="avatar-placeholder">{{ placeholderInitials }}</span>
            }
            <div class="avatar-overlay">
              <span class="camera-icon">+</span>
            </div>
          </div>
          <button type="button" class="change-btn" (click)="triggerFileInput()">
            {{ currentImage() || previewUrl ? 'Changer la photo' : 'Ajouter une photo' }}
          </button>
        </div>
      }

      <!-- Multiple Images Upload (Gallery style) -->
      @if (mode === 'gallery') {
        <div class="gallery-upload">
          <div class="images-grid">
            @for (image of images(); track image.preview; let i = $index) {
              <div class="image-item">
                <img [src]="image.preview" alt="Image {{ i + 1 }}" />
                @if (image.progress !== undefined && image.progress < 100) {
                  <div class="upload-progress">
                    <div class="progress-bar" [style.width.%]="image.progress"></div>
                  </div>
                }
                @if (image.error) {
                  <div class="image-error">!</div>
                }
                <button
                  type="button"
                  class="remove-btn"
                  (click)="removeImage(i)"
                  [disabled]="disabled"
                >
                  &times;
                </button>
              </div>
            }

            @if (images().length < maxFiles) {
              <div
                class="add-image-btn"
                [class.dragover]="isDragOver()"
                (click)="triggerFileInput()"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
              >
                <span class="add-icon">+</span>
                <span class="add-text">Ajouter</span>
              </div>
            }
          </div>

          @if (hint) {
            <p class="upload-hint">{{ hint }}</p>
          }
        </div>
      }

      <!-- Dropzone style -->
      @if (mode === 'dropzone') {
        <div
          class="dropzone"
          [class.dragover]="isDragOver()"
          [class.has-files]="images().length > 0"
          (click)="triggerFileInput()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          @if (images().length === 0) {
            <div class="dropzone-content">
              <span class="upload-icon">+</span>
              <p class="dropzone-text">
                Cliquez ou glissez vos fichiers ici
              </p>
              <p class="dropzone-hint">{{ hint || 'PNG, JPG jusqu\'a ' + maxSizeMB + 'MB' }}</p>
            </div>
          } @else {
            <div class="dropzone-files">
              @for (image of images(); track image.preview; let i = $index) {
                <div class="file-item">
                  <img [src]="image.preview" alt="Preview" class="file-thumbnail" />
                  <span class="file-name">{{ image.file.name }}</span>
                  <button
                    type="button"
                    class="file-remove"
                    (click)="removeImage(i); $event.stopPropagation()"
                  >
                    &times;
                  </button>
                </div>
              }
              @if (images().length < maxFiles) {
                <p class="add-more">+ Ajouter d'autres fichiers</p>
              }
            </div>
          }
        </div>
      }

      <input
        #fileInput
        type="file"
        [accept]="accept"
        [multiple]="multiple && mode !== 'avatar'"
        (change)="onFileSelected($event)"
        hidden
      />

      @if (error) {
        <span class="error-message">{{ error }}</span>
      }
    </div>
  `,
  styles: [`
    .upload-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .upload-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .required {
      color: #dc2626;
      margin-left: 0.125rem;
    }

    /* Avatar Mode */
    .avatar-upload {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar-preview {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      border: 3px solid #e5e7eb;
      transition: border-color 0.2s;
    }

    .avatar-preview:hover {
      border-color: #2563eb;
    }

    .avatar-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      font-size: 2rem;
      font-weight: 600;
      color: #9ca3af;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .avatar-preview:hover .avatar-overlay {
      opacity: 1;
    }

    .camera-icon {
      color: white;
      font-size: 1.5rem;
    }

    .change-btn {
      background: none;
      border: none;
      color: #2563eb;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.25rem;
    }

    .change-btn:hover {
      text-decoration: underline;
    }

    /* Gallery Mode */
    .gallery-upload {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.75rem;
    }

    .image-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      background: #f3f4f6;
    }

    .image-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .upload-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
    }

    .progress-bar {
      height: 100%;
      background: #2563eb;
      transition: width 0.3s;
    }

    .image-error {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      background: #dc2626;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: bold;
    }

    .remove-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .image-item:hover .remove-btn {
      opacity: 1;
    }

    .remove-btn:disabled {
      cursor: not-allowed;
    }

    .add-image-btn {
      aspect-ratio: 1;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      cursor: pointer;
      transition: all 0.2s;
      background: #fafafa;
    }

    .add-image-btn:hover,
    .add-image-btn.dragover {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .add-icon {
      font-size: 1.5rem;
      color: #9ca3af;
    }

    .add-text {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .upload-hint {
      font-size: 0.75rem;
      color: #6b7280;
      margin: 0;
    }

    /* Dropzone Mode */
    .dropzone {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: #fafafa;
    }

    .dropzone:hover,
    .dropzone.dragover {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .dropzone.has-files {
      padding: 1rem;
    }

    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .upload-icon {
      font-size: 2.5rem;
      color: #9ca3af;
    }

    .dropzone-text {
      font-weight: 500;
      color: #374151;
      margin: 0;
    }

    .dropzone-hint {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    .dropzone-files {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .file-thumbnail {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
    }

    .file-name {
      flex: 1;
      text-align: left;
      font-size: 0.875rem;
      color: #374151;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-remove {
      background: none;
      border: none;
      color: #6b7280;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
    }

    .file-remove:hover {
      color: #dc2626;
    }

    .add-more {
      color: #2563eb;
      font-size: 0.875rem;
      margin: 0.5rem 0 0;
    }

    /* Error State */
    .has-error .dropzone,
    .has-error .add-image-btn {
      border-color: #dc2626;
    }

    .error-message {
      font-size: 0.75rem;
      color: #dc2626;
    }
  `]
})
export class UiImageUploadComponent {
  @Input() label?: string;
  @Input() mode: 'avatar' | 'gallery' | 'dropzone' = 'dropzone';
  @Input() accept = 'image/*';
  @Input() multiple = true;
  @Input() maxFiles = 5;
  @Input() maxSizeMB = 5;
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint?: string;
  @Input() error?: string;
  @Input() previewUrl?: string;
  @Input() placeholderInitials = '?';

  @Output() filesChange = new EventEmitter<UploadedImage[]>();
  @Output() fileSelect = new EventEmitter<File>();
  @Output() fileRemove = new EventEmitter<number>();

  readonly images = signal<UploadedImage[]>([]);
  readonly currentImage = signal<UploadedImage | null>(null);
  readonly isDragOver = signal(false);

  private fileInput?: HTMLInputElement;

  triggerFileInput(): void {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input && !this.disabled) {
      input.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.processFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.disabled) return;

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.processFiles(Array.from(files));
    }
  }

  private processFiles(files: File[]): void {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > this.maxSizeMB * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (this.mode === 'avatar') {
      const file = validFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const uploadedImage: UploadedImage = {
            file,
            preview: e.target?.result as string
          };
          this.currentImage.set(uploadedImage);
          this.fileSelect.emit(file);
          this.filesChange.emit([uploadedImage]);
        };
        reader.readAsDataURL(file);
      }
    } else {
      const currentImages = this.images();
      const remainingSlots = this.maxFiles - currentImages.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      filesToAdd.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const uploadedImage: UploadedImage = {
            file,
            preview: e.target?.result as string
          };
          this.images.update(imgs => [...imgs, uploadedImage]);
          this.fileSelect.emit(file);
          this.filesChange.emit(this.images());
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    if (this.disabled) return;

    this.images.update(imgs => imgs.filter((_, i) => i !== index));
    this.fileRemove.emit(index);
    this.filesChange.emit(this.images());
  }

  updateProgress(index: number, progress: number): void {
    this.images.update(imgs =>
      imgs.map((img, i) => i === index ? { ...img, progress } : img)
    );
  }

  setError(index: number, error: string): void {
    this.images.update(imgs =>
      imgs.map((img, i) => i === index ? { ...img, error } : img)
    );
  }

  setUrl(index: number, url: string): void {
    this.images.update(imgs =>
      imgs.map((img, i) => i === index ? { ...img, url } : img)
    );
  }

  clearAll(): void {
    if (this.mode === 'avatar') {
      this.currentImage.set(null);
    } else {
      this.images.set([]);
    }
    this.filesChange.emit([]);
  }
}
