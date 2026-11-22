import type { FormikProps } from 'formik';

/** Value, change, blur and error props for a TextField bound to a Formik field. */
export const fieldBinder =
  <T extends Record<string, string>>(form: FormikProps<T>) =>
  (name: keyof T & string) => ({
    value: form.values[name],
    onChangeText: form.handleChange(name),
    onBlur: form.handleBlur(name),
    error: (form.touched[name] && (form.errors[name] as string | undefined)) || undefined,
  });
