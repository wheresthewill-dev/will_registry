"use client";
import React from "react";
import { Country, CountryDropdown } from "@/components/ui/country-dropdown";

type CountrySelectProps = {
  id: string;
  value?: string; // alpha3 code
  onChange?: (value: string) => void;
};

export const CountrySelect: React.FC<CountrySelectProps> = ({
  id,
  value,
  onChange,
}) => {
  const [selected, setSelected] = React.useState<Country | null>(null);

  const handleSelect = (country: Country) => {
    setSelected(country);
    // onChange?.(country.alpha3);
    onChange?.(country.name); // Uncomment this line if you want to use the country name instead of alpha3 code
  };

  return (
    <CountryDropdown
      id={id} // Pass the id to the dropdown for proper linking
      defaultValue={value}
      onChange={handleSelect}
    />
  );
};
