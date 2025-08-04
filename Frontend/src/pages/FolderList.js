import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Container, 
  Card, 
  CardBody, 
  CardTitle, 
  Button, 
  Spinner, 
  Alert,
  Row,
  Col,
  Badge,
  ButtonGroup,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from 'reactstrap';
import { useFormAPI } from '../hooks/useFormAPI';
import SimpleDragDropTree from '../components/SimpleDragDropTree';
import '../css/FolderStyles.css';
import '../components/SimpleDragDropTree.css';
import FormFillPage from './FormFill';

// Helper function to build folder tree structure for SimpleDragDropTree
const buildSimpleTreeData = (folders) => {
  const tree = {};
  
  folders.forEach(folderPath => {
    const parts = folderPath.split('/');
    let current = tree;
    
    parts.forEach((part, index) => {
      if (!current[part]) {
        const fullPath = parts.slice(0, index + 1).join('/');
        current[part] = {
          name: part,
          path: fullPath,
          children: [],
          childrenMap: {}
        };
      }
      current = current[part].childrenMap;
    });
  });

  // Convert tree structure to array
  const convertToArray = (treeObj) => {
    return Object.values(treeObj).map(folder => {
      const children = convertToArray(folder.childrenMap);
      return {
        ...folder,
        children: children.sort((a, b) => a.name.localeCompare(b.name))
      };
    });
  };

  return convertToArray(tree);
};

// Helper function to prepare forms data for SimpleDragDropTree
const prepareFormsData = (allForms) => {
  return allForms.map(form => {
    const folderField = form.schemaJson?.find(f => f.type === 'folderName');
    const headingField = form.schemaJson?.find(f => f.type === 'heading');
    
    return {
      _id: form._id,
      name: headingField?.label || 'Untitled Form',
      folderPath: folderField?.label || 'Default',
      createdAt: form.createdAt,
      schemaJson: form.schemaJson
    };
  });
};

