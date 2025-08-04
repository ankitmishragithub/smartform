// src/SettingsPanel/ArrayInput.js
import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { TextField, Button } from "@mui/material";

export default function ArrayInput({ name, label }) {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  return (
    <div>
      {fields.map((item, i) => (
        <div key={item.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Controller
            name={`${name}.${i}${typeof item === "object" ? ".question" : ""}`}
            control={control}
            render={({ field }) => (
              <TextField {...field} label={`${label} ${i + 1}`} fullWidth />
            )}
          />
          <Button onClick={() => remove(i)}>✕</Button>
          {i < fields.length - 1 && (
            <Button onClick={() => move(i, i + 1)}>↓</Button>
          )}
        </div>
      ))}
      <Button
        onClick={() =>
          append(typeof fields[0] === "object" ? { question: "" } : "")
        }
      >
        Add {label}
      </Button>
    </div>
  );
}
