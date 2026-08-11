type GooglePlaceComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleAutocompletePlace = {
  address_components?: GooglePlaceComponent[];
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  name?: string;
};

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: {
              componentRestrictions?: { country: string | string[] };
              fields?: string[];
            }
          ) => {
            addListener: (eventName: "place_changed", handler: () => void) => void;
            getPlace: () => GoogleAutocompletePlace;
          };
        };
      };
    };
  }
}

export {};