export default function FolderList() {
  const [folders, setFolders] = useState([]);
  const [allForms, setAllForms] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tree');
  const [activeTab, setActiveTab] = useState(0);
  const [openFormTabs, setOpenFormTabs] = useState([]); // {formId, formName, folder}
  const [activeFormTab, setActiveFormTab] = useState(null);
  const [openedFolderIdx, setOpenedFolderIdx] = useState(null); // Track which folder's forms are open as tabs
  const [tabsOpenFolder, setTabsOpenFolder] = useState(null); // folder name
  const [tabsActiveFormTab, setTabsActiveFormTab] = useState(null); // form id
  const [tabsSearch, setTabsSearch] = useState("");
  const navigate = useNavigate();
  
  const { getFolders, getForms, updateForm, error } = useFormAPI();

  useEffect(() => {
    loadData();
  }, []);

  // Ensure first form is selected when opening a folder in Tabs view
  useEffect(() => {
    if (tabsOpenFolder) {
      const folderForms = formsData.filter(f => f.folderPath === tabsOpenFolder && f._id && f._id !== 'undefined');
      if (folderForms.length > 0) {
        setTabsActiveFormTab(folderForms[0]._id);
      } else {
        setTabsActiveFormTab(null);
      }
    } else {
      setTabsActiveFormTab(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabsOpenFolder, formsData]);

  const loadData = async () => {
    try {
      const [foldersData, allFormsData] = await Promise.all([
        getFolders(),
        getForms()
      ]);
      
      setFolders(foldersData);
      setAllForms(allFormsData);
      
      // Build simple tree data
      const simpleTreeData = buildSimpleTreeData(foldersData);
      setTreeData(simpleTreeData);
      
      // Prepare forms data
      const preparedFormsData = prepareFormsData(allFormsData);
      setFormsData(preparedFormsData);
      
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveForm = async (formId, fromFolder, toFolder) => {
    try {
      console.log(`Moving form ${formId} from "${fromFolder}" to "${toFolder}"`);
      
      // Find the form
      const form = allForms.find(f => f._id === formId);
      if (!form) {
        throw new Error('Form not found');
      }

      // Update the folderName in schemaJson
      const updatedSchema = form.schemaJson.map(field => {
        if (field.type === 'folderName') {
          return { ...field, label: toFolder };
        }
        return field;
      });

      // Call the PUT API to update the form
      await updateForm(formId, { schemaJson: updatedSchema });
      
      console.log(`✅ Form moved successfully from "${fromFolder}" to "${toFolder}"`);
      
      // Reload data to reflect changes
      await loadData();
      
    } catch (error) {
      console.error('❌ Error moving form:', error);
      alert(`Error moving form: ${error.message}`);
    }
  };

  const handleFolderClick = (folderName) => {
    navigate(`${process.env.PUBLIC_URL}/forms/folder/${encodeURIComponent(folderName)}`);
  };

  // Tabs View Renderer (folder grid, then tabbed form fill)
  const renderTabsView = () => {
    if (folders.length === 0) {
      return (
        <Alert color="info" className="text-center">
          <i className="ni ni-inbox me-2"></i>
          No folders found. Folders will appear here once created.
        </Alert>
      );
    }
    if (tabsOpenFolder) {
      // Show tabbed form fill for this folder
      let folderForms = formsData.filter(f => f.folderPath === tabsOpenFolder);
      // Filter out forms without a valid _id
      let validFolderForms = folderForms.filter(f => f._id && f._id !== 'undefined');
      // Apply search filter
      if (tabsSearch.trim()) {
        const searchLower = tabsSearch.trim().toLowerCase();
        validFolderForms = validFolderForms.filter(f =>
          (f.heading || f.name || '').toLowerCase().includes(searchLower)
        );
      }
      // If no valid forms, show message
      if (validFolderForms.length === 0) {
                return (
          <div className="tab-view-container">
            <Alert color="info" className="text-center">
              <i className="ni ni-inbox me-2"></i>
              No forms in this folder.
            </Alert>
          </div>
          );
        }
      // Defensive: always use a valid form ID
      let activeTabIdx = validFolderForms.findIndex(f => f._id === tabsActiveFormTab);
      if (activeTabIdx === -1) {
        activeTabIdx = 0;
      }
      return (
        <div>
              {/* Folder indicator */}
              {/* <div className="folder-breadcrumb mb-3">
                <i className="ni ni-folder me-2"></i>
                <span className="folder-title">{tabsOpenFolder}</span>
                <span className="form-count">({validFolderForms.length} forms)</span>
              </div> */}
              {/* Search input for tabs */}
              <div className="tab-search-container" style={{ maxWidth: 400 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search forms in this folder..."
                  value={tabsSearch}
                  onChange={e => setTabsSearch(e.target.value)}
                />
              </div>
            {/* Custom Scrollable Tab Bar */}
            <div className="scrollable-tabs-container" style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              borderBottom: '2px solid #e9ecef',
              marginBottom: '20px',
              paddingBottom: '0',
              scrollbarWidth: 'thin',
              scrollbarColor: '#007bff #f1f3f4'
            }}>
              <div className="tabs-wrapper" style={{ 
                display: 'inline-flex',
                minWidth: '100%',
                gap: '0'
              }}>
                {validFolderForms.map((form, idx) => (
                  <button
                    key={form._id}
                    onClick={() => setTabsActiveFormTab(form._id)}
                    className={`scrollable-tab ${activeTabIdx === idx ? 'active' : ''}`}
                    style={{
                      padding: '12px 20px',
                      border: 'none',
                      backgroundColor: activeTabIdx === idx ? '#007bff' : 'transparent',
                      color: activeTabIdx === idx ? '#ffffff' : '#6c757d',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTabIdx === idx ? '600' : '500',
                      whiteSpace: 'nowrap',
                      borderRadius: '8px 8px 0 0',
                      margin: '0 2px',
                      transition: 'all 0.2s ease',
                      minWidth: '120px',
                      maxWidth: '200px',
                      textAlign: 'center',
                      position: 'relative',
                      borderBottom: activeTabIdx === idx ? '3px solid #007bff' : '3px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTabIdx !== idx) {
                        e.target.style.backgroundColor = '#f8f9fa';
                        e.target.style.color = '#495057';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTabIdx !== idx) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#6c757d';
                      }
                    }}
                  >
                    <i className="ni ni-file-docs me-2" style={{ fontSize: '12px' }}></i>
                    <span style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'inline-block',
                      maxWidth: '140px',
                      verticalAlign: 'middle'
                    }}>
                      {form.heading || form.name || 'Untitled Form'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <TabContent activeTab={activeTabIdx} className="mt-4">
              {validFolderForms.map((form, idx) => (
                <TabPane tabId={idx} key={form._id}>
                  {/* Only render FormFillPage if form._id is valid */}
                  {form._id && form._id !== 'undefined' ? <FormFillPage id={form._id} /> : null}
                </TabPane>
              ))}
            </TabContent>
        </div>
      );
    }
    // Show folder grid
    return (
      <Row className="tab-view-folder-grid">
        {folders.map(folder => {
          const folderFormCount = formsData.filter(f => f.folderPath === folder).length;
          return (
            <Col key={folder} md={6} lg={4} className="mb-4">
              <Card 
                className="h-100 folder-card border-0 shadow-sm"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setTabsOpenFolder(folder);
                  setTabsActiveFormTab(null);
                }}
              >
                <CardBody>
                  <div className="d-flex align-items-center">
                    <i className="ni ni-folder"></i>
                    <span className="flex-grow-1 folder-name">{folder}</span>
                    <div className="d-flex align-items-center gap-1">
                      {folderFormCount > 0 && (
                        <Badge color="primary" size="sm">
                          {folderFormCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  // Grid View Renderer with Tabbed Form Fill
  const renderGridView = () => {
    if (gridOpenFolder) {
      // Show tabbed form fill for this folder
      const folderForms = formsData.filter(f => f.folderPath === gridOpenFolder);
      if (folderForms.length === 0) {
        return (
          <Alert color="info" className="text-center">
            <i className="ni ni-inbox me-2"></i>
            No forms in this folder.
          </Alert>
        );
      }
      const activeFormId = gridActiveFormTab || folderForms[0]._id;
      return (
        <Card className="border-0 shadow-sm">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Button color="secondary" size="sm" onClick={() => {
                setGridOpenFolder(null);
                setGridActiveFormTab(null);
              }}>
                <i className="ni ni-arrow-left me-1"></i> Back to Folders
              </Button>
              
              {/* Edit button for active form */}
              <div className="d-flex gap-2">
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => {
                    const activeForm = folderForms.find(f => f._id === activeFormId);
                    if (activeForm) {
                      navigate(`${process.env.PUBLIC_URL}/forms/fill/${activeForm._id}`);
                    }
                  }}
                >
                  <i className="ni ni-play me-1"></i> Fill Form
                </Button>
                <Button
                  color="outline-secondary"
                  size="sm"
                  onClick={() => {
                    const activeForm = folderForms.find(f => f._id === activeFormId);
                    if (activeForm) {
                      navigate(`/formBuilder/${activeForm._id}`);
                    }
                  }}
                >
                  <i className="ni ni-edit me-1"></i> Edit Form
                </Button>
              </div>
            </div>
            <Nav tabs>
              {folderForms.map((form, idx) => (
                <NavItem key={form._id}>
                  <NavLink
                    className={activeFormId === form._id ? 'active' : ''}
                    onClick={() => setGridActiveFormTab(form._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="ni ni-file-docs me-1"></i>
                    {form.heading}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>
            <TabContent activeTab={folderForms.findIndex(f => f._id === activeFormId)} className="mt-4">
              {folderForms.map((form, idx) => (
                <TabPane tabId={idx} key={form._id}>
                  <FormFillPage id={form._id} />
                </TabPane>
              ))}
            </TabContent>
          </CardBody>
        </Card>
      );
    }
    // Show folder grid
    return (
      <Row>
        {folders.map(folder => {
          const folderFormCount = formsData.filter(f => f.folderPath === folder).length;
          return (
            <Col key={folder} md={6} lg={4} className="mb-4">
              <Card 
                className="h-100 folder-card border-0 shadow-sm"
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => handleFolderClick(folder)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <CardBody>
                  <div className="d-flex align-items-center">
                    <i 
                      className="ni ni-folder me-2" 
                      style={{ 
                        color: '#007bff',
                        fontSize: '1.1rem'
                      }}
                    ></i>
                    <span className="flex-grow-1 folder-name">{folder}</span>
                    <div className="d-flex align-items-center gap-1">
                      {folderFormCount > 0 && (
                        <Badge color="primary" size="sm">
                          {folderFormCount}
                        </Badge>
                      )}
                    </div>
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
      <Container className="py-5">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-3 text-muted">Loading folders and forms...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert color="danger">
          <h4 className="alert-heading">Error Loading Data</h4>
          <p className="mb-0">{error}</p>
          <hr />
          <Button color="danger" onClick={() => window.location.reload()}>
            <i className="ni ni-refresh me-1"></i>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
          <DndProvider backend={HTML5Backend}>
        {/* Compact Professional Header */}
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
                  <i className="ni ni-folder me-2" style={{ fontSize: '1.1rem', color: '#007bff' }}></i>
                  Form Management
                </h5>
                <Button
                  color="success"
                  size="sm"
                  onClick={() => navigate(`${process.env.PUBLIC_URL}/formBuilder`)}
                  style={{ 
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
                    marginTop: '1.6rem',
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
                    borderRadius: '0'
                  }}
                >
                  <i className="ni ni-grid me-1" style={{ fontSize: '0.75rem' }}></i>
                  Grid
                </Button>
                <Button
                  color={viewMode === 'tabs' ? 'primary' : 'outline-secondary'}
                  onClick={() => setViewMode('tabs')}
                  style={{ 
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    borderRadius: viewMode === 'tabs' ? '0 4px 4px 0' : '0 4px 4px 0'
                  }}
                >
                  <i className="ni ni-folder me-1" style={{ fontSize: '0.75rem' }}></i>
                  Tabs
                </Button>
              </ButtonGroup>
            </div>
          </Container>
        </div>
        
        {/* Main Content Container */}
        <Container className="py-2" style={{ marginTop: '0.2rem' }}>

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner size="lg" />
          </div>
        ) : viewMode === 'tree' ? (
          /* Working Drag & Drop Tree View */
          <Card className="border-0 shadow-sm">
            <CardBody>
              <SimpleDragDropTree
                folders={treeData}
                forms={formsData}
                onMoveForm={handleMoveForm}
                isLoading={loading}
              />
            </CardBody>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View - Original */
          <Row>
            {folders.map(folder => {
              const folderFormCount = formsData.filter(f => f.folderPath === folder).length;
              return (
                <Col key={folder} md={6} lg={4} className="mb-4">
                  <Card 
                    className="h-100 folder-card border-0 shadow-sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleFolderClick(folder)}
                  >
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <i className="ni ni-folder"></i>
                        <span className="flex-grow-1 folder-name">{folder}</span>
                        <div className="d-flex align-items-center gap-1">
                          {folderFormCount > 0 && (
                            <Badge color="primary" size="sm">
                              {folderFormCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          // Tabs View
          renderTabsView()
        )}
      </Container>
    </DndProvider>
  );
} 