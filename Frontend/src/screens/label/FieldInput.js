// src/SettingsPanel/FieldInput.js
import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { TextField, Select, MenuItem } from "@mui/material";
import InputMask from "react-input-mask";

export default function FieldInput({
  name,
  label,
  type = "text",
  options,
  mask,
}) {
  const { control, register } = useFormContext();
  // masked input:
  if (mask) {
    return (
      <Controller
        name={name}
        control={control}
        render={() => (
          <InputMask mask={mask} {...register(name)}>
            {(props) => <TextField {...props} fullWidth label={label} />}
          </InputMask>
        )}
      />
    );
  }
  // dropdown select:
  if (options) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select {...field} fullWidth displayEmpty>
            <MenuItem value="" disabled>
              {label}
            </MenuItem>
            {options.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            ))}
          </Select>
        )}
      />
    );
  }
  // plain text/number
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField {...field} fullWidth label={label} type={type} />
      )}
    />
  );
}
