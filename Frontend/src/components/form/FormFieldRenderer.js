import React from 'react';
import { Input, FormGroup, Label } from 'reactstrap';

/**
 * Reusable form field renderer component
 * Handles rendering of all form field types consistently
 */
const FormFieldRenderer = ({ 
  field, 
  value, 
  onChange, 
  className = "form-control",
  disabled = false,
  preview = false 
}) => {
  const handleChange = (newValue) => {
    onChange(field.id, newValue);
  };

  const getOptionLabel = (option) => {
    return typeof option === "object" && option !== null ? option.question : option;
  };

  const renderInput = () => {
    const commonProps = {
      disabled,
      className: preview ? className : `${className} modern-input`,
      required: field.required
    };

    switch (field.type) {
      case "text":
      case "email":
      case "url":
      case "password":
        return (
          <Input
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            value={value || ""}
            onChange={(e) => {
              const newValue = e.target.value;
              if (field.maxLength && newValue.length > field.maxLength) {
                return; // Prevent exceeding maxLength
              }
              handleChange(newValue);
            }}
            onKeyPress={(e) => {
              if (field.maxLength && (value || "").length >= field.maxLength) {
                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                }
              }
            }}
          />
        );
      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            value={value || ""}
            onChange={(e) => {
              const newValue = e.target.value;
              const numValue = parseFloat(newValue);
              
              if (field.min !== undefined && numValue < field.min) {
                return; // Prevent going below min
              }
              if (field.max !== undefined && numValue > field.max) {
                return; // Prevent going above max
              }
              handleChange(newValue);
            }}
          />
        );
      case "phone":
        return (
          <Input
            {...commonProps}
            type="tel"
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            value={value || ""}
            onChange={(e) => {
              // Only allow numbers, spaces, dashes, parentheses, and plus sign
              let phoneValue = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, '');
              
              // Apply maxLength limit
              if (field.maxLength && phoneValue.length > field.maxLength) {
                phoneValue = phoneValue.slice(0, field.maxLength);
              }
              
              handleChange(phoneValue);
            }}
            onKeyPress={(e) => {
              // Prevent non-numeric characters (except allowed symbols)
              const allowedChars = /[0-9\s\-\(\)\+]/;
              if (!allowedChars.test(e.key)) {
                e.preventDefault();
                return;
              }
              
              // Prevent exceeding maxLength
              if (field.maxLength && (value || "").length >= field.maxLength) {
                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                }
              }
            }}
          />
        );
      case "datetime":
        const getCurrentDate = () => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        return (
          <Input
            {...commonProps}
            type="date"
            value={value || field.value || getCurrentDate()}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      case "day": {
        const weekdays = [
          "Sunday", "Monday", "Tuesday", "Wednesday", 
          "Thursday", "Friday", "Saturday"
        ];
        const currentDay = weekdays[new Date().getDay()];
        return (
          <Input
            {...commonProps}
            type="select"
            value={value || field.value || currentDay}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="" disabled>Choose a day…</option>
            {weekdays.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Input>
        );
      }
      case "time":
        return (
          <Input
            {...commonProps}
            type="time"
            value={value || field.value || new Date().toTimeString().slice(0, 5)}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      case "signature":
        return (
          <Input
            {...commonProps}
            type="text"
            placeholder="Type your signature here..."
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            style={{
              fontFamily: 'cursive, serif',
              fontSize: '16px',
              borderBottom: '2px solid #000',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderRadius: '0',
              padding: '10px 0',
              backgroundColor: 'transparent'
            }}
          />
        );
      case "well":
        return (
          <div
            style={{
              padding: "1rem",
              border: "1px solid #ddd",
              borderRadius: "8px",
              marginBottom: "1rem",
              backgroundColor: "#f8f9fa"
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              {field.label || "Content Box"}
            </div>
            <div style={{ color: "#6c757d", fontStyle: "italic" }}>
              Content area - drag fields here
            </div>
          </div>
        );
      case "content":
        return (
          <div
            style={{
              padding: "1rem",
              border: "1px solid #e9ecef",
              borderRadius: "4px",
              backgroundColor: "#fff",
              minHeight: "100px"
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: "#495057" }}>
              {field.label || "Content Box"}
            </div>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: field.richText || '<p>Enter your formatted content here...</p>' 
              }}
              style={{ 
                color: "#495057",
                lineHeight: "1.6"
              }}
            />
          </div>
        );



      case "textarea":
        return (
          <Input
            {...commonProps}
            type="textarea"
            rows={field.rows || "3"}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            value={value || ""}
            onChange={(e) => {
              const newValue = e.target.value;
              if (field.maxLength && newValue.length > field.maxLength) {
                return; // Prevent exceeding maxLength
              }
              handleChange(newValue);
            }}
            onKeyPress={(e) => {
              if (field.maxLength && (value || "").length >= field.maxLength) {
                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                }
              }
            }}
          />
        );

      case "select":
        return (
          <Input
            {...commonProps}
            type="select"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="" disabled>
              Choose…
            </option>
            {(field.options || []).map((option, index) => {
              const label = getOptionLabel(option);
              return (
                <option key={index} value={label}>
                  {label}
                </option>
              );
            })}
          </Input>
        );

      case "checkbox":
        return (
          <FormGroup check>
            <Label check>
              <Input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled}
              />{" "}
              {field.label}
            </Label>
          </FormGroup>
        );

      case "radio":
        return (
          <div>
            {(field.options || []).map((option, index) => {
              const label = getOptionLabel(option);
              return (
                <FormGroup check key={index}>
                  <Label check>
                    <Input
                      type="radio"
                      name={field.id}
                      value={label}
                      checked={value === label}
                      onChange={(e) => handleChange(e.target.value)}
                      disabled={disabled}
                    />{" "}
                    {label}
                  </Label>
                </FormGroup>
              );
            })}
          </div>
        );

      case "selectboxes": {
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div>
            {(field.options || []).map((option, index) => {
              const label = getOptionLabel(option);
              return (
                <FormGroup check key={index}>
                  <Label check>
                    <Input
                      type="checkbox"
                      checked={selectedValues.includes(label)}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, label]
                          : selectedValues.filter(v => v !== label);
                        handleChange(newValues);
                      }}
                      disabled={disabled}
                    />{" "}
                    {label}
                  </Label>
                </FormGroup>
              );
            })}
          </div>
        );
      }





      default:
        return (
          <Input
            type="text"
            disabled
            placeholder="Unsupported field type"
            className={className}
          />
        );
    }
  };

  // Don't render label for checkbox in preview mode (label is inline)
  if (field.type === "checkbox" && preview) {
    return renderInput();
  }



  return (
    <FormGroup className="mb-3">
      {field.type !== "checkbox" && (
        <Label
          for={field.id}
          style={{
            fontWeight: "600",
            marginBottom: "0.5rem",
            display: "block",
            color: "#34495e"
          }}
        >
          {field.label}
          {field.required && " *"}
        </Label>
      )}
      {renderInput()}
    </FormGroup>
  );
};

export default FormFieldRenderer; 