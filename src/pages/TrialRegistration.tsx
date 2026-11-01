import React from "react";
import AuthFlow from "@/components/auth/AuthFlow";

export type RecruiterType = "in_house" | "freelance";

export default function TrialRegistration() {
  return <AuthFlow initialMode="signup" />;
}
