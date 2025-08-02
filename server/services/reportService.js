const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Call = require('../models/Call');
const Report = require('../models/Report');
const moment = require('moment');

class ReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../reports');
    this.ensureReportsDirectory();
  }

  // Ensure reports directory exists
  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // Generate Excel report
  async generateExcelReport(reportType, filters = {}, userId = null) {
    try {
      let data = [];
      let filename = '';

      switch (reportType) {
        case 'leads':
          data = await this.getLeadsData(filters, userId);
          filename = `leads_report_${moment().format('YYYY-MM-DD_HH-mm')}.xlsx`;
          break;
        case 'calls':
          data = await this.getCallsData(filters, userId);
          filename = `calls_report_${moment().format('YYYY-MM-DD_HH-mm')}.xlsx`;
          break;
        case 'performance':
          data = await this.getPerformanceData(filters, userId);
          filename = `performance_report_${moment().format('YYYY-MM-DD_HH-mm')}.xlsx`;
          break;
        case 'meta_ads':
          data = await this.getMetaAdsData(filters);
          filename = `meta_ads_report_${moment().format('YYYY-MM-DD_HH-mm')}.xlsx`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      const workbook = XLSX.utils.book_new();
      
      // Add main data sheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      // Add summary sheet if available
      if (data.summary) {
        const summarySheet = XLSX.utils.json_to_sheet([data.summary]);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }

      const filePath = path.join(this.reportsDir, filename);
      XLSX.writeFile(workbook, filePath);

      return {
        success: true,
        filename: filename,
        filePath: filePath,
        downloadUrl: `/api/reports/download/${filename}`
      };

    } catch (error) {
      console.error('Excel report generation error:', error);
      throw error;
    }
  }

  // Generate PDF report
  async generatePDFReport(reportType, filters = {}, userId = null) {
    try {
      let data = [];
      let filename = '';

      switch (reportType) {
        case 'leads':
          data = await this.getLeadsData(filters, userId);
          filename = `leads_report_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;
          break;
        case 'calls':
          data = await this.getCallsData(filters, userId);
          filename = `calls_report_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;
          break;
        case 'performance':
          data = await this.getPerformanceData(filters, userId);
          filename = `performance_report_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;
          break;
        case 'meta_ads':
          data = await this.getMetaAdsData(filters);
          filename = `meta_ads_report_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      const filePath = path.join(this.reportsDir, filename);
      const doc = new PDFDocument();

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add header
      this.addPDFHeader(doc, reportType);

      // Add content based on report type
      await this.addPDFContent(doc, reportType, data);

      // Add footer
      this.addPDFFooter(doc);

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            success: true,
            filename: filename,
            filePath: filePath,
            downloadUrl: `/api/reports/download/${filename}`
          });
        });
        stream.on('error', reject);
      });

    } catch (error) {
      console.error('PDF report generation error:', error);
      throw error;
    }
  }

  // Get leads data for reports
  async getLeadsData(filters = {}, userId = null) {
    try {
      const query = {};

      // Apply filters
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.source) {
        query.source = filters.source;
      }

      if (userId) {
        query.assignedTo = userId;
      }

      const leads = await Lead.find(query)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name')
        .sort({ createdAt: -1 });

      return leads.map(lead => ({
        'Lead ID': lead._id,
        'Name': lead.name,
        'Email': lead.email,
        'Phone': lead.phone,
        'Source': lead.source,
        'Status': lead.status,
        'Priority': lead.priority,
        'Quality': lead.quality,
        'Assigned To': lead.assignedTo?.name || 'Unassigned',
        'Assigned By': lead.assignedBy?.name || 'Auto',
        'Assigned Date': lead.assignedAt ? moment(lead.assignedAt).format('YYYY-MM-DD HH:mm') : '',
        'Created Date': moment(lead.createdAt).format('YYYY-MM-DD HH:mm'),
        'Last Contact': lead.lastContactDate ? moment(lead.lastContactDate).format('YYYY-MM-DD HH:mm') : '',
        'Follow-up Count': lead.followupCount,
        'Score': lead.score,
        'Notes': lead.notes || ''
      }));

    } catch (error) {
      console.error('Get leads data error:', error);
      throw error;
    }
  }

  // Get calls data for reports
  async getCallsData(filters = {}, userId = null) {
    try {
      const query = {};

      if (filters.startDate && filters.endDate) {
        query.startTime = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (userId) {
        query.telecaller = userId;
      }

      const calls = await Call.find(query)
        .populate('telecaller', 'name email')
        .populate('lead', 'name phone')
        .sort({ startTime: -1 });

      return calls.map(call => ({
        'Call ID': call._id,
        'Telecaller': call.telecaller?.name || 'Unknown',
        'Lead': call.lead?.name || 'Unknown',
        'Lead Phone': call.lead?.phone || '',
        'Call Type': call.callType,
        'Status': call.status,
        'Duration (seconds)': call.duration || 0,
        'Start Time': moment(call.startTime).format('YYYY-MM-DD HH:mm:ss'),
        'End Time': call.endTime ? moment(call.endTime).format('YYYY-MM-DD HH:mm:ss') : '',
        'Recording URL': call.recordingUrl || '',
        'Notes': call.notes || ''
      }));

    } catch (error) {
      console.error('Get calls data error:', error);
      throw error;
    }
  }

  // Get performance data for reports
  async getPerformanceData(filters = {}, userId = null) {
    try {
      const query = { role: 'telecaller' };
      if (userId) {
        query._id = userId;
      }

      const users = await User.find(query);
      const performanceData = [];

      for (const user of users) {
        const startDate = filters.startDate ? new Date(filters.startDate) : moment().startOf('month').toDate();
        const endDate = filters.endDate ? new Date(filters.endDate) : moment().endOf('month').toDate();

        const calls = await Call.find({
          telecaller: user._id,
          startTime: { $gte: startDate, $lte: endDate }
        });

        const leads = await Lead.find({
          assignedTo: user._id,
          createdAt: { $gte: startDate, $lte: endDate }
        });

        const completedCalls = calls.filter(c => c.status === 'completed');
        const convertedLeads = leads.filter(l => l.status === 'converted');

        performanceData.push({
          'Telecaller': user.name,
          'Email': user.email,
          'Department': user.department,
          'Total Calls': calls.length,
          'Completed Calls': completedCalls.length,
          'Success Rate (%)': calls.length > 0 ? Math.round((completedCalls.length / calls.length) * 100) : 0,
          'Total Leads': leads.length,
          'Converted Leads': convertedLeads.length,
          'Conversion Rate (%)': leads.length > 0 ? Math.round((convertedLeads.length / leads.length) * 100) : 0,
          'Total Duration (minutes)': calls.reduce((sum, c) => sum + (c.duration || 0), 0) / 60,
          'Average Call Duration (minutes)': calls.length > 0 ? (calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length) / 60 : 0,
          'Last Active': user.lastActive ? moment(user.lastActive).format('YYYY-MM-DD HH:mm') : 'Never'
        });
      }

      return performanceData;

    } catch (error) {
      console.error('Get performance data error:', error);
      throw error;
    }
  }

  // Get Meta Ads data for reports
  async getMetaAdsData(filters = {}) {
    try {
      const query = { source: 'facebook' };

      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const leads = await Lead.find(query)
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 });

      return leads.map(lead => ({
        'Lead ID': lead._id,
        'Name': lead.name,
        'Email': lead.email,
        'Phone': lead.phone,
        'Campaign': lead.metaData?.campaignName || lead.metaCampaignId,
        'Ad': lead.metaData?.adName || lead.metaAdId,
        'Ad Set': lead.metaData?.adSetName || lead.metaAdSetId,
        'Form': lead.metaData?.leadGenFormName || lead.metaFormId,
        'Status': lead.status,
        'Quality': lead.quality,
        'Priority': lead.priority,
        'Assigned To': lead.assignedTo?.name || 'Unassigned',
        'Created Date': moment(lead.createdAt).format('YYYY-MM-DD HH:mm'),
        'Converted': lead.isConverted ? 'Yes' : 'No',
        'Conversion Value': lead.conversionValue || 0
      }));

    } catch (error) {
      console.error('Get Meta Ads data error:', error);
      throw error;
    }
  }

  // Add PDF header
  addPDFHeader(doc, reportType) {
    doc.fontSize(24)
       .text('Telecaller CRM Report', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(16)
       .text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(12)
       .text(`Generated on: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' })
       .moveDown(2);
  }

  // Add PDF content
  async addPDFContent(doc, reportType, data) {
    if (data.length === 0) {
      doc.fontSize(14)
         .text('No data available for the selected criteria.', { align: 'center' });
      return;
    }

    // Add summary statistics
    const summary = this.calculateSummary(data, reportType);
    doc.fontSize(14)
       .text('Summary', { underline: true })
       .moveDown(0.5);

    Object.entries(summary).forEach(([key, value]) => {
      doc.fontSize(12)
         .text(`${key}: ${value}`);
    });

    doc.moveDown(2);

    // Add data table
    doc.fontSize(14)
       .text('Detailed Data', { underline: true })
       .moveDown(1);

    // Create table headers
    const headers = Object.keys(data[0]);
    const columnWidth = (doc.page.width - 100) / headers.length;

    // Draw table headers
    headers.forEach((header, index) => {
      doc.fontSize(10)
         .text(header, 50 + (index * columnWidth), doc.y, { width: columnWidth });
    });

    doc.moveDown(1);

    // Draw table data (first 20 rows to avoid PDF overflow)
    const maxRows = Math.min(data.length, 20);
    for (let i = 0; i < maxRows; i++) {
      const row = data[i];
      headers.forEach((header, index) => {
        const value = row[header] || '';
        doc.fontSize(8)
           .text(String(value).substring(0, 20), 50 + (index * columnWidth), doc.y, { width: columnWidth });
      });
      doc.moveDown(0.5);
    }

    if (data.length > 20) {
      doc.moveDown(1)
         .fontSize(10)
         .text(`... and ${data.length - 20} more records`, { align: 'center' });
    }
  }

  // Calculate summary statistics
  calculateSummary(data, reportType) {
    const summary = {};

    switch (reportType) {
      case 'leads':
        summary['Total Leads'] = data.length;
        summary['New Leads'] = data.filter(d => d.Status === 'new').length;
        summary['Converted Leads'] = data.filter(d => d.Status === 'converted').length;
        summary['Conversion Rate'] = data.length > 0 ? 
          `${Math.round((data.filter(d => d.Status === 'converted').length / data.length) * 100)}%` : '0%';
        break;
      case 'calls':
        summary['Total Calls'] = data.length;
        summary['Completed Calls'] = data.filter(d => d.Status === 'completed').length;
        summary['Success Rate'] = data.length > 0 ? 
          `${Math.round((data.filter(d => d.Status === 'completed').length / data.length) * 100)}%` : '0%';
        summary['Total Duration'] = `${Math.round(data.reduce((sum, d) => sum + (d['Duration (seconds)'] || 0), 0) / 60)} minutes`;
        break;
      case 'performance':
        summary['Total Telecallers'] = data.length;
        summary['Average Success Rate'] = data.length > 0 ? 
          `${Math.round(data.reduce((sum, d) => sum + parseInt(d['Success Rate (%)']), 0) / data.length)}%` : '0%';
        summary['Average Conversion Rate'] = data.length > 0 ? 
          `${Math.round(data.reduce((sum, d) => sum + parseInt(d['Conversion Rate (%)']), 0) / data.length)}%` : '0%';
        break;
      case 'meta_ads':
        summary['Total Meta Leads'] = data.length;
        summary['Converted Leads'] = data.filter(d => d.Converted === 'Yes').length;
        summary['Conversion Rate'] = data.length > 0 ? 
          `${Math.round((data.filter(d => d.Converted === 'Yes').length / data.length) * 100)}%` : '0%';
        break;
    }

    return summary;
  }

  // Add PDF footer
  addPDFFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(10)
         .text(`Page ${i + 1} of ${pageCount}`, 0, doc.page.height - 50, { align: 'center' });
    }
  }

  // Clean up old reports
  async cleanupOldReports() {
    try {
      const files = fs.readdirSync(this.reportsDir);
      const cutoffDate = moment().subtract(7, 'days');

      for (const file of files) {
        const filePath = path.join(this.reportsDir, file);
        const stats = fs.statSync(filePath);
        
        if (moment(stats.mtime).isBefore(cutoffDate)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old report: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup old reports error:', error);
    }
  }
}

module.exports = new ReportService();