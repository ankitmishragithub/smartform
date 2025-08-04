// src/SettingsPanel/RichInput.js
import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import ReactQuill from "react-quill";
import AceEditor from "react-ace";
import DatePicker from "react-datepicker";
import CurrencyInput from "react-currency-input-field";
import "react-quill/dist/quill.snow.css";
import "react-datepicker/dist/react-datepicker.css";
import "brace/mode/html";
import "brace/theme/github";

export default function RichInput({ name, editor }) {
  const { control } = useFormContext();
  switch (editor) {
    case "RawHTML":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <AceEditor
              mode="html"
              theme="github"
              onChange={field.onChange}
              value={field.value}
              width="100%"
            />
          )}
        />
      );
    case "RichText":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <ReactQuill 
              {...field}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'color': [] }, { 'background': [] }],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'align': [] }],
                  ['link', 'image'],
                  ['clean']
                ]
              }}
              formats={[
                'header',
                'bold', 'italic', 'underline', 'strike',
                'color', 'background',
                'list', 'bullet',
                'align',
                'link', 'image'
              ]}
              style={{ height: '200px' }}
            />
          )}
        />
      );
    case "DefaultValue": // date only
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) => <DatePicker {...field} />}
        />
      );
    case "DateTime":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <DatePicker {...field} showTimeSelect dateFormat="Pp" />
          )}
        />
      );
    case "Currency":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) => <CurrencyInput {...field} fullWidth />}
        />
      );
    case "Date":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) => <DatePicker {...field} dateFormat="yyyy-MM-dd" />}
        />
      );
    case "Time":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) => <DatePicker {...field} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa" />}
        />
      );
    case "Signature":
      return (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <div style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>
              <p>Signature pad would be rendered here</p>
              <input type="text" {...field} placeholder="Type your name as signature" />
            </div>
          )}
        />
      );
    default:
      return null;
  }
}
