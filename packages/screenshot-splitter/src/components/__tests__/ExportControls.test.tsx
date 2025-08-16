import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ExportControls } from '../ExportControls';

// Mock image slice data
const mockSlices = [
  {
    blob: new Blob(['test1'], { type: 'image/png' }),
    url: 'blob:test1',
    index: 0,
    width: 100,
    height: 100,
  },
  {
    blob: new Blob(['test2'], { type: 'image/png' }),
    url: 'blob:test2',
    index: 1,
    width: 100,
    height: 100,
  },
];

describe('ExportControls', () => {
  const mockOnExport = vi.fn();

  beforeEach(() => {
    mockOnExport.mockClear();
  });

  const defaultProps = {
    selectedSlices: [0, 1],
    slices: mockSlices,
    onExport: mockOnExport,
    disabled: false,
  };

  it('renders export controls with format options', () => {
    render(<ExportControls {...defaultProps} />);
    
    expect(screen.getByText('导出设置')).toBeInTheDocument();
    expect(screen.getByText('📄 PDF文档')).toBeInTheDocument();
    expect(screen.getByText('📦 ZIP压缩包')).toBeInTheDocument();
  });

  it('defaults to PDF format', () => {
    render(<ExportControls {...defaultProps} />);
    
    const pdfRadio = screen.getByDisplayValue('pdf');
    const zipRadio = screen.getByDisplayValue('zip');
    
    expect(pdfRadio).toBeChecked();
    expect(zipRadio).not.toBeChecked();
  });

  it('can switch from PDF to ZIP format', async () => {
    render(<ExportControls {...defaultProps} />);
    
    const pdfRadio = screen.getByDisplayValue('pdf');
    const zipRadio = screen.getByDisplayValue('zip');
    
    // Initially PDF should be selected
    expect(pdfRadio).toBeChecked();
    expect(zipRadio).not.toBeChecked();
    
    // Click ZIP radio button
    fireEvent.click(zipRadio);
    
    await waitFor(() => {
      expect(zipRadio).toBeChecked();
      expect(pdfRadio).not.toBeChecked();
    });
  });

  it('can switch from ZIP back to PDF format', async () => {
    render(<ExportControls {...defaultProps} />);
    
    const pdfRadio = screen.getByDisplayValue('pdf');
    const zipRadio = screen.getByDisplayValue('zip');
    
    // First switch to ZIP
    fireEvent.click(zipRadio);
    await waitFor(() => {
      expect(zipRadio).toBeChecked();
    });
    
    // Then switch back to PDF
    fireEvent.click(pdfRadio);
    await waitFor(() => {
      expect(pdfRadio).toBeChecked();
      expect(zipRadio).not.toBeChecked();
    });
  });

  it('calls onExport with correct format when PDF is selected', async () => {
    render(<ExportControls {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /导出为 PDF/i });
    
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith('pdf', expect.any(Object));
    });
  });

  it('calls onExport with correct format when ZIP is selected', async () => {
    render(<ExportControls {...defaultProps} />);
    
    const zipRadio = screen.getByDisplayValue('zip');
    fireEvent.click(zipRadio);
    
    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /导出为 ZIP/i });
      fireEvent.click(exportButton);
    });
    
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith('zip', expect.any(Object));
    });
  });

  it('maintains format selection state correctly', async () => {
    render(<ExportControls {...defaultProps} />);
    
    const pdfRadio = screen.getByDisplayValue('pdf');
    const zipRadio = screen.getByDisplayValue('zip');
    
    // Test multiple switches
    fireEvent.click(zipRadio);
    await waitFor(() => expect(zipRadio).toBeChecked());
    
    fireEvent.click(pdfRadio);
    await waitFor(() => expect(pdfRadio).toBeChecked());
    
    fireEvent.click(zipRadio);
    await waitFor(() => expect(zipRadio).toBeChecked());
    
    fireEvent.click(pdfRadio);
    await waitFor(() => expect(pdfRadio).toBeChecked());
  });

  it('disables format selection when disabled prop is true', () => {
    render(<ExportControls {...defaultProps} disabled={true} />);
    
    const pdfRadio = screen.getByDisplayValue('pdf');
    const zipRadio = screen.getByDisplayValue('zip');
    
    expect(pdfRadio).toBeDisabled();
    expect(zipRadio).toBeDisabled();
  });

  it('shows correct export button text based on selected format', async () => {
    render(<ExportControls {...defaultProps} />);
    
    // Initially should show PDF
    expect(screen.getByRole('button', { name: /导出为 PDF/i })).toBeInTheDocument();
    
    // Switch to ZIP
    const zipRadio = screen.getByDisplayValue('zip');
    fireEvent.click(zipRadio);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /导出为 ZIP/i })).toBeInTheDocument();
    });
  });

  it('shows loading state during export', async () => {
    const slowOnExport = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ExportControls {...defaultProps} onExport={slowOnExport} />);
    
    const exportButton = screen.getByRole('button', { name: /导出为 PDF/i });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('正在导出...')).toBeInTheDocument();
    });
  });

  it('prevents export when no slices are selected', () => {
    render(<ExportControls {...defaultProps} selectedSlices={[]} />);
    
    const exportButton = screen.getByRole('button');
    expect(exportButton).toBeDisabled();
    expect(screen.getByText('请先选择要导出的切片')).toBeInTheDocument();
  });
});