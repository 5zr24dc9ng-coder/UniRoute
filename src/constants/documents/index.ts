import type { CountryId, StudyType } from "../../types";
import { US_DOCUMENTS } from "./us";
import { UK_DOCUMENTS } from "./uk";
import { AU_DOCUMENTS } from "./au";
import { CA_DOCUMENTS } from "./ca";

export type { DocumentMaster } from "./types";
export { DOCUMENT_CATEGORY_ORDER } from "./types";

export const MASTER_DOCUMENTS = [
  ...US_DOCUMENTS,
  ...UK_DOCUMENTS,
  ...AU_DOCUMENTS,
  ...CA_DOCUMENTS,
];

export function getDocumentsByCountryAndType(country: CountryId, type: StudyType) {
  return MASTER_DOCUMENTS.filter(
    (doc) => doc.countries.includes(country) && doc.types.includes(type)
  );
}
