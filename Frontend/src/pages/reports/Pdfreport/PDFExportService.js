import jsPDF from 'jspdf';
import 'jspdf-autotable';

class PDFExportService {
  constructor() {
    this.primaryColor = [59, 130, 246]; // Blue
    this.secondaryColor = [139, 92, 246]; // Purple
    this.accentColor = [34, 197, 94]; // Green
    this.warningColor = [245, 158, 11]; // Orange
    this.dangerColor = [239, 68, 68]; // Red
    this.grayColor = [107, 114, 128]; // Gray
    this.lightGray = [248, 250, 252]; // Light Gray
  }

  exportResponseReport(filteredResponses, forms, filters = {}) {
    try {
      console.log('Starting PDF export with:', filteredResponses.length, 'responses');
      
      if (!filteredResponses || filteredResponses.length === 0) {
        throw new Error('No data to export');
      }

      const pdfData = this.transformDataForPDF(filteredResponses, forms);
      const doc = this.generateStylishReport(pdfData, filters);
      const fileName = `Response_Analytics_Report_${this.getTimestamp()}.pdf`;
      
      doc.save(fileName);
      return { success: true, fileName };
    } catch (error) {
      console.error('PDF Export Service Error:', error);
      throw error;
    }
  }

  transformDataForPDF(responses, forms) {
    return responses.map((response, index) => {
      try {
        const form = forms.find(f => f._id === response.form);
        const formFields = form?.schemaJson?.filter(f => 
          f && f.type && f.type !== 'folderName' && f.type !== 'heading'
        ) || [];
        
        const answeredFields = formFields.filter(field => {
          if (!field.id || !response.answers) return false;
          const answer = response.answers[field.id];
          return answer && answer.toString().trim() !== '';
        }).length;

        return {
          id: index + 1,
          formName: this.getFormLabel(response.form, forms),
          submitterName: response.submitterName || 'Anonymous',
          submitterEmail: response.submitterEmail || 'N/A',
          status: this.getSubmissionStatus(response, form),
          submittedDate: this.formatDate(response.submittedAt),
          totalFields: formFields.length,
          answeredFields: answeredFields,
          completionRate: formFields.length > 0 ? Math.round((answeredFields / formFields.length) * 100) : 100
        };
      } catch (error) {
        console.warn(`Error processing response ${index}:`, error);
        return null;
      }
    }).filter(item => item !== null);
  }

  generateStylishReport(data, filters = {}) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    let currentY = 0;
    
    // Header
    currentY = this.addHeader(doc, pageWidth, data.length);
    
    // Filter info
    currentY = this.addFilterInfo(doc, filters, pageWidth, currentY);
    
    // Summary cards
    currentY = this.addSummaryCards(doc, data, pageWidth, currentY);
    
    // Response cards
    this.addResponseCards(doc, data, pageWidth, currentY, pageHeight);
    
