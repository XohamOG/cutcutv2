export const SITE = {
  name: "viralbits",
  domain: "viralbits.xyz",
  /** Public by design: it can only deliver form messages to the owner's inbox. */
  feedbackKey: process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "da57939b-9b58-4d6f-b97e-e12b1826b61a",
};
