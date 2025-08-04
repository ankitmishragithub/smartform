import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody, CardTitle,
  Button, Spinner, Alert, Badge
} from 'reactstrap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import api from '../../api/api';
import '../../css/FolderStyles.css';
import './FormAnalytics.css';

export default function FormAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalForms: 0,
    totalResponses: 0,
    activeForms: 0,
    recentSubmissions: 0,
    topForms: [],
    statusDistribution: [],
    dailySubmissions: []
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [formsRes, responsesRes] = await Promise.all([
        api.get('/forms'),
        api.get('/responses')
      ]);

      const forms = formsRes.data || [];
      const responses = responsesRes.data || [];
      
      const analyticsData = calculateAnalytics(forms, responses);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (forms, responses) => {
    const getFormLabel = (formId) => {
      const form = forms.find(f => f._id === formId);
      if (!form) return "Unknown";
      const folder = form.schemaJson?.find(e => e.type === "folderName")?.label;
      const heading = form.schemaJson?.find(e => e.type === "heading")?.label;
      return folder || heading || "Untitled Form";
    };

// Updated getSubmissionStatus in FormAnalytics.jsx
const getSubmissionStatus = (response) => {
  const form = forms.find(f => f._id === response.form);
  if (!form || !form.schemaJson) return 'unknown';
  
  // Recursive function to get all form fields from nested structures
  const getAllFormFields = (schemaNodes) => {
    let fields = [];
    
    if (!Array.isArray(schemaNodes)) return fields;
    
    schemaNodes.forEach(node => {
      if (!node || !node.type) return;
      
      // Skip container/display types
      if (['folderName', 'heading', 'content', 'htmlelement'].includes(node.type)) {
        return;
      }
      
      // Handle nested containers
      if (node.type === 'tabs' && node.tabs) {
        node.tabs.forEach(tab => {
          if (tab.children) {
            fields = fields.concat(getAllFormFields(tab.children));
          }
        });
      } else if (node.type === 'columns' && node.children) {
        node.children.forEach(column => {
          if (Array.isArray(column)) {
            fields = fields.concat(getAllFormFields(column));
          }
        });
      } else if (node.type === 'table' && node.children) {
        node.children.forEach(row => {
          if (Array.isArray(row)) {
            row.forEach(cell => {
              if (Array.isArray(cell)) {
                fields = fields.concat(getAllFormFields(cell));
              }
            });
          }
        });
      } else {
        // This is a form field
        fields.push(node);
      }
    });
    
    return fields;
  };
  
  const formFields = getAllFormFields(form.schemaJson);
  
  if (formFields.length === 0) return 'complete';
  
  const answeredFields = formFields.filter(field => {
    const answer = response.answers?.[field.id];
    return answer && answer.toString().trim() !== '';
  });
  
  const completionRate = answeredFields.length / formFields.length;
  
  if (completionRate === 1) return 'complete';
  if (completionRate >= 0.5) return 'partial';
  return 'incomplete';
};


    // Recent submissions (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSubmissions = responses.filter(r => {
      const submissionDate = new Date(r.submittedAt || r.createdAt);
      return submissionDate > weekAgo;
    }).length;

    // Top forms by response count
    const formResponseCounts = forms.map(form => ({
      id: form._id,
      name: getFormLabel(form._id).substring(0, 25),
      fullName: getFormLabel(form._id),
      responses: responses.filter(r => r.form === form._id).length,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    })).sort((a, b) => b.responses - a.responses).slice(0, 10);

    // Status distribution
    const statusCounts = {
      complete: 0,
      partial: 0,
      incomplete: 0,
      unknown: 0
    };

    responses.forEach(response => {
      const status = getSubmissionStatus(response);
      statusCounts[status]++;
    });

    const statusDistribution = [
      { name: 'Complete', value: statusCounts.complete, color: '#28a745', icon: '✅' },
      { name: 'Partial', value: statusCounts.partial, color: '#ffc107', icon: '⏳' },
      { name: 'Incomplete', value: statusCounts.incomplete, color: '#dc3545', icon: '❌' },
      { name: 'Unknown', value: statusCounts.unknown, color: '#6c757d', icon: '❓' }
    ].filter(item => item.value > 0);

    // Daily submissions for last 14 days
    const dailySubmissions = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = responses.filter(r => {
        const responseDate = format(new Date(r.submittedAt || r.createdAt), 'yyyy-MM-dd');
        return responseDate === dateStr;
      }).length;
      
      dailySubmissions.push({
        date: format(date, 'MMM dd'),
        submissions: count,
        fullDate: dateStr
      });
    }

    return {
      totalForms: forms.length,
      totalResponses: responses.length,
      activeForms: forms.filter(f => f.schemaJson && f.schemaJson.length > 0).length,
      recentSubmissions,
      topForms: formResponseCounts,
      statusDistribution,
      dailySubmissions
    };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#ffc0cb'];

  if (loading) {
    return (
      <div className="analytics-loading">
        <Container fluid className="px-4 py-3">
          <div className="d-flex align-items-center justify-center">
            <Spinner color="primary" className="me-2" />
            <span>Loading Analytics Dashboard...</span>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="analytics-header">
        <Container fluid className="px-4 py-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <h4 className="analytics-title">
                <i className="ni ni-chart-bar-32 me-2"></i>
                Form Analytics Dashboard
              </h4>
              <Badge color="info" pill className="analytics-badge">
                Real-time Data
              </Badge>
            </div>
            <Button
              color="primary"
              size="sm"
              onClick={() => navigate(`${process.env.PUBLIC_URL}/response-reports`)}
              className="analytics-nav-btn"
            >
              <i className="ni ni-bullet-list-67 me-1"></i>
              Detailed Reports
            </Button>
          </div>
        </Container>
      </div>
      
      <Container className="analytics-container">
        {/* KPI Cards */}
        <Row className="analytics-kpi-row">
          <Col lg={3} md={6} className="mb-4">
            <Card className="analytics-kpi-card kpi-primary">
              <CardBody>
                <div className="kpi-content">
                  <div className="kpi-icon">
                    <i className="ni ni-collection"></i>
                  </div>
                  <div className="kpi-details">
                    <h2 className="kpi-number">{analytics.totalForms}</h2>
                    <p className="kpi-label">Total Forms</p>
                    <small className="kpi-trend text-success">
                      <i className="ni ni-trend-up me-1"></i>
                      {analytics.activeForms} active
                    </small>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="analytics-kpi-card kpi-success">
              <CardBody>
                <div className="kpi-content">
                  <div className="kpi-icon">
                    <i className="ni ni-check-circle"></i>
                  </div>
                  <div className="kpi-details">
                    <h2 className="kpi-number">{analytics.totalResponses}</h2>
                    <p className="kpi-label">Total Responses</p>
                    <small className="kpi-trend text-info">
                      <i className="ni ni-calendar-grid-58 me-1"></i>
                      All time submissions
                    </small>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="analytics-kpi-card kpi-warning">
              <CardBody>
                <div className="kpi-content">
                  <div className="kpi-icon">
                    <i className="ni ni-time-alarm"></i>
                  </div>
                  <div className="kpi-details">
                    <h2 className="kpi-number">{analytics.recentSubmissions}</h2>
                    <p className="kpi-label">Recent (7 days)</p>
                    <small className="kpi-trend text-warning">
                      <i className="ni ni-chart-bar-32 me-1"></i>
                      This week's activity
                    </small>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="analytics-kpi-card kpi-danger">
              <CardBody>
                <div className="kpi-content">
                  <div className="kpi-icon">
                    <i className="ni ni-satisfied"></i>
                  </div>
                  <div className="kpi-details">
                    <h2 className="kpi-number">
                      {analytics.totalResponses > 0 
                        ? Math.round((analytics.statusDistribution.find(s => s.name === 'Complete')?.value || 0) / analytics.totalResponses * 100)
                        : 0}%
                    </h2>
                    <p className="kpi-label">Completion Rate</p>
                    <small className="kpi-trend text-success">
                      <i className="ni ni-check-bold me-1"></i>
                      Average completion
                    </small>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Main Charts Row */}
        <Row className="mb-4">
          {/* Daily Submissions Trend - Full Width */}
          <Col lg={12} className="mb-4">
            <Card className="analytics-chart-card">
              <CardBody>
                <CardTitle tag="h6" className="chart-title">
                  <i className="ni ni-chart-line me-2"></i>
                  Daily Submissions Trend (14 Days)
                </CardTitle>
                <div className="chart-container" style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dailySubmissions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        stroke="#888"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#888"
                      />
                      <Tooltip 
                        labelFormatter={(value) => `Date: ${value}`}
                        formatter={(value) => [value, 'Submissions']}
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="submissions" 
                        stroke="#667eea" 
                        fill="url(#colorGradient)"
                        strokeWidth={3}
                        dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#667eea', strokeWidth: 2 }}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Secondary Charts Row */}
        <Row className="mb-4">
          {/* Top Forms by Responses */}
          <Col lg={8} className="mb-4">
            <Card className="analytics-chart-card">
              <CardBody>
                <CardTitle tag="h6" className="chart-title">
                  <i className="ni ni-trophy me-2"></i>
                  Top Forms by Response Count
                </CardTitle>
                <div className="chart-container" style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.topForms} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 11 }}
                        stroke="#888"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#888"
                      />
                      <Tooltip 
                        formatter={(value, name, props) => [
                          value, 
                          'Responses'
                        ]}
                        labelFormatter={(label, payload) => 
                          payload && payload[0] ? payload[0].payload.fullName : label
                        }
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="responses" 
                        radius={[4, 4, 0, 0]}
                      >
                        {analytics.topForms.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Status Distribution */}
          <Col lg={4} className="mb-4">
            <Card className="analytics-chart-card">
              <CardBody>
                <CardTitle tag="h6" className="chart-title">
                  <i className="ni ni-chart-pie-35 me-2"></i>
                  Response Status Distribution
                </CardTitle>
                <div className="chart-container" style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={analytics.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {analytics.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [value, `${name} Responses`]}
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Legend */}
                <div className="status-legend mt-3">
                  {analytics.statusDistribution.map((status, index) => (
                    <div key={index} className="status-legend-item">
                      <div 
                        className="status-color-box"
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <span className="status-text">
                        {status.icon} {status.name}: {status.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Enhanced Quick Stats */}
        <Row>
          <Col lg={12}>
            <Card className="analytics-summary-card">
              <CardBody>
                <CardTitle tag="h6" className="chart-title">
                  <i className="ni ni-bulb-61 me-2"></i>
                  Key Insights & Metrics
                </CardTitle>
                <Row>
                  <Col lg={3} md={6} className="text-center mb-3">
                    <div className="insight-item">
                      <div className="insight-icon text-primary">
                        <i className="ni ni-crown"></i>
                      </div>
                      <h4 className="insight-number text-primary">
                        {analytics.topForms[0]?.responses || 0}
                      </h4>
                      <p className="insight-label">
                        Most Popular Form
                      </p>
                      <small className="text-muted">
                        {analytics.topForms[0]?.fullName || 'No forms yet'}
                      </small>
                    </div>
                  </Col>
                  <Col lg={3} md={6} className="text-center mb-3">
                    <div className="insight-item">
                      <div className="insight-icon text-success">
                        <i className="ni ni-chart-bar-32"></i>
                      </div>
                      <h4 className="insight-number text-success">
                        {Math.max(...analytics.dailySubmissions.map(d => d.submissions), 0)}
                      </h4>
                      <p className="insight-label">
                        Peak Day Submissions
                      </p>
                      <small className="text-muted">
                        Highest single day activity
                      </small>
                    </div>
                  </Col>
                  <Col lg={3} md={6} className="text-center mb-3">
                    <div className="insight-item">
                      <div className="insight-icon text-warning">
                        <i className="ni ni-calendar-grid-58"></i>
                      </div>
                      <h4 className="insight-number text-warning">
                        {analytics.dailySubmissions.length > 0 
                          ? Math.round(analytics.dailySubmissions.reduce((sum, day) => sum + day.submissions, 0) / analytics.dailySubmissions.length * 10) / 10
                          : 0}
                      </h4>
                      <p className="insight-label">
                        Daily Average
                      </p>
                      <small className="text-muted">
                        Submissions per day
                      </small>
                    </div>
                  </Col>
                  <Col lg={3} md={6} className="text-center mb-3">
                    <div className="insight-item">
                      <div className="insight-icon text-info">
                        <i className="ni ni-spaceship"></i>
                      </div>
                      <h4 className="insight-number text-info">
                        {analytics.topForms.length}
                      </h4>
                      <p className="insight-label">
                        Active Forms
                      </p>
                      <small className="text-muted">
                        Forms receiving responses
                      </small>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
