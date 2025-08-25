import JSZip from 'jszip';
import type { ImageSlice } from '../types';

/**
 * ZIP导出配置选项
 */
export interface ZIPExportOptions {
  /** 压缩级别 (0-9) */
  compressionLevel?: number;
  /** 文件名格式 */
  fileNameFormat?: 'index' | 'sequence' | 'custom';
  /** 自定义文件名前缀 */
  fileNamePrefix?: string;
  /** 图片格式 */
  imageFormat?: 'original' | 'jpeg' | 'png';
  /** JPEG质量 (0-1) */
  jpegQuality?: number;
}

/**
 * 默认ZIP导出配置
 */
const DEFAULT_OPTIONS: Required<ZIPExportOptions> = {
  compressionLevel: 6,
  fileNameFormat: 'sequence',
  fileNamePrefix: 'slice',
  imageFormat: 'original',
  jpegQuality: 0.8,
};

/**
 * ZIP导出器类
 */
export class ZIPExporter {
  private options: Required<ZIPExportOptions>;

  constructor(options: ZIPExportOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 导出图片切片为ZIP
   */
  async exportToZIP(
    imageSlices: ImageSlice[],
    selectedIndices: Set<number>,
    fileName: string = 'exported-images',
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      const selectedSlices = imageSlices
        .filter(slice => selectedIndices.has(slice.index))
        .sort((a, b) => a.index - b.index);

      if (selectedSlices.length === 0) {
        throw new Error('没有选中的图片切片');
      }

      const zip = new JSZip();

      for (let i = 0; i < selectedSlices.length; i++) {
        const slice = selectedSlices[i];

        try {
          const imageFileName = this.generateFileName(slice, i);
          const processedBlob = await this.processImageFormat(slice.blob);
          zip.file(imageFileName, processedBlob);

          if (onProgress) {
            const progress = Math.round(((i + 1) / selectedSlices.length) * 80);
            onProgress(progress);
          }
        } catch (error) {
          console.warn(`处理图片切片 ${slice.index} 时出错:`, error);
          continue;
        }
      }

      if (onProgress) {
        onProgress(85);
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: this.options.compressionLevel,
        },
      });

      if (onProgress) {
        onProgress(95);
      }

      const zipFileName = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`;
      this.downloadBlob(zipBlob, zipFileName);

      if (onProgress) {
        onProgress(100);
      }

      console.log(`ZIP导出完成: ${zipFileName}`);
    } catch (error) {
      console.error('ZIP导出失败:', error);
      throw error;
    }
  }

  private generateFileName(slice: ImageSlice, sequenceIndex: number): string {
    const extension = this.getFileExtension(slice.blob.type);

    switch (this.options.fileNameFormat) {
      case 'index':
        return `${this.options.fileNamePrefix}_${slice.index}.${extension}`;
      case 'sequence':
        return `${this.options.fileNamePrefix}_${String(sequenceIndex + 1).padStart(3, '0')}.${extension}`;
      case 'custom':
        return `${this.options.fileNamePrefix}_${slice.index}_${sequenceIndex + 1}.${extension}`;
      default:
        return `${this.options.fileNamePrefix}_${sequenceIndex + 1}.${extension}`;
    }
  }

  private getFileExtension(mimeType: string): string {
    switch (this.options.imageFormat) {
      case 'jpeg':
        return 'jpg';
      case 'png':
        return 'png';
      case 'original':
      default:
        if (mimeType.includes('jpeg')) return 'jpg';
        if (mimeType.includes('png')) return 'png';
        if (mimeType.includes('gif')) return 'gif';
        if (mimeType.includes('webp')) return 'webp';
        return 'jpg';
    }
  }

  private async processImageFormat(blob: Blob): Promise<Blob> {
    if (this.options.imageFormat === 'original') {
      return blob;
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        if (ctx) {
          ctx.drawImage(img, 0, 0);

          const outputFormat = this.options.imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
          const quality =
            this.options.imageFormat === 'jpeg' ? this.options.jpegQuality : undefined;

          canvas.toBlob(
            convertedBlob => {
              if (convertedBlob) {
                resolve(convertedBlob);
              } else {
                reject(new Error('图片格式转换失败'));
              }
            },
            outputFormat,
            quality
          );
        } else {
          reject(new Error('无法获取Canvas上下文'));
        }

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('图片加载失败'));
      };

      img.src = URL.createObjectURL(blob);
    });
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  updateOptions(options: Partial<ZIPExportOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getOptions(): Required<ZIPExportOptions> {
    return { ...this.options };
  }
}

export const createZIPExporter = (options?: ZIPExportOptions) => {
  return new ZIPExporter(options);
};

export const exportToZIP = async (
  imageSlices: ImageSlice[],
  selectedIndices: Set<number>,
  fileName?: string,
  onProgress?: (progress: number) => void
) => {
  const exporter = createZIPExporter();
  return exporter.exportToZIP(imageSlices, selectedIndices, fileName, onProgress);
};
