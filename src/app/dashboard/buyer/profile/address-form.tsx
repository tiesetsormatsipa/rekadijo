"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Navigation } from "lucide-react";
import { addAddressAction } from "@/server/actions/buyer";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm" variant="outline">
      {pending ? "Adding..." : "Add address"}
    </Button>
  );
}

export function AddressForm() {
  const [state, formAction] = useActionState(addAddressAction, initialState);

  // 1. Convert fields to explicit React state variables to enable cross-component syncing
  const [label, setLabel] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [locating, setLocating] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Autocomplete
  useEffect(() => {
    if (!addressInputRef.current || typeof window === "undefined" || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      componentRestrictions: { country: "za" },
      fields: ["address_components", "geometry", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        toast.error("Please pick a valid verified option from the map suggestions.");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const components = place.address_components || [];

      let streetNumber = "";
      let route = "";
      let locality = "";
      let sublocality = "";
      let code = "";

      for (const component of components) {
        const types = component.types;
        if (types.includes("street_number")) streetNumber = component.long_name;
        if (types.includes("route")) route = component.long_name;
        if (types.includes("locality")) locality = component.long_name;
        if (types.includes("sublocality_level_1")) sublocality = component.long_name;
        if (types.includes("postal_code")) code = component.long_name;
      }

      const basicStreet = `${streetNumber} ${route}`.trim();
      const finalStreetLine = basicStreet 
        ? `${basicStreet}${sublocality ? ", " + sublocality : ""}`
        : place.formatted_address || "";

      // 2. Set the state variables directly so React captures the update lifecycle
      setAddressLine(finalStreetLine);
      setCity(locality || sublocality || "");
      setPostalCode(code);
      setLatitude(String(lat));
      setLongitude(String(lng));

      toast.success("Address variables auto-populated successfully!");
    });
  }, []);

  // Clean form fields cleanly on success
  useEffect(() => {
    if (state?.ok) {
      toast.success("New address asset added successfully.");
      setLabel("");
      setCity("");
      setAddressLine("");
      setPostalCode("");
      setLatitude("");
      setLongitude("");
      
      // Forces Next.js router cache to clear and opens up selection choices instantly
      window.location.reload();
    }
  }, [state]);

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        toast.success("Location captured — finish the address details and save.");
        setLocating(false);
      },
      () => {
        toast.error("Couldn't get your location. You can still enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-charcoal-700">Add a new address</p>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-full border border-charcoal-200 px-3 py-1.5 text-xs font-medium text-charcoal-600 hover:bg-charcoal-50 disabled:opacity-50"
        >
          <Navigation className="h-3.5 w-3.5" /> {locating ? "Locating..." : "Use current location"}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <input 
          name="label" 
          placeholder="Label (Home, Work...)" 
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required 
          className="rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" 
        />
        <input 
          name="city" 
          placeholder="City / Town" 
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required 
          className="rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" 
        />
      </div>
      
      <input 
        ref={addressInputRef}
        name="addressLine" 
        placeholder="Type or search street address..." 
        value={addressLine}
        onChange={(e) => setAddressLine(e.target.value)}
        required 
        className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" 
      />
      
      <div className="grid grid-cols-3 gap-3">
        <input 
          name="postalCode" 
          placeholder="Postal code" 
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          className="rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" 
        />
        <input 
          name="latitude" 
          type="number" 
          step="any" 
          placeholder="Latitude" 
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          className="rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" 
        />
        <input 
          name="longitude" 
          type="number" 
          step="any" 
          placeholder="Longitude" 
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          className="rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" 
        />
      </div>
      
      <p className="text-xs text-charcoal-400">
        Start typing your street address to see real map suggestions, or use current location to calculate coordinates directly via browser.
      </p>
      
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
