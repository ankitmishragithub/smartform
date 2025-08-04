// src/SettingsPanel/BooleanInput.js
import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Checkbox, FormControlLabel } from "@mui/material";

export default function BooleanInput({ name, label }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={<Checkbox {...field} checked={!!field.value} />}
          label={label}
        />
      )}
    />
  );
}
