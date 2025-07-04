export function advanceSettingsKey(url: string) {
  //generate advance settings key
  let key = `${url}-advance-settings`;
  return key;
}


export const advanceGeneralSettingsKey: string = "advance-general-settings";


export type AdvanceSettings = {
  specialCharacters: boolean;
  allowSpecialCharactersPhone: boolean;
  pasteCompletePhone: boolean;
  showFloatingButton: boolean;
  overRidePhone: boolean;
  overRidePhoneValue: string
}


export type GeneralSettings = {
  addFirstAndLastNameToAddress: boolean;
  addCompanyToAddress: boolean;
  addAddress1ToAddress: boolean;
  addAddress2ToAddress: boolean;
  addCityToAddress: boolean;
  addStateToAddress: boolean;
  addZipCodeToAddress: boolean;
  addPhoneToAddress: boolean;
  addEmailToAddress: boolean;
  darkMode: boolean;
  aiAPI: string;

}

export enum AIApiType {
  Gemini = "Gemini",
  GPT = "GPT",
  Vertex = "Vertex",
}