    return doc;
  }

  addHeader(doc, pageWidth, totalRecords) {
    // Clean header background
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Response Report', pageWidth / 2, 15, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Analysis of ${totalRecords} Form Submissions`, pageWidth / 2, 25, { align: 'center' });
    
    // Date
    doc.setFontSize(9);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generated: ${currentDate}`, pageWidth / 2, 33, { align: 'center' });
    
    return 50;
  }

  addFilterInfo(doc, filters, pageWidth, startY) {
    const hasFilters = filters.selectedForm !== 'all' || 
                      filters.statusFilter !== 'all' || 
                      filters.startDate || 
                      filters.endDate || 
                      filters.searchTerm;
    
    if (!hasFilters) return startY + 5;
    
    let yPos = startY;
    
    // Filter background
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 20, 'F');
    
    // Filter title
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Applied Filters:', 20, yPos + 8);
    
    // Filter items
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const filterItems = [];
    if (filters.selectedForm !== 'all' && filters.formName) {
      filterItems.push(`Form: ${filters.formName}`);
    }
    if (filters.statusFilter !== 'all') {
      filterItems.push(`Status: ${filters.statusFilter}`);
    }
    if (filters.startDate && filters.endDate) {
      filterItems.push(`Period: ${filters.startDate} - ${filters.endDate}`);
    }
    if (filters.searchTerm) {
      filterItems.push(`Search: "${filters.searchTerm}"`);
    }
    
    const filterText = filterItems.join(' | ');
    doc.text(filterText, 20, yPos + 14);
    
    return yPos + 25;
  }

  addSummaryCards(doc, data, pageWidth, startY) {
    const stats = this.calculateStats(data);
    const cardWidth = 40;
    const cardHeight = 25;
    const spacing = 8;
    const totalWidth = 4 * cardWidth + 3 * spacing;
    const startX = (pageWidth - totalWidth) / 2;
    
    const cards = [
      { title: 'Total', value: data.length, color: [59, 130, 246] },
      { title: 'Complete', value: stats.complete, color: [34, 197, 94] },
      { title: 'Partial', value: stats.partial, color: [245, 158, 11] },
      { title: 'Incomplete', value: stats.incomplete, color: [239, 68, 68] }
    ];
    
    cards.forEach((card, index) => {
      const x = startX + (cardWidth + spacing) * index;
      const y = startY;
      
      // Card background
      doc.setFillColor(...card.color);
      doc.rect(x, y, cardWidth, cardHeight, 'F');
      
      // Card content
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value.toString(), x + cardWidth/2, y + 12, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(card.title, x + cardWidth/2, y + 20, { align: 'center' });
    });
    
    return startY + cardHeight + 15;
  }

  addResponseCards(doc, data, pageWidth, startY, pageHeight) {
    let currentY = startY;
    const cardWidth = pageWidth - 30;
    const cardHeight = 35;
    const cardSpacing = 8;
    let pageNumber = 1;
    
    // Section title
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Individual Response Details', 15, currentY);
    currentY += 12;
    
    data.forEach((response, index) => {
      // Check if we need a new page
      if (currentY + cardHeight > pageHeight - 25) {
        this.addFooter(doc, pageWidth, pageHeight, pageNumber);
        doc.addPage();
        pageNumber++;
        currentY = 20;
      }
      
      this.drawCleanResponseCard(doc, response, 15, currentY, cardWidth, cardHeight);
      currentY += cardHeight + cardSpacing;
    });
    
    // Add footer to last page
    this.addFooter(doc, pageWidth, pageHeight, pageNumber);
  }

  drawCleanResponseCard(doc, response, x, y, width, height) {
    // Card border
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.rect(x, y, width, height);
    
    // Status indicator strip
    const statusColor = this.getStatusColor(response.status);
    doc.setFillColor(...statusColor);
    doc.rect(x, y, 4, height, 'F');
    
    // Card content
    const contentX = x + 10;
    let contentY = y + 8;
    
    // Response ID and Form Name
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${response.id} - ${response.formName}`, contentX, contentY);
    
    // Submitter info
    contentY += 8;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${response.submitterName}`, contentX, contentY);
    doc.text(`Email: ${response.submitterEmail}`, contentX + 80, contentY);
    
    // Status badge
    this.drawStatusBadge(doc, response.status, x + width - 45, y + 5);
    
    // Date and progress
    contentY += 8;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Submitted: ${response.submittedDate}`, contentX, contentY);
    
    contentY += 6;
    doc.text(`Progress: ${response.answeredFields}/${response.totalFields} fields completed (${response.completionRate}%)`, contentX, contentY);
    
    // Progress bar
    this.drawProgressBar(doc, response.completionRate, contentX, contentY + 3, 100, 3);
  }

  drawStatusBadge(doc, status, x, y) {
    const statusConfig = {
      'complete': { color: [34, 197, 94], text: 'Complete' },
      'partial': { color: [245, 158, 11], text: 'Partial' },
      'incomplete': { color: [239, 68, 68], text: 'Incomplete' },
      'unknown': { color: [107, 114, 128], text: 'Unknown' }
    };
    
    const config = statusConfig[status] || statusConfig.unknown;
    
    // Badge background
    doc.setFillColor(...config.color);
    doc.rect(x, y, 35, 10, 'F');
    
    // Badge text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(config.text, x + 17.5, y + 7, { align: 'center' });
  }

  drawProgressBar(doc, percentage, x, y, width, height) {
    // Background
    doc.setFillColor(230, 230, 230);
    doc.rect(x, y, width, height, 'F');
    
    // Progress fill
    if (percentage > 0) {
      const fillWidth = (width * percentage) / 100;
      const color = percentage === 100 ? [34, 197, 94] : 
                   percentage >= 50 ? [245, 158, 11] : [239, 68, 68];
      
      doc.setFillColor(...color);
      doc.rect(x, y, fillWidth, height, 'F');
    }
  }

  addFooter(doc, pageWidth, pageHeight, pageNumber) {
    const footerY = pageHeight - 15;
    
    // Footer background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, footerY - 5, pageWidth, 20, 'F');
    
    // Footer content
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Smartfactory worx System', 15, footerY);
    doc.text(`Page ${pageNumber}`, pageWidth - 15, footerY, { align: 'right' });
    
    // Company info
    doc.setFontSize(7);
    doc.text('smartfactoryworx.com | www.smartfactoryworx.com', pageWidth / 2, footerY + 5, { align: 'center' });
  }

  getStatusColor(status) {
    const colors = {
      'complete': [34, 197, 94],
      'partial': [245, 158, 11],
      'incomplete': [239, 68, 68],
      'unknown': [107, 114, 128]
    };
    return colors[status] || colors.unknown;
  }

  calculateStats(data) {
    return {
      complete: data.filter(item => item.status === 'complete').length,
      partial: data.filter(item => item.status === 'partial').length,
      incomplete: data.filter(item => item.status === 'incomplete').length
    };
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  getFormLabel(formId, forms) {
    try {
      const form = forms.find(f => f._id === formId);
      if (!form) return "Unknown";
      const folder = form.schemaJson?.find(e => e.type === "folderName")?.label;
      const heading = form.schemaJson?.find(e => e.type === "heading")?.label;
      return folder || heading || "Untitled Form";
    } catch (error) {
      return "Unknown";
    }
  }

  getSubmissionStatus(response, form) {
    try {
      if (!form || !form.schemaJson) return 'unknown';
      
      const formFields = form.schemaJson.filter(field => 
        field && field.type && field.type !== 'folderName' && field.type !== 'heading'
      );
      
      if (formFields.length === 0) return 'complete';
      
      const answeredFields = formFields.filter(field => {
        if (!field.id || !response.answers) return false;
        const answer = response.answers[field.id];
        return answer && answer.toString().trim() !== '';
      });
      
      const completionRate = answeredFields.length / formFields.length;
      
      if (completionRate === 1) return 'complete';
      if (completionRate >= 0.5) return 'partial';
      return 'incomplete';
    } catch (error) {
      return 'unknown';
    }
  }

  getTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }
}

export default new PDFExportService();
