import { useState } from "react";

import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

function ReactDatePicker() {
  const [selected, setSelected] = useState();

  return (
    <DayPicker
      animate
      mode="single"
      selected={selected}
      onSelect={setSelected}
      footer={
        selected ? `Selected: ${selected.toLocaleDateString()}` : "Pick a day."
      }
    />
  );
}
export {ReactDatePicker};