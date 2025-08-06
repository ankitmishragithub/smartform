import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import "react-datepicker/dist/react-datepicker.css";
import {
  Container, Row, Col, Card, CardBody, CardTitle,
  Button, Alert, Table, Input, InputGroup, InputGroupText, 
  Spinner, Badge, ButtonGroup, Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import api from '../../api/api';
import '../../css/response-reports.css';
import PDFExportService from './Pdfreport/PDFExportService';

export default function ResponseReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForms, setSelectedForms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingResponse, setDeletingResponse] = useState(null);
  const [downloadDropdown, setDownloadDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Default date range (yesterday to today)
  const getDefaultDateRange = () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    return { startDate: yesterday, endDate: today };
  };

  const [startDate, setStartDate] = useState(() => getDefaultDateRange().startDate);
  const [endDate, setEndDate] = useState(() => getDefaultDateRange().endDate);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { filterResponses(); }, [responses, searchTerm, selectedForms, statusFilter, forms, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [responsesRes, formsRes] = await Promise.all([
        api.get('/responses'),
        api.get('/forms')
      ]);
      setResponses(responsesRes.data || []);
      setForms(formsRes.data || []);
    } catch (error) {
      console.error('Error loading response data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormObject = (formId) => forms.find(f => f._id === formId);

  // Get submission status based on answers completeness
  // Recursively get all form fields (including those inside tabs, columns, tables)
  const getAllFormFields = (schemaJson) => {
    const fields = [];
    
    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return;
      
      nodes.forEach(node => {
        // Skip non-field types
        if (['folderName', 'heading', 'htmlelement', 'content'].includes(node.type)) {
          return;
        }
        
        // Handle tabs - traverse each tab's children
        if (node.type === 'tabs' && node.tabs) {
          node.tabs.forEach(tab => {
            if (tab.children) {
              traverse(tab.children);
            }
          });
          return;
        }
        
        // Handle columns - traverse each column's children
        if (node.type === 'columns' && node.children) {
          node.children.forEach(colChildren => {
            traverse(colChildren);
          });
          return;
        }
        
        // Handle tables - traverse each cell's children
        if (node.type === 'table' && node.children) {
          node.children.forEach(rowArr => {
            rowArr.forEach(cellArr => {
              traverse(cellArr);
            });
          });
          return;
        }
        
        // Handle wells - traverse children
        if (node.type === 'well' && node.children) {
          traverse(node.children);
          return;
        }
        
        // This is a regular form field
        fields.push(node);
      });
    };
    
    traverse(schemaJson);
    return fields;
  };

  const getSubmissionStatus = (response) => {
    const form = getFormObject(response.form);
    if (!form || !form.schemaJson) return 'unknown';
    
    // Get ALL form fields (including those inside tabs, columns, tables)
    const allFormFields = getAllFormFields(form.schemaJson);
    
    if (allFormFields.length === 0) return 'complete';
    
    const answeredFields = allFormFields.filter(field => {
      const answer = response.answers[field.id];
      return answer && answer.toString().trim() !== '';
    });
    
    const completionRate = answeredFields.length / allFormFields.length;
    
    if (completionRate === 1) return 'complete';
    if (completionRate >= 0.5) return 'partial';
    return 'incomplete';
  };

  const filterResponses = () => {
    let filtered = responses;

    if (selectedForms.length > 0) {
      filtered = filtered.filter(r => selectedForms.includes(r.form));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => getSubmissionStatus(r) === statusFilter);
    }

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        const f = getFormObject(r.form);
        const folder = f?.schemaJson?.find(e => e.type === "folderName")?.label || "";
        const heading = f?.schemaJson?.find(e => e.type === "heading")?.label || "";
        return (
          folder.toLowerCase().includes(s) ||
          heading.toLowerCase().includes(s) ||
          (r.submitterName || '').toLowerCase().includes(s) ||
          (r.submitterEmail || '').toLowerCase().includes(s)
        );
      });
    }

    if (startDate && endDate) {
      const s = new Date(startDate).setHours(0,0,0,0);
      const e = new Date(endDate).setHours(23,59,59,999);
      filtered = filtered.filter(r => {
        const subDate = new Date(r.submittedAt).getTime();
        return subDate >= s && subDate <= e;
      });
    }

    setFilteredResponses(filtered);
  };

  const formsWithResponses = new Set(responses.map(r => r.form));
  const uniqueSubmitters = new Set(responses.map(r => r.submitterEmail)).size;
  
  // Status counts for summary
  const statusCounts = {
    complete: responses.filter(r => getSubmissionStatus(r) === 'complete').length,
    partial: responses.filter(r => getSubmissionStatus(r) === 'partial').length,
    incomplete: responses.filter(r => getSubmissionStatus(r) === 'incomplete').length
  };

  function getFormLabel(formId) {
    const form = getFormObject(formId);
    if (!form) return "Unknown";
    const folder = form.schemaJson.find(e => e.type === "folderName")?.label;
    const heading = form.schemaJson.find(e => e.type === "heading")?.label;
    return folder ? folder : heading ? heading : "Untitled Form";
  }

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const getStatusBadge = (status) => {
    const badges = {
      complete: { color: 'success', text: 'Complete', icon: 'ni-check-circle' },
      partial: { color: 'warning', text: 'Partial', icon: 'ni-time' },
      incomplete: { color: 'danger', text: 'Incomplete', icon: 'ni-fat-remove' },
      unknown: { color: 'secondary', text: 'Unknown', icon: 'ni-help' }
    };
    const badge = badges[status] || badges.unknown;
    return (
      <Badge color={badge.color} className="rr-status-badge">
        <i className={`ni ${badge.icon} me-1`}></i>
        {badge.text}
      </Badge>
    );
  };

  // Excel Export Function
  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const exportData = filteredResponses.map((response, index) => {
        const form = getFormObject(response.form);
        const formFields = form?.schemaJson?.filter(f => f.type !== 'folderName' && f.type !== 'heading') || [];
        
        // Base row data
        const rowData = {
          'S.No': index + 1,
          'Form Name': getFormLabel(response.form),
          'Submitter Name': response.submitterName || 'Anonymous',
          'Email': response.submitterEmail || 'N/A',
          'Status': getSubmissionStatusText(getSubmissionStatus(response)),
          'Submitted Date': formatDate(response.submittedAt),
          'Total Fields': formFields.length,
          'Answered Fields': formFields.filter(f => response.answers[f.id] && response.answers[f.id].toString().trim()).length
        };

        // Add form field answers
        formFields.forEach((field, fieldIndex) => {
          const answer = response.answers[field.id] || '';
          rowData[`Field ${fieldIndex + 1} (${field.label})`] = answer;
        });

        return rowData;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      
      // Set column widths
      const colWidths = [
        { wch: 8 },  // S.No
        { wch: 25 }, // Form Name
        { wch: 20 }, // Submitter
        { wch: 25 }, // Email
        { wch: 12 }, // Status
        { wch: 18 }, // Date
        { wch: 12 }, // Total Fields
        { wch: 15 }, // Answered Fields
      ];
      
      // Add dynamic widths for form fields
      const maxFields = Math.max(...filteredResponses.map(r => {
        const form = getFormObject(r.form);
        return form?.schemaJson?.filter(f => f.type !== 'folderName' && f.type !== 'heading').length || 0;
      }));
      
      for (let i = 0; i < maxFields; i++) {
        colWidths.push({ wch: 25 });
      }
      
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Response Reports');
      
      const fileName = `Response_Reports_${getExportFileName()}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export Function
const exportToPDF = () => {
  setIsExporting(true);
  try {
    const selectedForm = selectedForms.length === 1 ? selectedForms[0] : 'all';
    const filters = {
      selectedForm,
      statusFilter,
      startDate: startDate?.toLocaleDateString(),
      endDate: endDate?.toLocaleDateString(),
      searchTerm,
      formName: selectedForm !== 'all' ? getFormLabel(selectedForm) : null
    };

    const result = PDFExportService.exportResponseReport(filteredResponses, forms, filters);
    
    if (result.success) {
      alert(`PDF report "${result.fileName}" downloaded successfully!`);
    }
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Failed to export PDF file. Please try again.');
  } finally {
    setIsExporting(false);
  }
};

  // Helper function to get export file name with timestamp
  const getExportFileName = () => {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Helper function to get status text
  const getSubmissionStatusText = (status) => {
    const statusMap = {
      'complete': 'Complete',
      'partial': 'Partial',
      'incomplete': 'Incomplete',
      'unknown': 'Unknown'
    };
    return statusMap[status] || 'Unknown';
  };

  const resetToDefaultDates = () => {
    const defaultDates = getDefaultDateRange();
    setStartDate(defaultDates.startDate);
    setEndDate(defaultDates.endDate);
  };

  const handleDeleteResponse = async (responseId) => {
    if (!responseId) return;
    setDeletingResponse(responseId);
    try {
      await api.delete(`/responses/${responseId}`);
      setResponses(prev => prev.filter(r => r._id !== responseId));
      alert('Response deleted successfully!');
    } catch (error) {
      console.error('Error deleting response:', error);
      alert('Failed to delete response. Please try again.');
    } finally {
      setDeletingResponse(null);
    }
  };

  if (loading) return (
    <div className="rr-header">
      <Container fluid className="px-4 py-3">
        <div className="rr-loading">
          <Spinner color="primary" className="me-2" />
          <span>Loading Response Reports...</span>
        </div>
      </Container>
    </div>
  );

  return (
    <>
      <div className="rr-header">
        <Container fluid className="px-4 py-3">
          <div className="rr-header-content">
            <h4 className="rr-title">
              <i className="ni ni-chart-bar-32 rr-icon"></i>
              Response Analytics Dashboard
            </h4>
            <p className="rr-subtitle">Monitor and analyze form submissions</p>
          </div>
        </Container>
      </div>

      <Container className="rr-container">
        {/* Enhanced Summary Cards */}
        <Row className="rr-stats-row">
          <Col lg={3} md={6} className="mb-4">
            <Card className="rr-stat-card rr-stat-total">
              <CardBody>
                <div className="rr-stat-content">
                  <div className="rr-stat-icon-wrapper">
                    <i className="ni ni-check-circle rr-stat-icon"></i>
                  </div>
                  <div className="rr-stat-details">
                    <h2 className="rr-stat-number">{responses.length}</h2>
                    <p className="rr-stat-label">Total Responses</p>
                    <div className="rr-stat-trend">
                      <i className="ni ni-trend-up text-success me-1"></i>
                      <small className="text-success">All submissions</small>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="rr-stat-card rr-stat-complete">
              <CardBody>
                <div className="rr-stat-content">
                  <div className="rr-stat-icon-wrapper">
                    <i className="ni ni-satisfied rr-stat-icon"></i>
                  </div>
                  <div className="rr-stat-details">
                    <h2 className="rr-stat-number">{statusCounts.complete}</h2>
                    <p className="rr-stat-label">Complete</p>
                    <div className="rr-stat-trend">
                      <small className="text-success">
                        {responses.length ? Math.round((statusCounts.complete / responses.length) * 100) : 0}% completion rate
                      </small>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="rr-stat-card rr-stat-partial">
              <CardBody>
                <div className="rr-stat-content">
                  <div className="rr-stat-icon-wrapper">
                    <i className="ni ni-time rr-stat-icon"></i>
                  </div>
                  <div className="rr-stat-details">
                    <h2 className="rr-stat-number">{statusCounts.partial}</h2>
                    <p className="rr-stat-label">Partial</p>
                    <div className="rr-stat-trend">
                      <small className="text-warning">Need follow-up</small>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="rr-stat-card rr-stat-users">
              <CardBody>
                <div className="rr-stat-content">
                  <div className="rr-stat-icon-wrapper">
                    <i className="ni ni-users rr-stat-icon"></i>
                  </div>
                  <div className="rr-stat-details">
                    <h2 className="rr-stat-number">{uniqueSubmitters}</h2>
                    <p className="rr-stat-label">Unique Users</p>
                    <div className="rr-stat-trend">
                      <small className="text-info">Active submitters</small>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Enhanced Filters with Download Options */}
        <Card className="rr-filter-card">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="rr-filter-title mb-0">
                <i className="ni ni-settings me-2"></i>
                Filter & Search Options
              </h6>
              
              {/* Download Options */}
              <div className="rr-download-section">
                <Dropdown 
                  isOpen={downloadDropdown} 
                  toggle={() => setDownloadDropdown(!downloadDropdown)}
                  className="rr-download-dropdown"
                >
                  <DropdownToggle 
                    caret 
                    color="success" 
                    size="sm"
                    disabled={isExporting || filteredResponses.length === 0}
                    className="rr-download-btn"
                  >
                    {isExporting ? (
                      <><Spinner size="sm" className="me-1" /> Exporting...</>
                    ) : (
                      <><i className="ni ni-cloud-download me-1"></i> Download ({filteredResponses.length})</>
                    )}
                  </DropdownToggle>
                  <DropdownMenu end>
                    <DropdownItem onClick={exportToExcel} disabled={isExporting}>
                      <i className="ni ni-file-excel text-success me-2"></i>
                      Download as Excel
                    </DropdownItem>
                    <DropdownItem onClick={exportToPDF} disabled={isExporting}>
                      <i className="ni ni-file-pdf text-danger me-2"></i>
                      Download as PDF
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
            
            <Row className="rr-filter-row">
              <Col lg={3} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Search</label>
                  <InputGroup className="rr-search-group">
                    <InputGroupText><i className="ni ni-search"></i></InputGroupText>
                    <Input
                      placeholder="Search responses..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="rr-search-input"
                    />
                  </InputGroup>
                </div>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Form</label>
                  <div className="rr-multi-select-container">
                    <Input
                      type="select"
                      value=""
                      onChange={e => {
                        const formId = e.target.value;
                        if (formId && !selectedForms.includes(formId)) {
                          setSelectedForms([...selectedForms, formId]);
                        }
                        e.target.value = ""; // Reset to empty
                      }}
                      className="rr-select-input"
                    >
                      <option value="">Select Forms...</option>
                      {(() => {
                        // Group forms by folder and create unique options
                        const folderGroups = {};
                        forms.forEach(form => {
                          const folder = form.schemaJson.find(e => e.type === "folderName")?.label || 'Untitled';
                          const heading = form.schemaJson.find(e => e.type === "heading")?.label || 'Untitled Form';
                          
                          if (!folderGroups[folder]) {
                            folderGroups[folder] = [];
                          }
                          folderGroups[folder].push({ id: form._id, heading });
                        });

                        return Object.entries(folderGroups).map(([folderName, formsInFolder]) => {
                          if (formsInFolder.length === 1) {
                            // Single form in folder - show folder name
                            return (
                              <option key={formsInFolder[0].id} value={formsInFolder[0].id}>
                                📁 {folderName}
                              </option>
                            );
                          } else {
                            // Multiple forms in folder - show folder as optgroup
                            return (
                              <optgroup key={folderName} label={`📁 ${folderName}`}>
                                {formsInFolder.map(form => (
                                  <option key={form.id} value={form.id}>
                                    └─ {form.heading}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          }
                        });
                      })()}
                    </Input>
                    
                    {/* Selected Forms Display */}
                    {selectedForms.length > 0 && (
                      <div className="rr-selected-forms">
                        <div className="rr-selected-header">
                          <small className="text-muted">Selected Forms ({selectedForms.length})</small>
                          <Button 
                            color="link" 
                            size="sm" 
                            className="rr-clear-all"
                            onClick={() => setSelectedForms([])}
                            title="Clear all"
                          >
                            <i className="ni ni-fat-remove"></i>
                          </Button>
                        </div>
                        <div className="rr-selected-tags">
                          {selectedForms.map(formId => {
                            const form = getFormObject(formId);
                            const folder = form?.schemaJson?.find(e => e.type === "folderName")?.label || 'Untitled';
                            const heading = form?.schemaJson?.find(e => e.type === "heading")?.label || 'Untitled Form';
                            const displayName = folder === heading ? folder : `${folder} - ${heading}`;
                            
                            return (
                              <span key={formId} className="rr-selected-tag">
                                <span className="rr-tag-text">{displayName}</span>
                                <Button 
                                  color="link" 
                                  size="sm" 
                                  className="rr-remove-tag"
                                  onClick={() => setSelectedForms(selectedForms.filter(id => id !== formId))}
                                  title="Remove"
                                >
                                  <i className="ni ni-fat-remove"></i>
                                </Button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Col>

              <Col lg={2} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Status</label>
                  <Input
                    type="select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="rr-select-input"
                  >
                    <option value="all">All Status</option>
                    <option value="complete">Complete</option>
                    <option value="partial">Partial</option>
                    <option value="incomplete">Incomplete</option>
                  </Input>
                </div>
              </Col>

              <Col lg={5} md={12} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Date Range</label>
                  <div className="rr-date-range">
                    <DatePicker
                      selected={startDate}
                      onChange={date => setStartDate(date)}
                      maxDate={endDate || undefined}
                      placeholderText="Start Date"
                      dateFormat="dd MMM yyyy"
                      className="form-control rr-date-input"
                      showMonthDropdown
                      showYearDropdown
                      isClearable
                    />
                    <span className="rr-date-separator">to</span>
                    <DatePicker
                      selected={endDate}
                      onChange={date => setEndDate(date)}
                      minDate={startDate || undefined}
                      placeholderText="End Date"
                      dateFormat="dd MMM yyyy"
                      className="form-control rr-date-input"
                      showMonthDropdown
                      showYearDropdown
                      isClearable
                    />
                    <div className="rr-date-actions">
                      {(startDate || endDate) && (
                        <Button 
                          color="link" 
                          size="sm" 
                          className="rr-clear-dates"
                          onClick={() => {setStartDate(null); setEndDate(null);}}
                          title="Clear dates"
                        >
                          <i className="ni ni-fat-remove"></i>
                        </Button>
                      )}
                      <Button 
                        color="link" 
                        size="sm" 
                        className="rr-reset-dates"
                        onClick={resetToDefaultDates}
                        title="Reset to yesterday-today"
                      >
                        <i className="ni ni-refresh"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Enhanced Results Table */}
        <Card className="rr-results-card">
          <CardBody>
            <div className="rr-results-header">
              <h6 className="rr-results-title">
                <i className="ni ni-list me-2"></i>
                Response Details
              </h6>
              <Badge color="primary" pill className="rr-results-count">
                {filteredResponses.length} results
              </Badge>
            </div>

            {filteredResponses.length > 0 ? (
              <div className="rr-table-container">
                <Table className="rr-table">
                  <thead>
                    <tr>
                      <th>Form</th>
                      <th>Submitter</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.map(response => (
                      <tr key={response._id} className="rr-table-row">
                        <td>
                          <div className="rr-form-info">
                            <i className="ni ni-file-docs text-primary me-2"></i>
                            <span className="rr-form-name">{getFormLabel(response.form)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="rr-submitter-info">
                            <i className="ni ni-user text-muted me-2"></i>
                            {response.submitterName || 'Anonymous'}
                          </div>
                        </td>
                        <td className="rr-email">{response.submitterEmail || 'N/A'}</td>
                        <td>{getStatusBadge(getSubmissionStatus(response))}</td>
                        <td>
                          <div className="rr-date-info">
                            <i className="ni ni-calendar text-muted me-1"></i>
                            <small>{formatDate(response.submittedAt)}</small>
                          </div>
                        </td>
                        <td>
                          <div className="rr-actions">
                            <Button
                              color="primary"
                              size="sm"
                              className="rr-action-btn"
                              onClick={() => navigate(`${process.env.PUBLIC_URL}/response-details/${response._id}`)}
                            >
                              <i className="ni ni-eye me-1"></i>View
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              className="rr-action-btn"
                              onClick={() => {
                                if (window.confirm(`Delete response from ${response.submitterName || 'Anonymous'}?`)) {
                                  handleDeleteResponse(response._id);
                                }
                              }}
                              disabled={deletingResponse === response._id}
                            >
                              {deletingResponse === response._id ? (
                                <Spinner size="sm" />
                              ) : (
                                <i className="ni ni-trash"></i>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="rr-no-results">
                <i className="ni ni-inbox"></i>
                <h5>No responses found</h5>
                <p className="text-muted">
                  {responses.length === 0 ? 'No responses have been submitted yet.' : 'Try adjusting your filters.'}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>
    </>
  );
}
