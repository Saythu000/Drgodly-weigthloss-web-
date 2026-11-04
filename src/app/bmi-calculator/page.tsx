import type { Metadata } from "next";
import BmiCalculatorPage from "@/components/BmiCalculatorPage";

export const metadata: Metadata = {
  title: "BMI Calculator",
  description: "Calculate your BMI and join the DrGodly WhatsApp group or mailing list.",
};

export default function BmiCalculatorRoute() {
  return <BmiCalculatorPage />;
}
