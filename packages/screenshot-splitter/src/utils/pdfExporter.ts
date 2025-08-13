import jsPDF from 'jspdf';
import type { ImageSlice } from '../types';

/**
 * PDF导出配置选项
 */
export interface PDFExportOptions {
  /** 页面方向 */
  orientation?: 'portrait' | 'landscape';
  /** 页面格式 */
  format?: 'a4' | 'a3' | 'letter';
  /** 图片质量 (0-1) */
  quality?: number;
  /** 页边距 (mm) */
  margin?: number;
  /** 是否自动调整图片大小 */
  autoResize?: boolean;
  /** 每页最大图片数量 */
  imagesPerPage?: number;
}

/**
 * 默认PDF导出配置
 */
const DEFAULT_OPTIONS: Required<PDFExportOptions> = {
  orientation: 'portrait',
  format: 'a4',
  quality: 0.8,
  margin: 10,
  autoResize: true,
  imagesPerPage: 1,
};

/**
 * PDF导出器类
 */
export class PDFExporter {
  private options: Required<PDFExportOptions>;
  
  constructor(options: PDFExportOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * 导出图片切片为PDF
   * @param imageSlices 图片切片数组
   * @param selectedIndices 选中的切片索引
   * @param fileName 文件名
   * @param onProgress 进度回调
   */
  async exportToPDF(
    imageSlices: ImageSlice[],
    selectedIndices: Set<number>,
    fileName: string = 'exported-images',
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      // 过滤选中的切片
      const selectedSlices = imageSlices.filter(slice => 
        selectedIndices.has(slice.index)
      ).sort((a, b) => a.index - b.index);
      
      if (selectedSlices.length === 0) {
        throw new Error('没有选中的图片切片');
      }
      
      // 创建PDF文档
      const pdf = new jsPDF({
        orientation: this.options.orientation,
        unit: 'mm',
        format: this.options.format,
      });
      
      // 获取页面尺寸
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (this.options.margin * 2);
      const contentHeight = pageHeight - (this.options.margin * 2);
      
      let imagesOnCurrentPage = 0;
      
      for (let i = 0; i < selectedSlices.length; i++) {
        const slice = selectedSlices[i];
        
        // 如果需要新页面
        if (imagesOnCurrentPage >= this.options.imagesPerPage) {
          pdf.addPage();
          imagesOnCurrentPage = 0;
        }
        
        // 如果是第一张图片，不需要添加页面
        if (i === 0) {
          // 第一页已经存在
        }
        
        try {
          // 将Blob转换为base64
          const imageData = await this.blobToBase64(slice.blob);
          
          // 计算图片尺寸
          const { width, height } = this.calculateImageSize(
            slice.width,
            slice.height,
            contentWidth,
            contentHeight
          );
          
          // 计算图片位置（居中）
          const x = this.options.margin + (contentWidth - width) / 2;
          const y = this.options.margin + (imagesOnCurrentPage * (contentHeight / this.options.imagesPerPage));
          
          // 添加图片到PDF
          pdf.addImage(
            imageData,
            'JPEG',
            x,
            y,
            width,
            height,
            undefined,
            'FAST'
          );
          
          imagesOnCurrentPage++;
          
          // 更新进度
          if (onProgress) {
            const progress = Math.round(((i + 1) / selectedSlices.length) * 100);
            onProgress(progress);
          }
          
        } catch (error) {
          console.warn(`处理图片切片 ${slice.index} 时出错:`, error);
          continue;
        }
      }
      
      // 保存PDF
      const pdfFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      pdf.save(pdfFileName);
      
      console.log(`PDF导出完成: ${pdfFileName}`);
      
    } catch (error) {
      console.error('PDF导出失败:', error);
      throw error;
    }
  }
  
  /**
   * 将Blob转换为base64字符串
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  /**
   * 计算图片在PDF中的尺寸
   */
  private calculateImageSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    if (!this.options.autoResize) {
      return { width: originalWidth, height: originalHeight };
    }
    
    const aspectRatio = originalWidth / originalHeight;
    
    let width = maxWidth;
    let height = width / aspectRatio;
    
    // 如果高度超出限制，按高度缩放
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width, height };
  }
  
  /**
   * 更新导出选项
   */
  updateOptions(options: Partial<PDFExportOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * 获取当前配置
   */
  getOptions(): Required<PDFExportOptions> {
    return { ...this.options };
  }
}

/**
 * 创建默认PDF导出器实例
 */
export const createPDFExporter = (options?: PDFExportOptions) => {
  return new PDFExporter(options);
};

/**
 * 快速导出PDF（使用默认配置）
 */
export const exportToPDF = async (
  imageSlices: ImageSlice[],
  selectedIndices: Set<number>,
  fileName?: string,
  onProgress?: (progress: number) => void
) => {
  const exporter = createPDFExporter();
  return exporter.exportToPDF(imageSlices, selectedIndices, fileName, onProgress);
};