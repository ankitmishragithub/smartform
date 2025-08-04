import React from "react";

export default function renderCanvasInput(f) {
  if (
    [
      "text",
      "email",
      "url",
      "number",
      "password",
      "phone",
      "currency",
    ].includes(f.type)
  ) {
    return <input type={f.type} disabled className="input-field" />;
  }
  if (["textarea", "address", "signature"].includes(f.type)) {
    return <textarea disabled className="textarea-field" />;
  }
  if (["radio", "checkbox", "selectboxes"].includes(f.type)) {
    return f.options?.map((o, i) => (
      <div key={i}>
        <input type={f.type === "checkbox" ? "checkbox" : "radio"} disabled />{" "}
        {o}
      </div>
    ));
  }
  if (f.type === "select") {
    return (
      <select disabled className="input-field">
        {f.options?.map((o, i) => (
          <option key={i}>{o}</option>
        ))}
      </select>
    );
  }
  if (["range", "survey"].includes(f.type)) {
    return <input type="range" disabled className="input-field" />;
  }
  if (
    [
      "htmlelement",
      "content",
      "panel",
      "well",
      "fieldset",
      "columns",
      "tabs",
      "table",
      "container",
      "datagrid",
      "editgrid",
      "datamap",
    ].includes(f.type)
  ) {
    return <div className="placeholder-block">{f.label} Block</div>;
  }
  if (f.type === "hidden") {
    return <input type="hidden" />;
  }
  if (["nested", "form", "custom", "file"].includes(f.type)) {
    return <div className="placeholder-block">{f.label} Component</div>;
  }
  return null;
}
