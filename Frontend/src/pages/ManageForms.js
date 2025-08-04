import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  ButtonGroup,
  Spinner,
  Alert,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  Table
} from "reactstrap";
import api from "../api/api";
import "../css/FolderStyles.css";

export default function ManageForms() {
  const navigate = useNavigate();
  const [allForms, setAllForms] = useState([]);
  const [folders, setFolders] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState('tree');
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState(null);
  const [allResponses, setAllResponses] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Helper function to extract folder name from schema
  const getFolderNameFromSchema = (schemaJson) => {
    if (!Array.isArray(schemaJson)) return 'Default';
    const folderField = schemaJson.find(field => field.type === 'folderName');
    return folderField?.label || 'Default';
  };

  // Helper function to get form heading from schema
  const getFormHeadingFromSchema = (schemaJson) => {
    if (!Array.isArray(schemaJson)) return 'Untitled Form';
    const headingField = schemaJson.find(field => field.type === 'heading');
    return headingField?.label || 'Untitled Form';
  };

  // Build hierarchical tree structure
  const buildTreeStructure = (forms) => {
    const folderMap = new Map();
    
    forms.forEach(form => {
      const folderName = getFolderNameFromSchema(form.schemaJson);
      const formHeading = getFormHeadingFromSchema(form.schemaJson);
      
      // Create form data
      const formData = {
        _id: form._id,
        heading: formHeading,
        folderName: folderName,
        createdAt: new Date(form.createdAt).toLocaleDateString(),
        fullPath: folderName
      };

      // Process folder path (handle nested folders)
      const pathParts = folderName.split('/').filter(part => part.trim() !== '');
      let currentPath = '';
      
      pathParts.forEach((part, index) => {
        currentPath = index === 0 ? part : `${currentPath}/${part}`;
        
        if (!folderMap.has(currentPath)) {
          folderMap.set(currentPath, {
            name: part,
            fullPath: currentPath,
            level: index,
            children: new Map(),
            forms: [],
            isExpanded: index < 2 // Auto-expand first 2 levels
          });
        }
        
        // Add form to the deepest folder
        if (index === pathParts.length - 1) {
          folderMap.get(currentPath).forms.push(formData);
        }
      });
    });

    // Convert to tree structure
    const buildTree = (pathPrefix = '', level = 0) => {
      const result = [];
      
      folderMap.forEach((folder, path) => {
        if (folder.level === level && path.startsWith(pathPrefix)) {
          const folderNode = {
            ...folder,
            children: buildTree(path + '/', level + 1)
          };
          result.push(folderNode);
        }
      });
      
      return result.sort((a, b) => a.name.localeCompare(b.name));
    };

    return buildTree();
  };

  // Helper: Flatten schema for report (returns [{id, label, path, type}])
  function flattenSchema(schema, parentLabel = "") {
    let fields = [];
    schema.forEach(field => {
      if (["columns", "table"].includes(field.type) && Array.isArray(field.children)) {
        if (field.type === "columns") {
          field.children.forEach((colArr, colIdx) => {
            colArr.forEach(child => {
              fields = fields.concat(flattenSchema([child], parentLabel ? `${parentLabel} > Column ${colIdx + 1}` : `Column ${colIdx + 1}`));
            });
          });
        } else if (field.type === "table") {
          field.children.forEach((rowArr, rowIdx) => {
            rowArr.forEach((cellArr, colIdx) => {
              cellArr.forEach(child => {
                fields = fields.concat(flattenSchema([child], parentLabel ? `${parentLabel} > Row ${rowIdx + 1} > Col ${colIdx + 1}` : `Row ${rowIdx + 1} > Col ${colIdx + 1}`));
              });
            });
          });
        }
      } else if (!['folderName','heading'].includes(field.type)) {
        fields.push({
          id: field.id,
          label: parentLabel ? `${parentLabel} > ${field.label}` : field.label,
          type: field.type
        });
      }
    });
    return fields;
  }

  // Fetch only submitted forms (forms with responses)
  useEffect(() => {
    const fetchSubmittedForms = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Get all forms first
        const formsResponse = await api.get("/forms");
        const allForms = formsResponse.data || [];
        
        try {
          // Get all responses to find which forms have been submitted
          const responsesResponse = await api.get("/responses");
          const allResponses = responsesResponse.data || [];
          
          // Extract unique form IDs that have responses
          const submittedFormIds = [...new Set(allResponses.map(response => response.form))];
          
          // Filter forms to only include those with submissions
          const submittedForms = allForms.filter(form => 
            submittedFormIds.includes(form._id)
          );
          
          console.log(`Found ${submittedForms.length} submitted forms out of ${allForms.length} total forms`);
          
          setAllForms(submittedForms);
          
          // Build folder structure only for submitted forms
          const tree = buildTreeStructure(submittedForms);
          setTreeData(tree);
          
          // Prepare forms data
          const formsWithPaths = submittedForms.map(form => ({
            _id: form._id,
            heading: getFormHeadingFromSchema(form.schemaJson),
            folderName: getFolderNameFromSchema(form.schemaJson),
            createdAt: form.createdAt,
            schemaJson: form.schemaJson
          }));
          setFormsData(formsWithPaths);
          
          // Extract unique folders for stats
          const uniqueFolders = [...new Set(submittedForms.map(form => getFolderNameFromSchema(form.schemaJson)))];
          setFolders(uniqueFolders);
          
        } catch (responseError) {
          console.error("Error fetching responses, showing all forms:", responseError);
          // Fallback: show all forms if responses endpoint fails
          setAllForms(allForms);
          const tree = buildTreeStructure(allForms);
          setTreeData(tree);
          const formsWithPaths = allForms.map(form => ({
            _id: form._id,
            heading: getFormHeadingFromSchema(form.schemaJson),
            folderName: getFolderNameFromSchema(form.schemaJson),
            createdAt: form.createdAt,
            schemaJson: form.schemaJson
          }));
          setFormsData(formsWithPaths);
          const uniqueFolders = [...new Set(allForms.map(form => getFolderNameFromSchema(form.schemaJson)))];
          setFolders(uniqueFolders);
        }
        
      } catch (err) {
        console.error("Error fetching forms:", err);
        setError("Failed to load forms. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmittedForms();
  }, []);

  // No form moving functionality - this is read-only view of submitted forms

  // Fetch all responses for a form when report is opened
  const fetchAllResponses = async (form) => {
    setLoadingReport(true);
    setReportForm(form);
    try {
      const res = await api.get(`/responses`);
      // Filter responses for this form
      const filtered = res.data.filter(r => r.form === form._id);
      setAllResponses(filtered);
    } catch (err) {
      setAllResponses([]);
    } finally {
      setLoadingReport(false);
    }
  };

  // Render read-only folder tree with response details
  const renderReadOnlyFolder = (folder, level = 0) => {
    const folderForms = formsData.filter(form => form.folderName === folder.fullPath);
    
    return (
      <div key={folder.fullPath} className={`folder-item level-${level} mb-3`}>
        <Card className="folder-card border-0 shadow-sm">
          <CardBody>
            <div className="d-flex align-items-center">
              <i 
                className="ni ni-folder me-3" 
                style={{ 
                  color: level === 0 ? '#007bff' : level === 1 ? '#28a745' : '#ffc107',
                  fontSize: '1.5rem'
                }}
              ></i>
              <div className="flex-grow-1">
                <h6 className="mb-1 folder-name">{folder.name}</h6>
                <small className="text-muted">{folder.fullPath}</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Badge color="primary" pill>
                  {folderForms.length} submitted form{folderForms.length !== 1 ? 's' : ''}
                </Badge>
                {folder.children.length > 0 && (
                  <Badge color="info" pill>
                    +{folder.children.length} subfolder{folder.children.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Submitted Forms in this folder with submitter details */}
        {folderForms.length > 0 && (
          <div className="folder-forms mt-2" style={{ marginLeft: '2rem' }}>
            {folderForms.map(form => (
              <FormWithResponses key={form._id} form={form} />
            ))}
          </div>
        )}

        {/* Child folders */}
        {folder.children.length > 0 && (
          <div className="child-folders mt-2" style={{ marginLeft: '1rem' }}>
            {folder.children.map(childFolder => 
              renderReadOnlyFolder(childFolder, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Component for form with responses
  const FormWithResponses = ({ form }) => {
    const [showResponses, setShowResponses] = useState(false);
    const [formResponses, setFormResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(false);

    const fetchFormResponses = async () => {
      if (formResponses.length > 0) {
        setShowResponses(!showResponses);
        return;
      }

      setLoadingResponses(true);
      try {
        const response = await api.get("/responses");
        const allResponses = response.data || [];
        const thisFormResponses = allResponses.filter(r => r.form === form._id);
        console.log('Fetched responses for form', form._id, ':', thisFormResponses);
        console.log('First response has answers:', thisFormResponses[0] ? !!thisFormResponses[0].answers : 'no responses');
        setFormResponses(thisFormResponses);
        setShowResponses(true);
      } catch (error) {
        console.error("Error fetching form responses:", error);
        alert("Failed to load responses");
      } finally {
        setLoadingResponses(false);
      }
    };

    return (
      <div className="form-with-responses mb-3">
        <Card className="form-card border-success">
          <CardBody>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center flex-grow-1">
                <i className="ni ni-check-circle me-2 text-success"></i>
                <div>
                  <h6 className="mb-1 fw-medium">{form.heading}</h6>
                  <small className="text-muted">
                    Created: {new Date(form.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Button
                  color="outline-primary"
                  size="sm"
                  onClick={fetchFormResponses}
                  disabled={loadingResponses}
                >
                  {loadingResponses ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <i className={`ni ni-${showResponses ? 'minus' : 'plus'} me-1`}></i>
                      {showResponses ? 'Hide' : 'Show'} Responses
                    </>
                  )}
                </Button>
                <Button
                  color="info"
                  size="sm"
                  onClick={() => { setShowReport(true); fetchAllResponses(form); }}
                >
                  <i className="ni ni-bar-chart me-1"></i>
                  Show Report
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Responses List */}
        {showResponses && (
          <div className="responses-list mt-2" style={{ marginLeft: '1rem' }}>
            {formResponses.length === 0 ? (
              <div className="text-center text-muted py-3">
                <i className="ni ni-inbox" style={{ fontSize: '2rem' }}></i>
                <p className="mt-2">No responses found</p>
              </div>
            ) : (
              formResponses.map((response, index) => (
                <Card key={response._id} className="response-card mb-2 border-left-primary">
                  <CardBody className="py-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div className="response-avatar me-3">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          >
                            {response.submitterName ? response.submitterName.charAt(0).toUpperCase() : '#'}
                          </div>
                        </div>
                        <div>
                          <h6 className="mb-1 text-dark">
                            {response.submitterName || 'Anonymous User'}
                            {!response.submitterName && (
                              <Badge color="warning" size="sm" className="ms-2">Legacy</Badge>
                            )}
                          </h6>
                          <p className="mb-1 text-muted small">
                            {response.submitterEmail || 'No email provided'}
                          </p>
                          <small className="text-muted">
                            Submitted: {new Date(response.submittedAt).toLocaleString()}
                          </small>
                        </div>
                      </div>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => navigate(`${process.env.PUBLIC_URL}/response-details/${response._id}`, {
                          state: { response, form }
                        })}
                      >
                        <i className="ni ni-eye me-1"></i>
                        View Details
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // Render grid view (similar to FolderList)
  const renderGridView = () => {
    if (folders.length === 0) {
      return (
        <Alert color="info" className="text-center">
          <i className="ni ni-inbox me-2"></i>
          No submitted forms found. Forms will appear here once they have been filled and submitted.
        </Alert>
      );
    }

    return (
      <Row>
        {folders.map(folderName => {
          const folderForms = allForms.filter(form => 
            getFolderNameFromSchema(form.schemaJson) === folderName
          );

          return (
            <Col lg={4} md={6} className="mb-4" key={folderName}>
              <Card className="folder-card border-0 shadow-sm h-100">
                <CardBody className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div className="folder-icon me-3">
                      <i className="ni ni-folder text-primary" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="folder-name mb-1">{folderName}</h5>
                      <p className="folder-path mb-0">{folderName}</p>
                    </div>
                  </div>

                  <div className="folder-stats mb-3">
                    <Badge color="primary" pill>
                      {folderForms.length} form{folderForms.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="mt-auto">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={() => navigate(`${process.env.PUBLIC_URL}/forms/folder/${encodeURIComponent(folderName)}`)}
                      className="w-100"
                    >
                      <i className="ni ni-eye me-1"></i>
                      View Forms
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner color="primary" size="lg" />
        <p className="mt-3 text-muted">Loading forms...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert color="danger">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
          <Button color="danger" outline onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </Container>
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
              <div>
                <h5 className="mb-0" style={{ 
                  fontWeight: '600', 
                  color: '#495057', 
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <i className="ni ni-check-circle me-2" style={{ fontSize: '1.1rem', color: '#28a745' }}></i>
                  Submitted Forms
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                  <i className="ni ni-collection me-1" style={{ fontSize: '0.7rem' }}></i>
                  {folders.length} folder{folders.length !== 1 ? 's' : ''} • {allForms.length} submitted form{allForms.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                color="success"
                size="sm"
                onClick={() => navigate(`${process.env.PUBLIC_URL}/formBuilder`)}
                style={{ 
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                }}
              >
                <i className="ni ni-plus me-1" style={{ fontSize: '0.75rem' }}></i>
                Create Form
              </Button>
            </div>
            
            {/* View Mode Toggle */}
            <ButtonGroup size="sm">
              <Button
                color={viewMode === 'tree' ? 'primary' : 'outline-secondary'}
                onClick={() => setViewMode('tree')}
                style={{ 
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  borderRadius: viewMode === 'tree' ? '4px 0 0 4px' : '4px 0 0 4px'
                }}
              >
                <i className="ni ni-hierarchy me-1" style={{ fontSize: '0.75rem' }}></i>
                Tree
              </Button>
              <Button
                color={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
                onClick={() => setViewMode('grid')}
                style={{ 
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  borderRadius: viewMode === 'grid' ? '0 4px 4px 0' : '0 4px 4px 0'
                }}
              >
                <i className="ni ni-grid me-1" style={{ fontSize: '0.75rem' }}></i>
                Grid
              </Button>
            </ButtonGroup>
          </div>
        </Container>
      </div>
      
      <Container className="py-2">

        {/* Content */}
        {viewMode === 'tree' ? (
          /* Tree View - Read Only */
          <Card className="border-0 shadow-sm">
            <CardBody>
              <div className="submitted-forms-tree">
                <div className="tree-header mb-3">
                  <h6 className="mb-0">
                    <i className="ni ni-check-circle me-2 text-success"></i>
                    Submitted Forms by Folder
                  </h6>
                </div>
                {treeData.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="ni ni-inbox" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-2">No submitted forms found</p>
                  </div>
                ) : (
                  treeData.map(folder => renderReadOnlyFolder(folder))
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          /* Grid View */
          renderGridView()
        )}
      {/* Report Modal */}
      <Modal isOpen={showReport} toggle={() => setShowReport(false)} size="xl">
        <ModalHeader toggle={() => setShowReport(false)}>
          All Responses Report
        </ModalHeader>
        <ModalBody>
          {loadingReport ? (
            <div className="text-center py-5"><Spinner color="primary" /></div>
          ) : !reportForm ? (
            <div className="text-center text-muted py-5">No form selected.</div>
          ) : allResponses.length === 0 ? (
            <div className="text-center text-muted py-5">No responses found for this form.</div>
          ) : (
            (() => {
              const flatFields = flattenSchema(reportForm.schemaJson || []);
              return (
                <Table responsive bordered striped>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Date</th>
                      {flatFields.map(f => (
                        <th key={f.id + f.label}>{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allResponses.map((resp, idx) => (
                      <tr key={resp._id}>
                        <td>{idx + 1}</td>
                        <td>{resp.submitterName || ''}</td>
                        <td>{resp.submitterEmail || ''}</td>
                        <td>{resp.submittedAt ? new Date(resp.submittedAt).toLocaleString() : ''}</td>
                        {flatFields.map(f => {
                          const val = resp.answers?.[f.id];
                          return <td key={f.id + f.label}>{val !== undefined && val !== null && val !== '' ? String(val) : <span className="text-muted">-</span>}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              );
            })()
          )}
        </ModalBody>
      </Modal>
      </Container>
    </>
  );
} 