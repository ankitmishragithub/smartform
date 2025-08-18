import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // make sure you're using react-router
import Head from "../layout/head/Head";
import api from "../api/api";

const Homepage = () => {
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date()); // defaults to today
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formsRes, responsesRes] = await Promise.all([
          api.get("/forms"),
          api.get("/responses"),
        ]);
        setForms(Array.isArray(formsRes.data) ? formsRes.data : []);
        setResponses(Array.isArray(responsesRes.data) ? responsesRes.data : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErr("Could not load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getFormObject = (formId) => forms.find((f) => f._id === formId);

  const getFormLabel = (formId) => {
    const form = getFormObject(formId);
    if (!form) return "Unknown";
    const heading = form.schemaJson?.find((e) => e.type === "heading")?.label;
    const folder = form.schemaJson?.find((e) => e.type === "folderName")?.label;
    return heading || folder || "Untitled Form";
  };

  // Popularity: responses per form
  const responseCountByForm = useMemo(() => {
    const map = new Map();
    (responses || []).forEach((r) => {
      if (!r || !r.form) return;
      map.set(r.form, (map.get(r.form) || 0) + 1);
    });
    return map;
  }, [responses]);

  const sortedForms = useMemo(() => {
    return [...(forms || [])].sort((a, b) => {
      const cb = responseCountByForm.get(b?._id) || 0;
      const ca = responseCountByForm.get(a?._id) || 0;
      return cb - ca;
    });
  }, [forms, responseCountByForm]);

  // Responses for the selected day
  const sameDayResponses = useMemo(() => {
    if (!selectedDate || responses.length === 0) return [];
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const filtered = responses.filter((r) => {
      const ts = new Date(r.submittedAt).getTime();
      return ts >= start.getTime() && ts <= end.getTime();
    });
    // latest first
    filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return filtered;
  }, [selectedDate, responses]);
  

  if (loading) {
    return (
      <>
        <Head title="Homepage" />
        <p style={{ padding: 16 }}>Loading…</p>
      </>
    );
  }

  if (err) {
    return (
      <>
        <Head title="Homepage" />
        <p style={{ padding: 16, color: "#b00020" }}>{err}</p>
      </>
    );
  }

  return (
    <>
      <Head title="Homepage" />
      {/* <h1 style={{ padding: "16px 16px 0 16px", margin: 0 }}>Welcome to the Homepage</h1> */}

      {/* Submitted Forms by Date */}
      <div style={{ padding: 16 }}>
        <div
          style={{
            background: "linear-gradient(180deg, #ffffff, #fafafa)",
            border: "1px solid #eee",
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: "#1f2937" }}>
              <i className="ni ni-list text-primary" style={{ marginRight: 8 }}></i>
              Recent Forms
            </h3>
            <div>
              <label style={{ marginRight: 8, color: "#4b5563", fontWeight: 600 }}>Date:</label>
              <input
                type="date"
                value={selectedDate ? new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""}
                onChange={(e) => {
                  const val = e.target.value; // yyyy-mm-dd
                  if (!val) return setSelectedDate(null);
                  setSelectedDate(new Date(`${val}T00:00:00`));
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
          </div>

          {sameDayResponses.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {sameDayResponses.map((resp) => (
                <div key={resp._id} style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {getFormLabel(resp.form)}
                    </div>
                    {/* Keeping details minimal as requested */}
                  </div>
                  <button
                    onClick={() => navigate(`/forms/reedit/${resp.form}/${resp._id}`)}
                    title="Resubmit (edit this submission)"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid #111827",
                      background: "#111827",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Re-Fill
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#6b7280" }}>No forms submitted on the selected date.</div>
          )}
        </div>
      </div>

      {/* Existing forms grid */}
      <h5 style={{ margin: 0, color: "#1f2937" }}>
              <i className="ni ni-list text-primary" style={{ marginRight: 8 }}></i>
              Frequent Forms
            </h5>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
          padding: 16,
        }}
      >
        {sortedForms.map((form) => {
          const fieldCount = Array.isArray(form?.schemaJson) ? form.schemaJson.length : 0;
          const submissionCount = responseCountByForm.get(form._id) || 0;

          return (
            <div
              key={form._id}
              style={{
                background: "linear-gradient(180deg, #ffffff, #fafafa)",
                border: "1px solid #eee",
                borderRadius: 16,
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 170,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: 18,
                    lineHeight: 1.3,
                    fontWeight: 700,
                    color: "#1f2937",
                  }}
                  title={getFormLabel(form._id)}
                >
                  {getFormLabel(form._id)}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "#4b5563" }}>
                  <span>
                    <strong>{fieldCount}</strong> {fieldCount === 1 ? "field" : "fields"}
                  </span>
                  <span>Submissions: {submissionCount}</span>
                  <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/forms/fill/${form._id}`)}
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                Fill
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Homepage;
