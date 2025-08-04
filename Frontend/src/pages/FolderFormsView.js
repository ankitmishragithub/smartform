import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Breadcrumb,
  BreadcrumbItem
} from 'reactstrap';
import { useFormAPI } from '../hooks/useFormAPI';
import { formUtils } from '../utils/formUtils';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import '../css/FolderStyles.css';
import '../css/FolderFormsView.css';

export default function FolderFormsView() {
  const { folderName } = useParams();
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const navigate = useNavigate();
  
  const { getFormsByFolder, deleteForm, error } = useFormAPI();

  useEffect(() => {
    if (folderName) {
      loadForms();
    }
  }, [folderName]);

  const loadForms = async () => {
    try {
      // Decode the folder name from URL encoding
      const decodedFolderName = decodeURIComponent(folderName);
      console.log('Loading forms for folder:', decodedFolderName);
      const formsData = await getFormsByFolder(decodedFolderName);
      console.log("formsData: ",formsData)
      setForms(formsData);
    } catch (err) {
      console.error("Failed to load forms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = (formId, formTitle) => {
    setFormToDelete({ id: formId, title: formTitle });
    setShowDeleteModal(true);
  };

  const confirmDeleteForm = async () => {
    if (formToDelete) {
      try {
        await deleteForm(formToDelete.id);
        setForms(forms.filter(f => f._id !== formToDelete.id));
        setFormToDelete(null);
      } catch (err) {
        console.error("Failed to delete form:", err);
        // You could add a toast notification here for better error handling
      }
    }
  };

  const toggleDeleteModal = () => {
    setShowDeleteModal(!showDeleteModal);
    if (showDeleteModal) {
      setFormToDelete(null);
    }
  };

  const getFormPreview = (form) => {
    const fields = form.schemaJson || [];
    const headingField = formUtils.getHeadingField(fields);
    return {
      title: headingField?.label || 'Untitled Form',
      fieldCount: fields.filter(f => f.type !== 'heading' && f.type !== 'folderName').length,
      createdAt: new Date(form.createdAt).toLocaleDateString()
    };
  };

  const filteredForms = forms.filter(form => {
    const preview = getFormPreview(form);
    return preview.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="folder-forms-container">
        <Container className="py-4">
          <div className="folder-forms-loading">
            <Spinner size="lg" />
            <p>Loading forms...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="folder-forms-container">
        <Container className="py-4">
          <Alert color="danger" className="folder-forms-error">
            <h4>Error Loading Forms</h4>
            <p>{error}</p>
            <Button color="primary" onClick={loadForms}>
              Try Again
            </Button>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="folder-forms-container">
      <Container className="py-4">
        {/* Breadcrumb Navigation */}
        {/* <div className="folder-forms-breadcrumb">
          <Breadcrumb>
            <BreadcrumbItem>
              <Button 
                color="link" 
                className="p-0" 
                onClick={() => navigate(`${process.env.PUBLIC_URL}/forms/folders`)}
              >
                Forms
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem active>
              {decodeURIComponent(folderName)}
            </BreadcrumbItem>
          </Breadcrumb>
        </div> */}

              {/* Header */}
        <div className="folder-forms-header d-flex justify-content-between align-items-center">
          <div>
            <h2>
              <i className="ni ni-folder"></i>
              {decodeURIComponent(folderName)}
            </h2>
            <p className="text-muted">
              {forms.length} form{forms.length !== 1 ? 's' : ''} in this folder
            </p>
          </div>
          <div className="header-actions">
            <Button
              className="folder-forms-btn folder-forms-btn-outline"
              onClick={() => navigate(`${process.env.PUBLIC_URL}/forms/folders`)}
            >
              Back to Folders
            </Button>
            <Button
              className="folder-forms-btn folder-forms-btn-primary"
              onClick={() => navigate(`${process.env.PUBLIC_URL}/formBuilder`)}
            >
              Create New Form
            </Button>
          </div>
        </div>

              {/* Search */}
        <div className="folder-forms-search">
          <input
            type="text"
            className="form-control"
            placeholder="Search forms in this folder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

              {/* Forms Grid */}
        {filteredForms.length === 0 ? (
          <div className="folder-forms-empty">
            <h4>No Forms Found</h4>
            <p className="text-muted">
              {searchTerm ? 'No forms match your search.' : 'No forms in this folder yet.'}
            </p>
            {!searchTerm && (
              <Button
                color="primary"
                onClick={() => navigate(`${process.env.PUBLIC_URL}/formBuilder`)}
              >
                Create Your First Form
              </Button>
            )}
          </div>
      ) : (
        <Row>
          {filteredForms.map(form => {
            const preview = getFormPreview(form);
            return (
              <Col key={form._id} md={6} lg={4} className="mb-4">
                <Card className="h-100 folder-forms-card">
                  <CardBody>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <CardTitle tag="h5" className="mb-0">
                        {preview.title}
                      </CardTitle>
                      <Badge>
                        {preview.fieldCount} field{preview.fieldCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <p className="text-muted small mb-3">
                      Created: {preview.createdAt}
                    </p>

                    <div className="folder-forms-card-actions">
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => navigate(`${process.env.PUBLIC_URL}/forms/fill/${form._id}`)}
                        className="flex-fill"
                      >
                        Fill Form
                      </Button>
                      <Button
                        color="outline-secondary"
                        size="sm"
                        onClick={() => navigate(`/formBuilder/${form._id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteForm(form._id, preview.title)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            );
          })}
        </Row>
              )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          toggle={toggleDeleteModal}
          onConfirm={confirmDeleteForm}
          title="Delete Form"
          message={`Are you sure you want to delete "${formToDelete?.title || 'this form'}"?`}
          subtitle="This action cannot be undone. All form responses will also be permanently deleted."
          confirmText="Delete Forever"
          cancelText="Cancel"
        />
      </Container>
    </div>
  );
} 