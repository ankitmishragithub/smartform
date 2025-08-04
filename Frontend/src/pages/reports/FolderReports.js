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

export default function FolderReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [folders, setFolders] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingResponse, setDeletingResponse] = useState(null);
  const [downloadDropdown, setDownloadDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Default date range (last 30 days)
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { startDate: thirtyDaysAgo, endDate: today };
  };

  const [startDate, setStartDate] = useState(() => getDefaultDateRange().startDate);
  const [endDate, setEndDate] = useState(() => getDefaultDateRange().endDate);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { filterResponses(); }, [responses, searchTerm, selectedFolder, statusFilter, forms, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [responsesRes, formsRes, foldersRes] = await Promise.all([
        api.get('/responses'),
        api.get('/forms'),
        api.get('/forms/folders')
      ]);
      

      
      setResponses(responsesRes.data || []);
      setForms(formsRes.data || []);
      setFolders(foldersRes.data || []);
    } catch (error) {
      console.error('Error loading folder report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormObject = (formId) => forms.find(f => f._id === formId);

  // Helper function to extract folder name from schema
  const getFolderNameFromSchema = (schemaJson) => {
    if (!Array.isArray(schemaJson)) return 'Default';
    const folderField = schemaJson.find(field => field.type === 'folderName');
    return folderField?.label || 'Default';
  };

  // Get submission status based on answers completeness
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
    
    const allFields = getAllFormFields(form.schemaJson);
    const requiredFields = allFields.filter(field => field.required);
    
    if (requiredFields.length === 0) return 'complete';
    
    const answeredFields = requiredFields.filter(field => {
      const answer = response.answers.find(a => a.fieldId === field.id);
      if (!answer) return false;
      
      if (field.type === 'checkbox') return answer.value === true;
      if (field.type === 'spreadsheet') {
        // For spreadsheet, check if any editable cells have been filled
        if (!answer.value || !answer.value.sheets) return false;
        return answer.value.sheets.some(sheet => 
          sheet.data && sheet.data.some(row => 
            row && row.some(cell => {
              if (typeof cell === 'object' && cell !== null) {
                return cell.content && cell.content.trim() !== '';
              }
              return cell && cell.toString().trim() !== '';
            })
          )
        );
      }
      
      return answer.value && answer.value.toString().trim() !== '';
    });
    
    const completionRate = answeredFields.length / requiredFields.length;
    
    if (completionRate === 1) return 'complete';
    if (completionRate > 0) return 'partial';
    return 'incomplete';
  };

  const filterResponses = () => {
    let filtered = responses.filter(response => {
      const form = getFormObject(response.form);
      if (!form) {
        return false;
      }
      
      // Filter by folder
      if (selectedFolder) {
        const folderName = getFolderNameFromSchema(form.schemaJson);
        if (folderName !== selectedFolder) {
          return false;
        }
      }
      
      // Filter by date range
      const responseDate = new Date(response.createdAt);
      if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        if (responseDate < startOfDay) {
          return false;
        }
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (responseDate > endOfDay) {
          return false;
        }
      }
      
      // Filter by search term
      if (searchTerm) {
        const formName = getFolderNameFromSchema(form.schemaJson);
        const submitterName = response.submitterName || '';
        const submitterEmail = response.submitterEmail || '';
        const searchLower = searchTerm.toLowerCase();
        
        if (!formName.toLowerCase().includes(searchLower) &&
            !submitterName.toLowerCase().includes(searchLower) &&
            !submitterEmail.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Filter by status
      if (statusFilter !== 'all') {
        const status = getSubmissionStatus(response);
        if (status !== statusFilter) {
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredResponses(filtered);
  };

  const getFormLabel = (formId) => {
    const form = getFormObject(formId);
    if (!form) return 'Unknown Form';
    return getFolderNameFromSchema(form.schemaJson);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const getStatusBadge = (status) => {
    const statusConfig = {
      complete: { color: 'success', text: 'Complete' },
      partial: { color: 'warning', text: 'Partial' },
      incomplete: { color: 'danger', text: 'Incomplete' },
      unknown: { color: 'secondary', text: 'Unknown' }
    };
    
    const config = statusConfig[status] || statusConfig.unknown;
    return <Badge color={config.color}>{config.text}</Badge>;
  };

  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      const exportData = filteredResponses.map(response => {
        const form = getFormObject(response.form);
        const status = getSubmissionStatus(response);
        
        return {
          'Folder': getFolderNameFromSchema(form?.schemaJson || []),
          'Form ID': response.form,
          'Submitter Name': response.submitterName || '',
          'Submitter Email': response.submitterEmail || '',
          'Status': getSubmissionStatusText(status),
          'Submission Date': formatDate(response.createdAt),
          'Response ID': response._id
        };
      });
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Folder Responses');
      
      const fileName = `folder-responses-${selectedFolder || 'all'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(16);
      doc.text(`Folder Responses Report`, 20, 20);
      doc.setFontSize(12);
      doc.text(`Folder: ${selectedFolder || 'All Folders'}`, 20, 30);
      doc.text(`Date Range: ${startDate ? startDate.toLocaleDateString() : 'All'} - ${endDate ? endDate.toLocaleDateString() : 'All'}`, 20, 40);
      doc.text(`Total Responses: ${filteredResponses.length}`, 20, 50);
      
      // Table data
      const tableData = filteredResponses.map(response => {
        const form = getFormObject(response.form);
        const status = getSubmissionStatus(response);
        
        return [
          getFolderNameFromSchema(form?.schemaJson || []),
          response.submitterName || '',
          response.submitterEmail || '',
          getSubmissionStatusText(status),
          formatDate(response.createdAt)
        ];
      });
      
      doc.autoTable({
        startY: 60,
        head: [['Folder', 'Name', 'Email', 'Status', 'Date']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      const fileName = `folder-responses-${selectedFolder || 'all'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getExportFileName = () => {
    const folderName = selectedFolder || 'all-folders';
    const date = new Date().toISOString().split('T')[0];
    return `folder-responses-${folderName}-${date}`;
  };

  const getSubmissionStatusText = (status) => {
    const statusMap = {
      complete: 'Complete',
      partial: 'Partial',
      incomplete: 'Incomplete',
      unknown: 'Unknown'
    };
    return statusMap[status] || 'Unknown';
  };

  const resetToDefaultDates = () => {
    const defaultRange = getDefaultDateRange();
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
  };

  const handleDeleteResponse = async (responseId) => {
    if (!confirm('Are you sure you want to delete this response?')) return;
    
    setDeletingResponse(responseId);
    try {
      await api.delete(`/responses/${responseId}`);
      setResponses(responses.filter(r => r._id !== responseId));
      alert('Response deleted successfully!');
    } catch (error) {
      console.error('Error deleting response:', error);
      alert('Failed to delete response. Please try again.');
    } finally {
      setDeletingResponse(null);
    }
  };

  const handleViewResponse = (responseId) => {
    navigate(`/response-details/${responseId}`);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col md={8}>
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-3">Loading folder reports...</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <Card>
            <CardBody>
              <CardTitle className="d-flex justify-content-between align-items-center">
                                 <h4>Folder Reports</h4>
                <div>
                  <ButtonGroup>
                    <Dropdown isOpen={downloadDropdown} toggle={() => setDownloadDropdown(!downloadDropdown)}>
                      <DropdownToggle caret color="primary" disabled={isExporting}>
                        {isExporting ? <Spinner size="sm" /> : 'Export'}
                      </DropdownToggle>
                      <DropdownMenu>
                        <DropdownItem onClick={exportToExcel}>Export to Excel</DropdownItem>
                        <DropdownItem onClick={exportToPDF}>Export to PDF</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </ButtonGroup>
                </div>
              </CardTitle>

              {/* Filters */}
              <Row className="mb-4">
                <Col md={3}>
                  <label className="form-label">Folder</label>
                  <Input
                    type="select"
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                  >
                    <option value="">All Folders</option>
                    {folders.map((folder, index) => (
                      <option key={index} value={folder}>{folder}</option>
                    ))}
                  </Input>
                </Col>
                <Col md={2}>
                  <label className="form-label">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                  />
                </Col>
                <Col md={2}>
                  <label className="form-label">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                  />
                </Col>
                <Col md={2}>
                  <label className="form-label">Status</label>
                  <Input
                    type="select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="complete">Complete</option>
                    <option value="partial">Partial</option>
                    <option value="incomplete">Incomplete</option>
                  </Input>
                </Col>
                <Col md={3}>
                  <label className="form-label">Search</label>
                  <Input
                    type="text"
                    placeholder="Search by folder, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Col>
              </Row>

                            <Row className="mb-3">
                <Col>
                  <Button color="link" onClick={resetToDefaultDates}>
                    Reset to Last 30 Days
                  </Button>
                  <span className="ms-3 text-muted">
                    Showing {filteredResponses.length} responses
                  </span>
                </Col>
              </Row>

              {/* Results Table */}
              {filteredResponses.length === 0 ? (
                                <Alert color="info">
                  No responses found for the selected criteria.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Folder</th>
                        <th>Submitter</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResponses.map((response) => {
                        const form = getFormObject(response.form);
                        const status = getSubmissionStatus(response);
                        
                        return (
                          <tr key={response._id}>
                            <td>{getFolderNameFromSchema(form?.schemaJson || [])}</td>
                            <td>{response.submitterName || 'N/A'}</td>
                            <td>{response.submitterEmail || 'N/A'}</td>
                            <td>{getStatusBadge(status)}</td>
                            <td>{formatDate(response.createdAt)}</td>
                            <td>
                              <ButtonGroup size="sm">
                                <Button
                                  color="info"
                                  onClick={() => handleViewResponse(response._id)}
                                >
                                  View
                                </Button>
                                <Button
                                  color="danger"
                                  onClick={() => handleDeleteResponse(response._id)}
                                  disabled={deletingResponse === response._id}
                                >
                                  {deletingResponse === response._id ? <Spinner size="sm" /> : 'Delete'}
                                </Button>
                              </ButtonGroup>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
} 