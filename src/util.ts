import { z, ZodTypeAny } from 'zod';

export const htmxArray = <T extends ZodTypeAny>(
  schema: T,
): z.ZodType<z.output<T>[], z.ZodTypeDef, z.input<T> | z.input<T>[]> => {
  const singleValue = schema
    .optional()
    .transform((x) => (x == null ? [] : [x]));
  const arrayValue = z.array(schema);

  return z.union([singleValue, arrayValue]) as unknown as z.ZodType<
    z.output<T>[],
    z.ZodTypeDef,
    z.input<T> | z.input<T>[]
  >;
};
