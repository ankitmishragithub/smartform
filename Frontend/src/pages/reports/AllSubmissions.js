import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Container, Row, Col, Card, CardBody, CardTitle,
  Button, Alert, Table, Input, InputGroup, InputGroupText, 
  Spinner, Badge, ButtonGroup, Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
  Modal, ModalHeader, ModalBody, ModalFooter, Nav, NavItem, NavLink
} from 'reactstrap';
import api from '../../api/api';
import './response-reports.css';

export default function AllSubmissions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForms, setSelectedForms] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal state for spreadsheet viewer
  const [spreadsheetModal, setSpreadsheetModal] = useState(false);
  const [spreadsheetData, setSpreadsheetData] = useState(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  // Date filtering - start with current month
  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: startOfMonth, endDate: now };
  };

  const [startDate, setStartDate] = useState(() => getCurrentMonthRange().startDate);
  const [endDate, setEndDate] = useState(() => getCurrentMonthRange().endDate);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { filterResponses(); }, [responses, searchTerm, selectedForms, selectedFolders, statusFilter, forms, startDate, endDate]);

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

  const getUniqueFolders = () => {
    const folderNames = forms.map(form => {
      const folder = form.schemaJson.find(e => e.type === "folderName")?.label || 'Untitled';
      return folder;
    });
    return [...new Set(folderNames)].sort();
  };

  const getSubmissionStatus = (response) => {
    const form = getFormObject(response.form);
    if (!form || !form.schemaJson) return 'unknown';
    
    const formFields = form.schemaJson.filter(f => f.type !== 'folderName' && f.type !== 'heading');
    
    if (formFields.length === 0) return 'complete';
    
    const answeredFields = formFields.filter(field => {
      const answer = response.answers[field.id];
      return answer && answer.toString().trim() !== '';
    });
    
    const completionRate = answeredFields.length / formFields.length;
    
    if (completionRate === 1) return 'complete';
    if (completionRate >= 0.5) return 'partial';
    return 'incomplete';
  };

  const getFormFields = (formId) => {
    const form = getFormObject(formId);
    if (!form || !form.schemaJson) return [];
    return form.schemaJson.filter(f => f.type !== 'folderName' && f.type !== 'heading');
  };

  const getFieldAnswer = (response, fieldId) => {
    const answer = response.answers[fieldId];
    if (!answer) return 'N/A';
    

    
    // Handle different data types
    if (typeof answer === 'object') {
      // Handle arrays (checkboxes, multi-select, etc.)
      if (Array.isArray(answer)) {
        if (answer.length === 0) return 'None selected';
        return answer.join(', ');
      }
      
      // Handle objects (spreadsheets, tabs, etc.)
      if (answer !== null) {
        // Handle new spreadsheet data structure with sheets property
        if (answer.sheets && Array.isArray(answer.sheets)) {
          const filledData = [];
          answer.sheets.forEach((sheet, sheetIndex) => {
            if (sheet.data && Array.isArray(sheet.data)) {
              const sheetName = sheet.name || `Sheet ${sheetIndex + 1}`;
              const filledRows = [];
              
              sheet.data.forEach((row, rowIndex) => {
                const filledCells = [];
                row.forEach((cell, colIndex) => {
                  let cellContent = '';
                  if (typeof cell === 'object' && cell !== null && cell.content !== undefined) {
                    cellContent = cell.content || '';
                  } else {
                    cellContent = cell || '';
                  }
                  if (cellContent && cellContent.trim() !== '') {
                    filledCells.push(cellContent);
                  }
                });
                if (filledCells.length > 0) {
                  filledRows.push(`Row ${rowIndex + 1}: ${filledCells.join(' | ')}`);
                }
              });
              
              if (filledRows.length > 0) {
                filledData.push(`${sheetName}: ${filledRows.join('; ')}`);
              }
            }
          });
          
          if (filledData.length > 0) {
            return filledData.join('\n');
          } else {
            return 'No data filled';
          }
        }
        
        // Handle legacy spreadsheet data - array of sheets (fallback)
        if (Array.isArray(answer) && answer.length > 0 && answer[0].data) {
          const filledData = [];
          answer.forEach((sheet, sheetIndex) => {
            if (sheet.data && Array.isArray(sheet.data)) {
              const sheetName = sheet.name || `Sheet ${sheetIndex + 1}`;
              const filledRows = [];
              
              sheet.data.forEach((row, rowIndex) => {
                const filledCells = [];
                row.forEach((cell, colIndex) => {
                  let cellContent = '';
                  if (typeof cell === 'object' && cell !== null && cell.content !== undefined) {
                    cellContent = cell.content || '';
                  } else {
                    cellContent = cell || '';
                  }
                  if (cellContent && cellContent.trim() !== '') {
                    filledCells.push(cellContent);
                  }
                });
                if (filledCells.length > 0) {
                  filledRows.push(`Row ${rowIndex + 1}: ${filledCells.join(' | ')}`);
                }
              });
              
              if (filledRows.length > 0) {
                filledData.push(`${sheetName}: ${filledRows.join('; ')}`);
              }
            }
          });
          
          if (filledData.length > 0) {
            return filledData.join('\n');
          } else {
            return 'No data filled';
          }
        }
        
        // Handle tab data - show which tabs were filled
        if (answer.tabs && Array.isArray(answer.tabs)) {
          const filledTabs = [];
          answer.tabs.forEach((tab, index) => {
            if (tab.filled || (tab.children && tab.children.length > 0)) {
              filledTabs.push(tab.name || `Tab ${index + 1}`);
            }
          });
          
          if (filledTabs.length > 0) {
            return `Filled tabs: ${filledTabs.join(', ')}`;
          } else {
            return 'No tabs filled';
          }
        }
        
        // Handle other complex objects - try to extract meaningful data
        const keys = Object.keys(answer);
        if (keys.length === 0) return 'Empty';
        
        // Special handling for spreadsheet-like objects that might be stored differently
        if (answer.data && Array.isArray(answer.data)) {
          // This might be a spreadsheet stored as a single object
          const filledRows = [];
          answer.data.forEach((row, rowIndex) => {
            if (Array.isArray(row)) {
              const filledCells = [];
              row.forEach((cell, colIndex) => {
                let cellContent = '';
                if (typeof cell === 'object' && cell !== null) {
                  cellContent = cell.content || '';
                } else {
                  cellContent = cell || '';
                }
                if (cellContent && cellContent.trim() !== '') {
                  filledCells.push(cellContent);
                }
              });
              if (filledCells.length > 0) {
                filledRows.push(`Row ${rowIndex + 1}: ${filledCells.join(' | ')}`);
              }
            }
          });
          
          if (filledRows.length > 0) {
            return filledRows.join('; ');
          }
        }
        
        // Try to extract meaningful data from other object properties
        const values = [];
        keys.forEach(key => {
          const value = answer[key];
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'object') {
              // For complex objects, try to get a meaningful string representation
              if (Array.isArray(value)) {
                if (value.length > 0) {
                  values.push(`${key}: ${value.length} items`);
                }
              } else {
                values.push(`${key}: ${JSON.stringify(value).substring(0, 50)}...`);
              }
            } else {
              values.push(`${key}: ${value}`);
            }
          }
        });
        
        return values.length > 0 ? values.join('; ') : 'No data';
      }
    }
    
    // Handle primitive types
    const stringAnswer = answer.toString().trim();
    return stringAnswer || 'N/A';
  };

  const filterResponses = () => {
    let filtered = responses;

    // Always apply date filter for this component
    if (startDate && endDate) {
      const s = new Date(startDate).setHours(0,0,0,0);
      const e = new Date(endDate).setHours(23,59,59,999);
      filtered = filtered.filter(r => {
        const subDate = new Date(r.submittedAt).getTime();
        return subDate >= s && subDate <= e;
      });
    }

    if (selectedForms.length > 0) {
      filtered = filtered.filter(r => selectedForms.includes(r.form));
    }

    if (selectedFolders.length > 0) {
      filtered = filtered.filter(r => {
        const f = getFormObject(r.form);
        const folder = f?.schemaJson?.find(e => e.type === "folderName")?.label || "";
        return selectedFolders.includes(folder);
      });
    }

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

    setFilteredResponses(filtered);
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

  const resetToCurrentMonth = () => {
    const currentMonth = getCurrentMonthRange();
    setStartDate(currentMonth.startDate);
    setEndDate(currentMonth.endDate);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedForms([]);
    setSelectedFolders([]);
    setStatusFilter('all');
    resetToCurrentMonth();
  };

  // Spreadsheet modal functions
  const openSpreadsheetModal = (spreadsheetAnswer) => {
    setSpreadsheetData(spreadsheetAnswer);
    setActiveSheetIndex(0);
    setSpreadsheetModal(true);
  };

  const closeSpreadsheetModal = () => {
    setSpreadsheetModal(false);
    setSpreadsheetData(null);
    setActiveSheetIndex(0);
  };

  const handleSheetClick = (sheetIndex) => {
    setActiveSheetIndex(sheetIndex);
  };

  if (loading) return (
    <div className="rr-header">
      <Container fluid className="px-4 py-3">
        <div className="rr-loading">
          <Spinner color="primary" className="me-2" />
          <span>Loading All Submissions...</span>
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
              <i className="ni ni-list-ul rr-icon"></i>
              All Submissions Dashboard
            </h4>
            <p className="rr-subtitle">View and filter all form submissions by date range</p>
          </div>
        </Container>
      </div>

      <Container className="rr-container">
        {/* Date Filter Section - Always Visible */}
        <Card className="rr-filter-card rr-date-filter-section mb-4">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="rr-filter-title mb-0">
                <i className="ni ni-calendar-alt me-2"></i>
                Date Range Filter
              </h6>
              <div className="d-flex gap-2">
                <Button
                  color="outline-secondary"
                  size="sm"
                  onClick={resetToCurrentMonth}
                  className="rr-reset-dates"
                >
                  <i className="ni ni-refresh me-1"></i>
                  Current Month
                </Button>
                {(searchTerm || selectedForms.length > 0 || selectedFolders.length > 0 || statusFilter !== 'all') && (
                  <Button
                    color="outline-secondary"
                    size="sm"
                    onClick={clearAllFilters}
                    className="rr-clear-filters"
                  >
                    <i className="ni ni-fat-remove me-1"></i>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
            
            <Row>
              <Col lg={4} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    maxDate={endDate || new Date()}
                    placeholderText="Select Start Date"
                    dateFormat="dd MMM yyyy"
                    className="form-control rr-date-input"
                    showMonthDropdown
                    showYearDropdown
                    isClearable
                  />
                </div>
              </Col>
              
              <Col lg={4} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    minDate={startDate || undefined}
                    maxDate={new Date()}
                    placeholderText="Select End Date"
                    dateFormat="dd MMM yyyy"
                    className="form-control rr-date-input"
                    showMonthDropdown
                    showYearDropdown
                    isClearable
                  />
                </div>
              </Col>
              
              <Col lg={4} md={12} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Quick Date Ranges</label>
                  <div className="rr-quick-date-buttons">
                    <Button
                      color="outline-primary"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(today.getDate() - 1);
                        setStartDate(yesterday);
                        setEndDate(today);
                      }}
                    >
                      Yesterday
                    </Button>
                    <Button
                      color="outline-primary"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const weekAgo = new Date();
                        weekAgo.setDate(today.getDate() - 7);
                        setStartDate(weekAgo);
                        setEndDate(today);
                      }}
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      color="outline-primary"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const monthAgo = new Date();
                        monthAgo.setMonth(today.getMonth() - 1);
                        setStartDate(monthAgo);
                        setEndDate(today);
                      }}
                    >
                      Last 30 Days
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

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
                    <h2 className="rr-stat-number">{filteredResponses.length}</h2>
                    <p className="rr-stat-label">Filtered Responses</p>
                    <div className="rr-stat-trend">
                      <i className="ni ni-trend-up text-success me-1"></i>
                      <small className="text-success">Date range: {startDate ? startDate.toLocaleDateString() : 'N/A'} - {endDate ? endDate.toLocaleDateString() : 'N/A'}</small>
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
                    <h2 className="rr-stat-number">{filteredResponses.filter(r => getSubmissionStatus(r) === 'complete').length}</h2>
                    <p className="rr-stat-label">Complete</p>
                    <div className="rr-stat-trend">
                      <small className="text-success">
                        {filteredResponses.length ? Math.round((filteredResponses.filter(r => getSubmissionStatus(r) === 'complete').length / filteredResponses.length) * 100) : 0}% completion rate
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
                    <h2 className="rr-stat-number">{filteredResponses.filter(r => getSubmissionStatus(r) === 'partial').length}</h2>
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
                    <h2 className="rr-stat-number">{new Set(filteredResponses.map(r => r.submitterEmail)).size}</h2>
                    <p className="rr-stat-label">Unique Users</p>
                    <div className="rr-stat-trend">
                      <small className="text-info">In date range</small>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Additional Filters */}
        <Card className="rr-filter-card mb-4">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="rr-filter-title mb-0">
                <i className="ni ni-settings me-2"></i>
                Additional Filters
              </h6>
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
                  <label className="rr-filter-label">Folder</label>
                  <div className="rr-multi-select-container">
                    <Input
                      type="select"
                      value=""
                      onChange={e => {
                        const folderName = e.target.value;
                        if (folderName && !selectedFolders.includes(folderName)) {
                          setSelectedFolders([...selectedFolders, folderName]);
                        }
                        e.target.value = ""; // Reset to empty
                      }}
                      className="rr-select-input"
                    >
                      <option value="">Select Folders...</option>
                      {getUniqueFolders().map(folderName => (
                        <option key={folderName} value={folderName}>
                          📁 {folderName}
                        </option>
                      ))}
                    </Input>
                    
                    {/* Selected Folders Display */}
                    {selectedFolders.length > 0 && (
                      <div className="rr-selected-forms">
                        <div className="rr-selected-header">
                          <small className="text-muted">Selected Folders ({selectedFolders.length})</small>
                          <Button 
                            color="link" 
                            size="sm" 
                            className="rr-clear-all"
                            onClick={() => setSelectedFolders([])}
                            title="Clear all"
                          >
                            <i className="ni ni-fat-remove"></i>
                          </Button>
                        </div>
                        <div className="rr-selected-tags">
                          {selectedFolders.map(folderName => (
                            <span key={folderName} className="rr-selected-tag">
                              <span className="rr-tag-text">📁 {folderName}</span>
                              <Button 
                                color="link" 
                                size="sm" 
                                className="rr-remove-tag"
                                onClick={() => setSelectedFolders(selectedFolders.filter(f => f !== folderName))}
                                title="Remove"
                              >
                                <i className="ni ni-fat-remove"></i>
                              </Button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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

              <Col lg={3} md={6} className="mb-3">
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
            </Row>
          </CardBody>
        </Card>

                 {/* Enhanced Results Cards */}
         <Card className="rr-results-card">
           <CardBody>
             <div className="rr-results-header">
               <div className="d-flex align-items-center">
                 <h6 className="rr-results-title mb-0">
                   <i className="ni ni-list me-2"></i>
                   Submissions in Date Range
                 </h6>
                 <Badge color="primary" pill className="rr-results-count ms-2">
                   {filteredResponses.length} results
                 </Badge>
                 {(searchTerm || selectedForms.length > 0 || selectedFolders.length > 0 || statusFilter !== 'all') && (
                   <Badge color="info" pill className="ms-2">
                     <i className="ni ni-filter me-1"></i>
                     Additional Filters Applied
                   </Badge>
                 )}
               </div>
             </div>

             {filteredResponses.length > 0 ? (
               <div className="rr-cards-container">
                 <Row>
                   {filteredResponses.map(response => {
                     const formFields = getFormFields(response.form);
                     
                     return (
                       <Col key={response._id} lg={6} xl={4} className="mb-4">
                         <Card className="rr-submission-card h-100">
                           <CardBody className="d-flex flex-column">
                             {/* Card Header */}
                             <div className="rr-card-header mb-3">
                               <div className="d-flex justify-content-between align-items-start">
                                 <div className="rr-card-title-section">
                                   <div className="rr-form-name-card">
                                     <i className="ni ni-file-docs text-primary me-2"></i>
                                     {getFormLabel(response.form)}
                                   </div>
                                   <div className="rr-submitter-info-card">
                                     <i className="ni ni-user text-muted me-1"></i>
                                     {response.submitterName || 'Anonymous'}
                                   </div>
                                 </div>
                                 <div className="rr-card-status">
                                   {getStatusBadge(getSubmissionStatus(response))}
                                 </div>
                               </div>
                               <div className="rr-card-meta mt-2">
                                 <div className="rr-email-card">
                                   <i className="ni ni-email text-muted me-1"></i>
                                   {response.submitterEmail || 'N/A'}
                                 </div>
                                 <div className="rr-date-card">
                                   <i className="ni ni-calendar text-muted me-1"></i>
                                   {formatDate(response.submittedAt)}
                                 </div>
                               </div>
                             </div>

                             {/* Form Data */}
                             <div className="rr-card-form-data flex-grow-1">
                               <div className="rr-form-data-header">
                                 <h6 className="rr-form-data-title">
                                   <i className="ni ni-list-ul me-2"></i>
                                   Form Responses
                                 </h6>
                               </div>
                               
                               {formFields.length > 0 ? (
                                 <div className="rr-form-fields-list">
                                   {formFields.map(field => (
                                     <div key={field.id} className="rr-form-field-card">
                                       <div className="rr-field-label-card">
                                         <i className="ni ni-tag text-muted me-1"></i>
                                         {field.label}:
                                       </div>
                                                                               <div className="rr-field-value-card">
                                          <div className="rr-field-value-content">
                                                                                         {(() => {
                                               const answer = response.answers[field.id];
                                               const displayText = getFieldAnswer(response, field.id);
                                               
                                                                                               // Check if it's a spreadsheet - new format with sheets property
                                                if (answer && answer.sheets && Array.isArray(answer.sheets)) {
                                                  const previewText = answer.sheets.map((sheet, index) => {
                                                    const sheetName = sheet.name || `Sheet ${index + 1}`;
                                                    const rowCount = sheet.data ? sheet.data.length : 0;
                                                    return `${sheetName} (${rowCount} rows)`;
                                                  }).join(', ');
                                                  
                                                  return (
                                                    <div className="rr-field-value-long">
                                                      <div className="rr-field-value-preview">
                                                        {previewText}
                                                      </div>
                                                      <Button
                                                        color="primary"
                                                        size="sm"
                                                        className="rr-view-spreadsheet-btn"
                                                        onClick={() => openSpreadsheetModal(answer.sheets)}
                                                      >
                                                        <i className="ni ni-grid-3x3-gap me-1"></i>
                                                        View Spreadsheet
                                                      </Button>
                                                    </div>
                                                  );
                                                }
                                                
                                                // Check if it's a legacy spreadsheet - array format
                                                if (Array.isArray(answer) && answer.length > 0 && answer[0].data) {
                                                  const previewText = answer.map((sheet, index) => {
                                                    const sheetName = sheet.name || `Sheet ${index + 1}`;
                                                    const rowCount = sheet.data ? sheet.data.length : 0;
                                                    return `${sheetName} (${rowCount} rows)`;
                                                  }).join(', ');
                                                  
                                                  return (
                                                    <div className="rr-field-value-long">
                                                      <div className="rr-field-value-preview">
                                                        {previewText}
                                                      </div>
                                                      <Button
                                                        color="primary"
                                                        size="sm"
                                                        className="rr-view-spreadsheet-btn"
                                                        onClick={() => openSpreadsheetModal(answer)}
                                                      >
                                                        <i className="ni ni-grid-3x3-gap me-1"></i>
                                                        View Spreadsheet
                                                      </Button>
                                                    </div>
                                                  );
                                                }
                                               
                                               // Check if content is too long for card display
                                               if (displayText.length > 150) {
                                                 return (
                                                   <div className="rr-field-value-long">
                                                     <div className="rr-field-value-preview">
                                                       {displayText.substring(0, 150)}...
                                                     </div>
                                                     <Button
                                                       color="link"
                                                       size="sm"
                                                       className="rr-view-details-btn"
                                                       onClick={() => {
                                                         // Create a modal or expand the content
                                                         alert(`Full content:\n\n${displayText}`);
                                                       }}
                                                     >
                                                       <i className="ni ni-eye me-1"></i>
                                                       View Full Content
                                                     </Button>
                                                   </div>
                                                 );
                                               }
                                               
                                               return displayText;
                                             })()}
                                          </div>
                                                                                     {(() => {
                                             const answer = response.answers[field.id];
                                             if (answer && typeof answer === 'object') {
                                               if (Array.isArray(answer)) {
                                                 // Check if it's a legacy spreadsheet array
                                                 if (answer.length > 0 && answer[0].data) {
                                                   return <small className="rr-field-type-indicator">Spreadsheet data</small>;
                                                 }
                                                 return <small className="rr-field-type-indicator">Multiple selections</small>;
                                               } else if (answer.sheets && Array.isArray(answer.sheets)) {
                                                 return <small className="rr-field-type-indicator">Spreadsheet data</small>;
                                               } else if (answer.tabs) {
                                                 return <small className="rr-field-type-indicator">Tab data</small>;
                                               } else {
                                                 return <small className="rr-field-type-indicator">Complex data</small>;
                                               }
                                             }
                                             return null;
                                           })()}
                                        </div>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <div className="rr-no-fields-card">
                                   <i className="ni ni-info text-muted me-1"></i>
                                   <span className="text-muted">No form fields</span>
                                 </div>
                               )}
                             </div>
                           </CardBody>
                         </Card>
                       </Col>
                     );
                   })}
                 </Row>
               </div>
             ) : (
               <div className="rr-no-results">
                 <i className="ni ni-inbox"></i>
                 <h5>No submissions found</h5>
                 <p className="text-muted">
                   {responses.length === 0 ? 'No responses have been submitted yet.' : 
                    'No responses match your current date range and filters. Try adjusting your criteria.'}
                 </p>
                 {responses.length > 0 && (
                   <Button 
                     color="outline-primary" 
                     size="sm" 
                     onClick={clearAllFilters}
                     className="mt-2"
                   >
                     <i className="ni ni-refresh me-1"></i>
                     Reset to Current Month
                   </Button>
                 )}
               </div>
             )}
           </CardBody>
                   </Card>
       </Container>

       {/* Spreadsheet Modal */}
       <Modal isOpen={spreadsheetModal} toggle={closeSpreadsheetModal} size="xl">
         <ModalHeader toggle={closeSpreadsheetModal}>
           <i className="ni ni-grid-3x3-gap me-2"></i>
           Spreadsheet Data
         </ModalHeader>
         <ModalBody>
           {spreadsheetData && (
             <div>
               {/* Sheet Navigation */}
               {spreadsheetData.length > 1 && (
                 <div style={{
                   display: "flex",
                   backgroundColor: "#f8f9fa",
                   padding: "8px",
                   borderRadius: "8px",
                   marginBottom: "12px",
                   gap: "4px",
                   overflowX: "auto"
                 }}>
                   {spreadsheetData.map((sheet, index) => (
                     <button
                       key={index}
                       type="button"
                       onClick={() => handleSheetClick(index)}
                       style={{
                         padding: "6px 12px",
                         backgroundColor: index === activeSheetIndex ? "#3b82f6" : "#e5e7eb",
                         color: index === activeSheetIndex ? "white" : "#374151",
                         borderRadius: "6px",
                         fontSize: "12px",
                         fontWeight: "500",
                         whiteSpace: "nowrap",
                         border: "none",
                         cursor: "pointer",
                         transition: "all 0.2s ease"
                       }}
                       onMouseEnter={(e) => {
                         if (index !== activeSheetIndex) {
                           e.target.style.backgroundColor = "#d1d5db";
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (index !== activeSheetIndex) {
                           e.target.style.backgroundColor = "#e5e7eb";
                         }
                       }}
                     >
                       {sheet.name || `Sheet ${index + 1}`}
                     </button>
                   ))}
                 </div>
               )}

               {/* Spreadsheet Table */}
               {spreadsheetData[activeSheetIndex] && (
                 <div style={{
                   border: "1px solid #e5e7eb",
                   borderRadius: "8px",
                   overflow: "auto",
                   backgroundColor: "white"
                 }}>
                   <table style={{
                     width: "100%",
                     borderCollapse: "collapse",
                     fontSize: "14px"
                   }}>
                     <thead>
                       <tr style={{ backgroundColor: "#f8f9fa" }}>
                         <th style={{ padding: "8px", border: "1px solid #e5e7eb", fontWeight: "600", minWidth: "40px" }}></th>
                         {spreadsheetData[activeSheetIndex].headers && spreadsheetData[activeSheetIndex].headers.map((header, colIndex) => (
                           <th key={colIndex} style={{
                             padding: "8px",
                             border: "1px solid #e5e7eb",
                             fontWeight: "600",
                             textAlign: "left",
                             minWidth: "120px"
                           }}>
                             {header || `Column ${colIndex + 1}`}
                           </th>
                         ))}
                       </tr>
                     </thead>
                     <tbody>
                       {spreadsheetData[activeSheetIndex].data && spreadsheetData[activeSheetIndex].data.map((row, rowIndex) => (
                         <tr key={rowIndex}>
                           <td style={{
                             padding: "8px",
                             border: "1px solid #e5e7eb",
                             backgroundColor: "#f8f9fa",
                             fontWeight: "500",
                             textAlign: "center"
                           }}>
                             {rowIndex + 1}
                           </td>
                           {row && row.map((cell, colIndex) => {
                             // Handle both old string format and new object format with formatting
                             let cellContent = "";
                             let cellStyle = {
                               padding: "8px",
                               border: "1px solid #e5e7eb",
                               minHeight: "40px"
                             };
                             
                             if (typeof cell === 'string') {
                               cellContent = cell;
                             } else if (cell && typeof cell === 'object' && cell.content !== undefined) {
                               cellContent = cell.content;
                               
                               // Apply formatting if available
                               if (cell.formatting) {
                                 const fmt = cell.formatting;
                                 cellStyle = {
                                   ...cellStyle,
                                   fontFamily: fmt.fontFamily || 'Arial, sans-serif',
                                   fontSize: fmt.fontSize || '14px',
                                   fontWeight: fmt.bold ? 'bold' : (fmt.fontWeight || 'normal'),
                                   fontStyle: fmt.italic ? 'italic' : 'normal',
                                   textDecoration: fmt.underline !== 'none' ? fmt.underline : (fmt.strikethrough ? 'line-through' : 'none'),
                                   color: fmt.color || '#000000',
                                   backgroundColor: fmt.backgroundColor || '#ffffff',
                                   textAlign: fmt.textAlign || 'left',
                                   verticalAlign: fmt.verticalAlign || 'middle',
                                   whiteSpace: fmt.whiteSpace || 'nowrap'
                                 };
                               }
                             }
                             
                             return (
                               <td key={colIndex} style={cellStyle}>
                                 {cellContent || ""}
                               </td>
                             );
                           })}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           )}
         </ModalBody>
         <ModalFooter>
           <Button color="secondary" onClick={closeSpreadsheetModal}>
             Close
           </Button>
         </ModalFooter>
       </Modal>
     </>
   );
} 