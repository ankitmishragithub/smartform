// src/SettingsPanel/SettingsPanel.js
import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import FieldInput from "./FieldInput";
import BooleanInput from "./BooleanInput";
import ArrayInput from "./ArrayInput";
import RichInput from "./RichInput";
import { fieldConfig } from "../../settingsConfig";
import { Button } from "@mui/material";

export default function SettingsPanel({ field, onChange }) {
  const methods = useForm({ defaultValues: field || {} });
  const { handleSubmit, reset } = methods;

  useEffect(() => {
    reset(field || {});
  }, [field, reset]);

  if (!field) return <div>Select a field to edit</div>;

  const { editors } = fieldConfig[field.type] || [];

  // Normalize options to string[] before calling onChange
  const handleSave = (data) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([key, val]) => {
        // Only unwrap objects in arrays for keys other than "options"
        if (Array.isArray(val) && key !== "options") {
          return [
            key,
            val.map((item) => {
              if (item && typeof item === "object") {
                // unwrap common props
                return (
                  item.question ??
                  item.value ??
                  item.label ??
                  JSON.stringify(item)
                );
              }
              return item;
            }),
          ];
        }
        // leave "options" arrays (and any other arrays) intact
        return [key, val];
      })
    );

    // merge cleaned values back into the original field so we don't drop type, options, etc.
    onChange({
      ...field,
      ...cleaned,
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleSave)} style={{ padding: 16 }}>
        {editors.map((name) => {
          // simple text/number inputs
          if (
            [
              "Label",
              "Key",
              "Placeholder",
              "Pattern",
              "Headers",
              "Labels",
              "Action",
              "Style",
              "Mappings",
              "PhoneMask",
              "Autocomplete",
              "Min",
              "Max",
              "Step",
              "FormId",
              "EmailValidation",
              "URLValidation",
            ].includes(name)
          ) {
            const props = { name: name.toLowerCase(), label: name };
            if (name === "PhoneMask") props.mask = "(999) 999-9999";
            if (name === "Autocomplete") props.options = ["google", "mapbox"];
            if (["Min", "Max", "Step"].includes(name)) props.type = "number";
            if (["EmailValidation", "URLValidation"].includes(name)) props.type = "checkbox";
            return <FieldInput key={name} {...props} />;
          }

          // numeric-only inputs
          if (
            ["MaxLength", "MinLength", "Rows", "Cols", "Gap", "Default"].includes(
              name
            )
          ) {
            return (
              <FieldInput
                key={name}
                name={name === "MaxLength" ? "maxLength" : name === "MinLength" ? "minLength" : name.toLowerCase()}
                label={name}
                type="number"
              />
            );
          }

          // booleans
          if (
            ["Required", "Multiple", "Collapsible", "Repeatable"].includes(
              name
            )
          ) {
            return (
              <BooleanInput
                key={name}
                name={name.toLowerCase()}
                label={name}
              />
            );
          }

          // arrays (Options, Tags, SurveyQuestions)
          if (["Options", "Tags", "SurveyQuestions"].includes(name)) {
            return (
              <ArrayInput
                key={name}
                name={name.charAt(0).toLowerCase() + name.slice(1)}
                label={name}
              />
            );
          }

          // rich editors (DefaultValue, DateTime, etc.)
          if (["DateTime", "Date", "Time", "Currency", "Signature"].includes(name)) {
            return (
              <RichInput
                key={name}
                name={name.toLowerCase()}
                editor={name}
              />
            );
          }

          // rich editors (DefaultValue, DateTime, etc.)
          return (
            <RichInput
              key={name}
              name={
                ["DefaultValue", "DateTime", "Currency"].includes(name)
                  ? "defaultValue"
                  : name.toLowerCase()
              }
              editor={name}
            />
          );
        })}

        <Button variant="contained" color="primary" type="submit">
          Save
        </Button>
      </form>
    </FormProvider>
  );
}
