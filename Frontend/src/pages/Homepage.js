import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // make sure you're using react-router
import Head from "../layout/head/Head";
import api from "../api/api";

const Homepage = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get("/forms");
        setForms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErr("Could not load forms");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "—";
    // Example output: 7/26/2025 (Asia/Kolkata)
    return new Date(iso).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" });
  };

  const getTitle = (form) => {
    // Prefer an explicit title if your API provides it:
    if (form.title) return form.title;

    // Try to infer from schema (common in form builders)
    const fromSchema =
      form?.schemaJson?.find?.(b => b?.formTitle || b?.title)?.formTitle ||
      form?.schemaJson?.find?.(b => b?.title)?.title;

    // Fallback to your example title or a generic label
    return fromSchema || "Filter Efficiency Monitoring Report";
  };

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
      <h1 style={{ padding: "16px 16px 0 16px", margin: 0 }}>Welcome to the Homepage</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
          padding: 16,
        }}
      >
        {forms.map((form) => {
          const fieldCount = Array.isArray(form?.schemaJson) ? form.schemaJson.length : 0;

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
                  title={getTitle(form)}
                >
                  {getTitle(form)}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "#4b5563" }}>
                  <span>
                    <strong>{fieldCount}</strong> {fieldCount === 1 ? "field" : "fields"}
                  </span>
                  <span>Created: {formatDate(form.createdAt)}</span>
                </div>
              </div>

              <button
              ///forms/fill/6883d5c14e326fda161aa72f
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
