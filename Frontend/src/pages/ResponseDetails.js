import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Card,
  CardBody,
  Button,
  Row,
  Col,
  Badge,
  Table,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  FormGroup,
  Label,
  Input
} from 'reactstrap';
import api from '../api/api';
import { logResponseData, logFormData, validateResponseData, validateFormData } from '../utils/debugUtils';

export default function ResponseDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { responseId } = useParams();
  
  // Check if we're in edit mode
  const isEditMode = location.pathname.includes('/edit');
  
  const { response: stateResponse, form: stateForm } = location.state || {};
  
  const [response, setResponse] = useState(stateResponse);
  const [form, setForm] = useState(stateForm);
  const [loading, setLoading] = useState(!stateResponse || !stateForm);
  const [error, setError] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [allResponses, setAllResponses] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'single'
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    dateFrom: '',
    dateTo: '',
    fieldValue: '',
    fieldName: ''
  });
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [editingResponse, setEditingResponse] = useState(null);
  const [saving, setSaving] = useState(false);

  // If user navigates to the /edit route, auto-enter edit mode once data is loaded
  useEffect(() => {
    if (isEditMode && response && !editingResponse) {
      setEditingResponse({ ...response });
    }
  }, [isEditMode, response, editingResponse]);

  // Fetch all responses for this form
  const fetchAllResponses = async () => {
    setLoadingReport(true);
    try {
      const res = await api.get(`/responses`);
      const filtered = res.data.filter(r => r.form === (form?._id || response?.form));
      setAllResponses(filtered);
    } catch (err) {
      setAllResponses([]);
    } finally {
      setLoadingReport(false);
    }
  };

  // Fetch data if not available from navigation state
  useEffect(() => {
    const fetchData = async () => {
      if (!response || !form || !response.answers) {
        setLoading(true);
        try {
          const responseData = await api.get(`/responses/${responseId}`);
          const fetchedResponse = responseData.data;
          setResponse(fetchedResponse);
          
          const formData = await api.get(`/forms/${fetchedResponse.form}`);
          const fetchedForm = formData.data;
          setForm(fetchedForm);
          
          logResponseData(fetchedResponse, 'Fetched Response');
          logFormData(fetchedForm, 'Fetched Form');
          
        } catch (error) {
          console.error('Error fetching data:', error);
          
          if (stateResponse && stateForm) {
            const mockResponse = {
              _id: responseId,
              form: stateResponse.form || stateForm._id,
              submitterName: stateResponse.submitterName || 'Legacy User',
              submitterEmail: stateResponse.submitterEmail || 'legacy@example.com',
              answers: stateResponse.answers || {},
              submittedAt: stateResponse.submittedAt || new Date()
            };
            
            setResponse(mockResponse);
            setForm(stateForm);
          } else {
            setError('Failed to load response details. Please ensure the backend server is running.');
          }
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [responseId, response, form, stateResponse, stateForm]);

  // Debug logging
  useEffect(() => {
    if (response && form) {
      logResponseData(response, 'Current Response');
      logFormData(form, 'Current Form');
      
      const responseIssues = validateResponseData(response);
      const formIssues = validateFormData(form);
      
      if (responseIssues.length > 0) {
        console.warn('Response Data Issues:', responseIssues);
      }
      
      if (formIssues.length > 0) {
        console.warn('Form Data Issues:', formIssues);
      }
      
      // Fetch all responses for this form
      fetchAllResponses();
    }
  }, [response, form]);

  // Apply filters when responses or filters change
  useEffect(() => {
    if (allResponses.length > 0) {
      const filtered = allResponses.filter(resp => {
        // Name filter
        if (filters.name && !resp.submitterName?.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
        
        // Email filter
        if (filters.email && !resp.submitterEmail?.toLowerCase().includes(filters.email.toLowerCase())) {
          return false;
        }
        
        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
          const responseDate = new Date(resp.submittedAt);
          if (filters.dateFrom && responseDate < new Date(filters.dateFrom)) {
            return false;
          }
          if (filters.dateTo && responseDate > new Date(filters.dateTo + 'T23:59:59')) {
            return false;
          }
        }
        
        // Field value filter
        if (filters.fieldValue && filters.fieldName) {
          const fieldValue = resp.answers?.[filters.fieldName];
          if (!fieldValue || !String(fieldValue).toLowerCase().includes(filters.fieldValue.toLowerCase())) {
            return false;
          }
        }
        
        return true;
      });
      
      setFilteredResponses(filtered);
    } else {
      setFilteredResponses([]);
    }
  }, [allResponses, filters]);

  const clearFilters = () => {
    setFilters({
      name: '',
      email: '',
      dateFrom: '',
      dateTo: '',
      fieldValue: '',
      fieldName: ''
    });
  };
  
  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <Card>
          <CardBody className="text-center">
            <Spinner color="primary" />
            <h4 className="mt-3">Loading Response Details...</h4>
          </CardBody>
        </Card>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Card>
          <CardBody className="text-center">
            <h4>Error Loading Response</h4>
            <p>{error}</p>
            <Button color="primary" onClick={() => navigate(`${process.env.PUBLIC_URL}/forms/manage`)}>
              Go to Submitted Forms
            </Button>
          </CardBody>
        </Card>
      </Container>
    );
  }

  // Data not found state
  if (!response || !form) {
    return (
      <Container className="py-5">
        <Card>
          <CardBody className="text-center">
            <h4>Response Not Found</h4>
            <p>The response details could not be loaded.</p>
            <Button color="primary" onClick={() => navigate(`${process.env.PUBLIC_URL}/forms/manage`)}>
              Go to Submitted Forms
            </Button>
          </CardBody>
        </Card>
      </Container>
    );
  }

  // Helper functions
  const getFolderNameFromSchema = (schemaJson) => {
    if (!Array.isArray(schemaJson)) return 'Default';
    const folderField = schemaJson.find(field => field.type === 'folderName');
    return folderField?.label || 'Default';
  };

  const getFormHeadingFromSchema = (schemaJson) => {
    if (!Array.isArray(schemaJson)) return 'Untitled Form';
    const headingField = schemaJson.find(field => field.type === 'heading');
    return headingField?.label || 'Untitled Form';
  };

  const handleDeleteResponse = async () => {
    if (!response?._id) return;
    
    setDeleting(true);
    try {
      await api.delete(`/responses/${response._id}`);
      alert('Response deleted successfully!');
      navigate(`${process.env.PUBLIC_URL}/forms/manage`);
    } catch (error) {
      console.error('Error deleting response:', error);
      alert('Failed to delete response. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleEditResponse = () => {
    setEditingResponse({ ...response });
  };

  const handleSaveResponse = async () => {
    if (!editingResponse) return;
    
    setSaving(true);
    try {
      await api.put(`/responses/${response._id}`, editingResponse);
      setResponse(editingResponse);
      setEditingResponse(null);
      alert('Response updated successfully!');
    } catch (error) {
      console.error('Error updating response:', error);
      alert('Failed to update response. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingResponse(null);
    navigate(`${process.env.PUBLIC_URL}/response-details/${responseId}`);
  };

  const handleFieldChange = (fieldId, value) => {
    if (!editingResponse) return;
    
    setEditingResponse(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [fieldId]: value
      }
    }));
  };

  const folderName = getFolderNameFromSchema(form.schemaJson);
  const formHeading = getFormHeadingFromSchema(form.schemaJson);

  // Get form fields for display (exclude folderName and heading)
  const formFields = Array.isArray(form.schemaJson) 
    ? form.schemaJson.filter(field => 
        field && field.type !== 'folderName' && field.type !== 'heading'
      )
    : [];

  // Component to render a single response in form-like format
  const ResponseFormView = ({ resp, index }) => {
    const [activeTabs, setActiveTabs] = useState({});
    const [activeSpreadsheets, setActiveSpreadsheets] = useState({});

    console.log('ResponseFormView - Response data:', resp);
    console.log('ResponseFormView - Form schema:', form.schemaJson);

    // Use editingResponse data if in edit mode, otherwise use original response
    const currentResponse = editingResponse || resp;
    const currentAnswers = currentResponse.answers || {};

    const renderResponseNode = (node, answers) => {
      console.log('Rendering node:', node.type, node.id, 'with answers:', answers);
      
      if (node.type === "heading") {
        return (
          <h4 key={node.id} style={{ marginBottom: "1rem", color: "#2c3e50" }}>
            {node.label || "Untitled Form"}
          </h4>
        );
      }

      if (node.type === "tabs") {
        const tabsId = node.id;
        const currentActiveTab = activeTabs[tabsId] || 0;
        
        const handleTabClick = (tabIndex) => {
          setActiveTabs(prev => ({
            ...prev,
            [tabsId]: tabIndex
          }));
        };
        
        return (
          <div key={node.id} style={{ marginBottom: 16 }}>
            <div style={{ 
              display: 'flex', 
              borderBottom: '2px solid #e9ecef',
              marginBottom: 16,
              overflowX: 'auto',
              gap: 0
            }}>
              {node.tabs.map((tab, index) => (
                <div
                  key={index}
                  onClick={() => handleTabClick(index)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: currentActiveTab === index ? '#007bff' : '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderBottom: 'none',
                    borderRight: index < node.tabs.length - 1 ? '1px solid #dee2e6' : 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    minWidth: '120px',
                    textAlign: 'center',
                    fontWeight: '500',
                    color: currentActiveTab === index ? '#fff' : '#495057',
                    borderTopLeftRadius: index === 0 ? '8px' : '0',
                    borderTopRightRadius: index === node.tabs.length - 1 ? '8px' : '0',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                >
                  {tab.name || `Tab ${index + 1}`}
                </div>
              ))}
            </div>
            
            <div style={{ 
              border: '1px solid #dee2e6',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '20px',
              backgroundColor: '#fff'
            }}>
              {node.tabs.map((tab, index) => (
                <div 
                  key={index}
                  style={{
                    display: currentActiveTab === index ? 'block' : 'none'
                  }}
                >
                  {tab.children && tab.children.map(child => renderResponseNode(child, answers))}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (node.type === "spreadsheet") {
        // Try to get spreadsheet data from answers first, then from node
        const spreadsheetData = answers[node.id] || node.sheets || [];
        const { sheets = [], activeSheet = 0 } = Array.isArray(spreadsheetData) ? { sheets: spreadsheetData, activeSheet: 0 } : spreadsheetData;
        
        const spreadsheetId = node.id;
        const currentActiveSheet = activeSpreadsheets[spreadsheetId] || activeSheet;
        const currentSheet = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0 };
        
        const handleSheetClick = (sheetIndex) => {
          console.log('Sheet clicked:', sheetIndex, 'for spreadsheet:', spreadsheetId);
          setActiveSpreadsheets(prev => ({
            ...prev,
            [spreadsheetId]: sheetIndex
          }));
        };
        
        console.log('Spreadsheet node:', node);
        console.log('Spreadsheet data from answers:', answers[node.id]);
        console.log('Sheets:', sheets);
        console.log('Current active sheet:', currentActiveSheet);
        console.log('Current sheet data:', currentSheet);
        
        if (sheets.length === 0) {
          return (
            <div style={{ 
              padding: "2rem", 
              textAlign: "center", 
              backgroundColor: "#f8f9fa", 
              border: "2px dashed #dee2e6",
              borderRadius: "8px",
              marginBottom: "1rem"
            }}>
              <i className="ni ni-grid-3x3-gap" style={{ fontSize: "2rem", color: "#6b7280", marginBottom: "0.5rem" }}></i>
              <div style={{ color: "#6b7280" }}>
                <strong>Spreadsheet Component</strong>
                <br />
                <small>No sheets available</small>
              </div>
            </div>
          );
        }

        return (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{
              display: "flex",
              backgroundColor: "#f8f9fa",
              padding: "8px",
              borderRadius: "8px",
              marginBottom: "12px",
              gap: "4px",
              overflowX: "auto"
            }}>
              {sheets.map((sheet, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSheetClick(index)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: index === currentActiveSheet ? "#3b82f6" : "#e5e7eb",
                    color: index === currentActiveSheet ? "white" : "#374151",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (index !== currentActiveSheet) {
                      e.target.style.backgroundColor = "#d1d5db";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (index !== currentActiveSheet) {
                      e.target.style.backgroundColor = "#e5e7eb";
                    }
                  }}
                >
                  {sheet.name || `Sheet ${index + 1}`}
                </button>
              ))}
            </div>

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
                    {currentSheet.headers && currentSheet.headers.map((header, colIndex) => (
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
                  {currentSheet.data && currentSheet.data.map((row, rowIndex) => (
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
                        // Handle both old string format and new object format
                        let cellContent = "";
                        if (typeof cell === 'string') {
                          cellContent = cell;
                        } else if (cell && typeof cell === 'object' && cell.content !== undefined) {
                          cellContent = cell.content;
                        }
                        
                        return (
                          <td key={colIndex} style={{
                            padding: "8px",
                            border: "1px solid #e5e7eb",
                            minHeight: "40px"
                          }}>
                            {cellContent || ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      // For regular form fields
      if (node.type && node.type !== 'folderName' && node.type !== 'heading') {
        const value = answers[node.id];
        const isEditing = editingResponse !== null;
        const currentValue = isEditing ? editingResponse.answers[node.id] : value;
        
        return (
          <div key={node.id} style={{ marginBottom: "1rem" }}>
            <div style={{ 
              fontWeight: "600", 
              color: "#495057", 
              marginBottom: "0.5rem",
              fontSize: "14px"
            }}>
              {node.label}
            </div>
            <div style={{ 
              padding: "0.75rem", 
              backgroundColor: isEditing ? "white" : "#f8f9fa", 
              borderRadius: "6px",
              border: "1px solid #e9ecef",
              minHeight: "2.5rem",
              display: "flex",
              alignItems: "center"
            }}>
              {isEditing ? (
                // Edit mode - render input fields
                (() => {
                  switch (node.type) {
                    case 'text':
                    case 'email':
                    case 'url':
                    case 'phone':
                    case 'number':
                      return (
                        <Input
                          type={node.type === 'number' ? 'number' : 'text'}
                          value={currentValue || ''}
                          onChange={(e) => handleFieldChange(node.id, e.target.value)}
                          style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}
                        />
                      );
                    case 'textarea':
                      return (
                        <Input
                          type="textarea"
                          value={currentValue || ''}
                          onChange={(e) => handleFieldChange(node.id, e.target.value)}
                          style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}
                        />
                      );
                    case 'checkbox':
                      return (
                        <Input
                          type="checkbox"
                          checked={currentValue || false}
                          onChange={(e) => handleFieldChange(node.id, e.target.checked)}
                        />
                      );
                    case 'select':
                      return (
                        <Input
                          type="select"
                          value={currentValue || ''}
                          onChange={(e) => handleFieldChange(node.id, e.target.value)}
                        >
                          <option value="">Select an option</option>
                          {node.options && node.options.map((option, index) => (
                            <option key={index} value={option.value || option}>
                              {option.label || option}
                            </option>
                          ))}
                        </Input>
                      );
                    default:
                      return (
                        <Input
                          type="text"
                          value={currentValue || ''}
                          onChange={(e) => handleFieldChange(node.id, e.target.value)}
                          style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}
                        />
                      );
                  }
                })()
              ) : (
                // View mode - display values
                currentValue !== undefined && currentValue !== null && currentValue !== '' ? (
                  typeof currentValue === 'boolean' ? (
                    <Badge color={currentValue ? 'success' : 'secondary'}>
                      {currentValue ? 'Yes' : 'No'}
                    </Badge>
                  ) : (
                    <span style={{ color: "#495057" }}>{String(currentValue)}</span>
                  )
                ) : (
                  <span style={{ color: "#6c757d", fontStyle: "italic" }}>No response</span>
                )
              )}
            </div>
          </div>
        );
      }

      // For container types
      if (node.children) {
        return (
          <div key={node.id} style={{ marginBottom: "1rem" }}>
            {node.children.map(child => renderResponseNode(child, answers))}
          </div>
        );
      }

      return null;
    };

    return (
      <Card key={resp._id} style={{ marginBottom: "2rem", border: "1px solid #e9ecef" }}>
        <CardBody>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid #e9ecef"
          }}>
            <div>
              <h5 style={{ margin: 0, color: "#495057" }}>
                Response #{index + 1}
              </h5>
              <div style={{ fontSize: "14px", color: "#6c757d", marginTop: "0.25rem" }}>
                <strong>Name:</strong> {resp.submitterName || 'Anonymous'} | 
                <strong> Email:</strong> {resp.submitterEmail || 'No email'} | 
                <strong> Date:</strong> {resp.submittedAt ? 
                  new Date(resp.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Unknown'
                }
              </div>
            </div>
          </div>
          
          <div>
            {form.schemaJson && Array.isArray(form.schemaJson) ? (
              form.schemaJson.map(node => renderResponseNode(node, currentAnswers))
            ) : (
              <div className="text-center text-muted py-4">
                <p>No form structure available to display</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <>
      {/* Simple Header */}
      <div style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6', padding: '1rem 0' }}>
        <Container>
          <div className="d-flex align-items-center gap-3">
            <Button
              color="outline-secondary"
              size="sm"
              onClick={() => navigate(-1)}
            >
              ← Back
            </Button>
            <div>
              <h5 className="mb-0">Response Details</h5>
              <small className="text-muted">{folderName} → {formHeading}</small>
            </div>
          </div>
        </Container>
      </div>
      
      <Container className="py-4">
        <Row>
          <Col>
            <Card>
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Response Data</h5>
                  <div className="d-flex gap-2">
                    {isEditMode ? (
                      <>
                        <Button 
                          color="success" 
                          size="sm"
                          onClick={handleSaveResponse}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Spinner size="sm" className="me-1" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <i className="ni ni-check me-1"></i>
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button 
                          color="secondary" 
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <i className="ni ni-cross me-1"></i>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          color="info" 
                          size="sm"
                          onClick={() => { setShowReport(true); fetchAllResponses(); }}
                        >
                          <i className="ni ni-chart-bar-32 me-1"></i>
                          All Responses
                        </Button>
                        <Button 
                          color="warning" 
                          size="sm"
                          onClick={handleEditResponse}
                        >
                          <i className="ni ni-edit me-1"></i>
                          Edit Response
                        </Button>
                        <Button 
                          color="danger" 
                          size="sm"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          <i className="ni ni-trash me-1"></i>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Filter Section - Only show in view mode */}
                {!isEditMode && (
                  <Card className="mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <CardBody>
                      <h6 className="mb-3">Filter Responses</h6>
                    <Row>
                      <Col md={3}>
                        <FormGroup>
                          <Label for="nameFilter" size="sm">Name</Label>
                          <Input
                            id="nameFilter"
                            type="text"
                            placeholder="Filter by name..."
                            value={filters.name}
                            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                            size="sm"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={3}>
                        <FormGroup>
                          <Label for="emailFilter" size="sm">Email</Label>
                          <Input
                            id="emailFilter"
                            type="email"
                            placeholder="Filter by email..."
                            value={filters.email}
                            onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                            size="sm"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2}>
                        <FormGroup>
                          <Label for="dateFromFilter" size="sm">From Date</Label>
                          <Input
                            id="dateFromFilter"
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            size="sm"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2}>
                        <FormGroup>
                          <Label for="dateToFilter" size="sm">To Date</Label>
                          <Input
                            id="dateToFilter"
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            size="sm"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2}>
                        <FormGroup>
                          <Label size="sm">&nbsp;</Label>
                          <div className="d-flex gap-1">
                            <Button 
                              color="secondary" 
                              size="sm" 
                              onClick={clearFilters}
                              style={{ flex: 1 }}
                            >
                              Clear
                            </Button>
                            <Button 
                              color="info" 
                              size="sm"
                              style={{ flex: 1 }}
                            >
                              {filteredResponses.length} / {allResponses.length}
                            </Button>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>
                    
                    {/* Field-specific filter */}
                    {formFields.length > 0 && (
                      <Row className="mt-2">
                        <Col md={4}>
                          <FormGroup>
                            <Label for="fieldNameFilter" size="sm">Field</Label>
                            <Input
                              id="fieldNameFilter"
                              type="select"
                              value={filters.fieldName}
                              onChange={(e) => setFilters(prev => ({ ...prev, fieldName: e.target.value }))}
                              size="sm"
                            >
                              <option value="">Select a field...</option>
                              {formFields.map(field => (
                                <option key={field.id} value={field.id}>
                                  {field.label}
                                </option>
                              ))}
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="fieldValueFilter" size="sm">Field Value</Label>
                            <Input
                              id="fieldValueFilter"
                              type="text"
                              placeholder="Filter by field value..."
                              value={filters.fieldValue}
                              onChange={(e) => setFilters(prev => ({ ...prev, fieldValue: e.target.value }))}
                              size="sm"
                              disabled={!filters.fieldName}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={2}>
                          <FormGroup>
                            <Label size="sm">&nbsp;</Label>
                            <Button 
                              color="outline-secondary" 
                              size="sm"
                              onClick={() => setFilters(prev => ({ ...prev, fieldName: '', fieldValue: '' }))}
                              style={{ width: '100%' }}
                            >
                              Clear Field
                            </Button>
                          </FormGroup>
                        </Col>
                      </Row>
                    )}
                  </CardBody>
                </Card>
                )}

                {/* Form-like View for All Responses */}
                {isEditMode ? (
                  // Edit mode - show single response
                  loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p>Loading response for editing...</p>
                    </div>
                  ) : response ? (
                    <ResponseFormView key={response._id} resp={response} index={0} />
                  ) : (
                    <div className="text-center text-muted py-5">
                      <p>Response not found.</p>
                    </div>
                  )
                ) : (
                  // View mode - show all responses
                  loadingReport ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p>Loading responses...</p>
                    </div>
                  ) : filteredResponses.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <p>
                        {allResponses.length === 0 ? 'No responses found for this form.' : 'No responses match the current filters.'}
                      </p>
                      {allResponses.length > 0 && (
                        <Button 
                          color="outline-secondary" 
                          size="sm" 
                          onClick={clearFilters}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div>
                      {filteredResponses.map((resp, index) => (
                        <ResponseFormView key={resp._id} resp={resp} index={index} />
                      ))}
                    </div>
                  )
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* All Responses Report Modal - Same as before */}
      <Modal isOpen={showReport} toggle={() => setShowReport(false)} size="xl">
        <ModalHeader toggle={() => setShowReport(false)}>
          All Responses Report
        </ModalHeader>
        <ModalBody>
          {loadingReport ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <p>Loading responses...</p>
            </div>
          ) : allResponses.length === 0 ? (
            <div className="text-center text-muted py-5">
              <p>No responses found for this form.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table responsive bordered striped>
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Date</th>
                    {formFields.map(f => (
                      <th key={f.id}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allResponses.map((resp, idx) => (
                    <tr key={resp._id}>
                      <td>{idx + 1}</td>
                      <td>{resp.submitterName || '-'}</td>
                      <td>{resp.submitterEmail || '-'}</td>
                      <td>
                        {resp.submittedAt ? 
                          new Date(resp.submittedAt).toLocaleDateString() : 
                          '-'
                        }
                      </td>
                      {formFields.map(f => {
                        const val = resp.answers?.[f.id];
                        return (
                          <td key={f.id}>
                            {val !== undefined && val !== null && val !== '' ? 
                              (typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)) : 
                              <span className="text-muted">-</span>
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Simple Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} toggle={() => setShowDeleteModal(false)} centered>
        <ModalHeader toggle={() => setShowDeleteModal(false)}>
          Delete Response
        </ModalHeader>
        <ModalBody>
          <div className="text-center">
            <h5>Are you sure you want to delete this response?</h5>
            <p className="text-muted">
              Response from: <strong>{response?.submitterName || 'Anonymous'}</strong><br/>
              Submitted: {response?.submittedAt ? new Date(response.submittedAt).toLocaleDateString() : 'Unknown date'}
            </p>
            <div className="alert alert-warning">
              This action cannot be undone.
            </div>
          </div>
        </ModalBody>
        <div className="modal-footer">
          <Button color="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleDeleteResponse} disabled={deleting}>
            {deleting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Forever'
            )}
          </Button>
        </div>
      </Modal>
    </>
  );
}
