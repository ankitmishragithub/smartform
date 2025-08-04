import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Button,
  Spinner,
  Alert,
  Badge,
  FormGroup,
  Label,
  Input
} from 'reactstrap';
import api from '../../api/api';
import '../../css/FolderStyles.css';

export default function ExportData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [selectedForms, setSelectedForms] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [formsRes, responsesRes] = await Promise.all([
        api.get('/forms'),
        api.get('/responses')
      ]);

      setForms(formsRes.data || []);
      setResponses(responsesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSelection = (formId) => {
    setSelectedForms(prev => {
      if (prev.includes(formId)) {
        return prev.filter(id => id !== formId);
      } else {
        return [...prev, formId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedForms.length === forms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(forms.map(f => f._id));
    }
  };

  const exportData = async () => {
    if (selectedForms.length === 0) {
      alert('Please select at least one form to export.');
      return;
    }

    try {
      // Filter responses based on selected forms
      const filteredResponses = responses.filter(r => selectedForms.includes(r.formId));
      
      // Create export data
      const exportData = {
        forms: forms.filter(f => selectedForms.includes(f._id)),
        responses: filteredResponses,
        format: exportFormat,
        dateRange: dateRange,
        exportDate: new Date().toISOString()
      };

      // Create downloadable file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `form-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Export completed successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderBottom: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Container fluid className="px-4 py-3">
          <div className="d-flex align-items-center gap-3">
            <h5 className="mb-0" style={{ 
              fontWeight: '600', 
              color: '#495057', 
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="ni ni-download me-2" style={{ fontSize: '1.1rem', color: '#007bff' }}></i>
              Export Data
            </h5>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderBottom: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Container fluid className="px-4 py-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <h5 className="mb-0" style={{ 
                fontWeight: '600', 
                color: '#495057', 
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                <i className="ni ni-download me-2" style={{ fontSize: '1.1rem', color: '#007bff' }}></i>
                Export Data
              </h5>
            </div>
            
            <Button
              color="primary"
              size="sm"
              onClick={() => navigate(`${process.env.PUBLIC_URL}/reports/analytics`)}
              style={{ 
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '6px'
              }}
            >
              <i className="ni ni-arrow-left me-1" style={{ fontSize: '0.75rem' }}></i>
              Back to Analytics
            </Button>
          </div>
        </Container>
      </div>
      
      <Container className="py-3">
        <Row>
          <Col lg={8} className="mb-4">
            <Card className="border-0 shadow-sm">
              <CardBody>
                <CardTitle tag="h6" className="mb-3">
                  <i className="ni ni-file-docs me-2"></i>
                  Select Forms to Export
                </CardTitle>
                
                {forms.length > 0 ? (
                  <div>
                    <div className="mb-3">
                      <Button
                        color="outline-secondary"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedForms.length === forms.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Badge color="info" className="ms-2">
                        {selectedForms.length} of {forms.length} selected
                      </Badge>
                    </div>
                    
                    <div className="row">
                      {forms.map(form => (
                        <div key={form._id} className="col-md-6 mb-2">
                          <div className="d-flex align-items-center p-2 border rounded">
                            <Input
                              type="checkbox"
                              checked={selectedForms.includes(form._id)}
                              onChange={() => handleFormSelection(form._id)}
                              className="me-2"
                            />
                            <div className="flex-grow-1">
                              <div className="fw-bold">{form.heading || form.name || 'Untitled Form'}</div>
                              <small className="text-muted">
                                {responses.filter(r => r.formId === form._id).length} responses
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert color="info" className="text-center">
                    <i className="ni ni-inbox me-2"></i>
                    No forms available for export
                  </Alert>
                )}
              </CardBody>
            </Card>
          </Col>
          
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm">
              <CardBody>
                <CardTitle tag="h6" className="mb-3">
                  <i className="ni ni-settings me-2"></i>
                  Export Settings
                </CardTitle>
                
                <FormGroup>
                  <Label for="exportFormat">Export Format</Label>
                  <Input
                    type="select"
                    id="exportFormat"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option value="json">JSON (Recommended)</option>
                    <option value="csv">CSV</option>
                    <option value="xlsx">Excel</option>
                  </Input>
                </FormGroup>
                
                <FormGroup>
                  <Label for="dateRange">Date Range</Label>
                  <Input
                    type="select"
                    id="dateRange"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="last7">Last 7 Days</option>
                    <option value="last30">Last 30 Days</option>
                    <option value="last90">Last 90 Days</option>
                  </Input>
                </FormGroup>
                
                <div className="d-grid gap-2">
                  <Button
                    color="success"
                    onClick={exportData}
                    disabled={selectedForms.length === 0}
                  >
                    <i className="ni ni-download me-2"></i>
                    Export Data
                  </Button>
                  
                  <Button
                    color="outline-secondary"
                    onClick={() => navigate(`${process.env.PUBLIC_URL}/reports/responses`)}
                  >
                    <i className="ni ni-list me-2"></i>
                    View All Responses
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
} 